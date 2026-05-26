import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { Repository } from 'typeorm';
import type { SkillStreamEvent } from '@laws/shared';
import { SKILLS, type SkillId } from '@laws/skill-prompts';
import { SkillRun, SkillRunKind } from './entities/skill-run.entity';
import { Project } from '../projects/entities/project.entity';
import { CodexCliRunService } from '../codex-cli/codex-cli-run.service';
import { CodexCliPathsService } from '../codex-cli/codex-cli-paths.service';
import { UsersService } from '../users/users.service';
import { StartSkillDto } from './dto/start-skill.dto';
import { stageSkillIntoWorkspace } from './helpers/stage-skill';

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(
    @InjectRepository(SkillRun)
    private readonly runs: Repository<SkillRun>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    private readonly codex: CodexCliRunService,
    private readonly paths: CodexCliPathsService,
    private readonly users: UsersService,
  ) {}

  listByProject(ownerId: string, projectId: string): Promise<SkillRun[]> {
    return this.runs
      .createQueryBuilder('r')
      .innerJoin('r.project', 'p')
      .where('r.projectId = :projectId', { projectId })
      .andWhere('p.ownerId = :ownerId', { ownerId })
      .orderBy('r.createdAt', 'DESC')
      .getMany();
  }

  async getOwned(ownerId: string, runId: string): Promise<SkillRun> {
    const run = await this.runs
      .createQueryBuilder('r')
      .innerJoin('r.project', 'p')
      .where('r.id = :runId', { runId })
      .andWhere('p.ownerId = :ownerId', { ownerId })
      .getOne();
    if (!run) throw new NotFoundException('Skill run not found');
    return run;
  }

  /**
   * Hard gate: every skill execution requires the user to have completed the
   * Codex CLI device-code login first. Surfaces a specific code so the web
   * UI can route the user to /onboarding/connect-codex.
   */
  async assertCodexConnected(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user.codexConnectedAt) {
      throw new UnauthorizedException({
        code: 'CODEX_NOT_CONNECTED',
        message: 'You must connect your Codex (ChatGPT) account before using any skill.',
      });
    }
  }

  /**
   * Create a queued skill run and return its id. The actual run starts when
   * the caller opens the SSE stream `/skills/runs/:id/stream`.
   */
  async createRun(ownerId: string, dto: StartSkillDto): Promise<SkillRun> {
    await this.assertCodexConnected(ownerId);

    const project = await this.projects.findOne({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== ownerId) throw new ForbiddenException();

    const run = this.runs.create({
      projectId: dto.projectId,
      kind: dto.kind as SkillRunKind,
      status: 'QUEUED',
      input: dto.input,
      model: dto.model ?? null,
    });
    return this.runs.save(run);
  }

  /** Stream the LLM execution as SSE. Updates the run row as it progresses. */
  streamRun(ownerId: string, runId: string): Observable<SkillStreamEvent> {
    return new Observable<SkillStreamEvent>((subscriber) => {
      let cancelled = false;

      const exec = async () => {
        const run = await this.getOwned(ownerId, runId);
        if (run.status !== 'QUEUED' && run.status !== 'FAILED') {
          throw new BadRequestException('This run has already been executed.');
        }

        run.status = 'RUNNING';
        run.startedAt = new Date();
        run.errorMessage = null;
        await this.runs.save(run);
        subscriber.next({ type: 'status', status: 'RUNNING' });

        const skill = (run.kind === 'dual-lang' ? 'dual-lang' : run.kind) as SkillId;
        const skillDef = SKILLS[skill];

        // Materialize the skill folder (SKILL.md + scripts/ + references/)
        // inside the project workspace so Codex can `python3 .skills/<id>/scripts/...`
        const workspace = await this.paths.ensureProjectWorkspace(ownerId, run.projectId);
        await stageSkillIntoWorkspace(workspace, skillDef);

        await new Promise<void>((resolve) => {
          const sub = this.codex
            .runSkill(ownerId, skillDef.systemPrompt, run.input, run.projectId)
            .subscribe({
              next: async (part) => {
                if (cancelled) return;
                if (part.kind === 'token') {
                  subscriber.next({ type: 'token', text: part.text });
                  return;
                }
                if (part.kind === 'error') {
                  run.status = 'FAILED';
                  run.errorMessage = part.message;
                  run.finishedAt = new Date();
                  await this.runs.save(run);
                  subscriber.next({ type: 'error', message: part.message });
                  subscriber.complete();
                  resolve();
                  return;
                }
                // part.kind === 'done'
                let output = part.fullText.trim();
                let sideOutput: string | null = null;
                if (run.kind === 'review' && output.includes('<<<CHANGELOG>>>')) {
                  const [draft, changelog] = output.split('<<<CHANGELOG>>>');
                  output = draft?.trim() ?? '';
                  sideOutput = changelog?.trim() ?? null;
                }
                if (run.kind === 'translate' && output.includes('<<<TRANSLATION_NOTES>>>')) {
                  const [body, notes] = output.split('<<<TRANSLATION_NOTES>>>');
                  output = body?.trim() ?? '';
                  sideOutput = notes?.trim() ?? null;
                }

                run.output = output;
                run.sideOutput = sideOutput;
                // Codex CLI doesn't emit annotation events; citations are
                // surfaced inline as Markdown links in the agent output.
                run.citationsJson = JSON.stringify([]);
                run.tokenUsage = part.tokenUsage;
                run.status = 'DONE';
                run.finishedAt = new Date();
                await this.runs.save(run);

                subscriber.next({ type: 'done', task: this.toDto(run) as never });
                subscriber.complete();
                resolve();
              },
              error: async (err: Error) => {
                this.logger.error(err);
                run.status = 'FAILED';
                run.errorMessage = err?.message ?? 'Unknown error';
                run.finishedAt = new Date();
                await this.runs.save(run);
                subscriber.next({ type: 'error', message: run.errorMessage });
                subscriber.complete();
                resolve();
              },
            });

          // Cancellation hook: when the SSE client disconnects, kill the
          // upstream codex process via the registry (CodexCliRunService
          // handles SIGTERM on unsubscribe).
          subscriber.add(() => {
            cancelled = true;
            sub.unsubscribe();
          });
        });
      };

      exec().catch((err) => subscriber.error(err));
      return () => {
        cancelled = true;
      };
    });
  }

  toDto(run: SkillRun) {
    return {
      id: run.id,
      projectId: run.projectId,
      kind: run.kind,
      status: run.status,
      input: run.input,
      output: run.output,
      sideOutput: run.sideOutput,
      errorMessage: run.errorMessage,
      tokenUsage: run.tokenUsage,
      citations: run.citationsJson ? (JSON.parse(run.citationsJson) as unknown[]) : null,
      createdAt: run.createdAt.toISOString(),
      startedAt: run.startedAt ? run.startedAt.toISOString() : null,
      finishedAt: run.finishedAt ? run.finishedAt.toISOString() : null,
    };
  }
}
