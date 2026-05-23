import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { Repository } from 'typeorm';
import type { ChatStreamEvent, ChatTurnEvent } from '@laws/shared';
import { ChatSession, ChatSessionKind } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Project } from '../projects/entities/project.entity';
import { CodexCliRunService } from '../codex-cli/codex-cli-run.service';
import { deriveTitle } from './helpers/derive-title';
import { systemPromptFor } from './helpers/system-prompt-for';
import { toMessageDto, toSessionDto } from './helpers/dto-mappers';
import { applyPartToMessage, finalizeMessage } from './helpers/apply-stream-event';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatSession) private readonly sessions: Repository<ChatSession>,
    @InjectRepository(ChatMessage) private readonly messages: Repository<ChatMessage>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    private readonly codex: CodexCliRunService,
  ) {}

  async listSessions(ownerId: string, projectId: string): Promise<ChatSession[]> {
    await this.assertProjectOwned(ownerId, projectId);
    return this.sessions.find({
      where: { projectId },
      order: { updatedAt: 'DESC' },
    });
  }

  async getSession(ownerId: string, sessionId: string): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
    const session = await this.sessions.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Chat session not found');
    await this.assertProjectOwned(ownerId, session.projectId);
    const messages = await this.messages.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
    return { session, messages };
  }

  async createSession(
    ownerId: string,
    dto: { projectId: string; kind: ChatSessionKind; firstMessage: string },
  ): Promise<{ sessionId: string; userMessageId: string; assistantMessageId: string }> {
    await this.assertProjectOwned(ownerId, dto.projectId);

    const session = await this.sessions.save(
      this.sessions.create({
        projectId: dto.projectId,
        kind: dto.kind,
        title: deriveTitle(dto.firstMessage),
        codexSessionId: null,
      }),
    );

    const userMsg = await this.messages.save(
      this.messages.create({
        sessionId: session.id,
        role: 'user',
        content: dto.firstMessage,
        status: 'complete',
      }),
    );

    const assistantMsg = await this.messages.save(
      this.messages.create({
        sessionId: session.id,
        role: 'assistant',
        content: '',
        eventsJson: '[]',
        status: 'pending',
      }),
    );

    return {
      sessionId: session.id,
      userMessageId: userMsg.id,
      assistantMessageId: assistantMsg.id,
    };
  }

  async appendMessage(
    ownerId: string,
    sessionId: string,
    dto: { content: string },
  ): Promise<{ userMessageId: string; assistantMessageId: string }> {
    const session = await this.sessions.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Chat session not found');
    await this.assertProjectOwned(ownerId, session.projectId);

    const userMsg = await this.messages.save(
      this.messages.create({
        sessionId,
        role: 'user',
        content: dto.content,
        status: 'complete',
      }),
    );

    const assistantMsg = await this.messages.save(
      this.messages.create({
        sessionId,
        role: 'assistant',
        content: '',
        eventsJson: '[]',
        status: 'pending',
      }),
    );

    session.updatedAt = new Date();
    await this.sessions.save(session);

    return { userMessageId: userMsg.id, assistantMessageId: assistantMsg.id };
  }

  async deleteSession(ownerId: string, sessionId: string): Promise<void> {
    const session = await this.sessions.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Chat session not found');
    await this.assertProjectOwned(ownerId, session.projectId);
    await this.sessions.remove(session);
  }

  /**
   * Stream a single assistant turn over SSE. Reads the most recent user
   * message + prior transcript, runs Codex, persists structured events to
   * the assistant row as they arrive, captures the Codex sessionId on
   * the first turn so subsequent turns can use --resume.
   */
  streamAssistantMessage(
    ownerId: string,
    sessionId: string,
    assistantMessageId: string,
  ): Observable<ChatStreamEvent> {
    return new Observable<ChatStreamEvent>((subscriber) => {
      let cancelled = false;

      const exec = async () => {
        const session = await this.sessions.findOne({ where: { id: sessionId } });
        if (!session) throw new NotFoundException('Chat session not found');
        await this.assertProjectOwned(ownerId, session.projectId);

        const assistantMsg = await this.messages.findOne({ where: { id: assistantMessageId } });
        if (!assistantMsg || assistantMsg.sessionId !== sessionId || assistantMsg.role !== 'assistant') {
          throw new NotFoundException('Assistant message not found in this session');
        }
        if (assistantMsg.status !== 'pending' && assistantMsg.status !== 'failed') {
          throw new BadRequestException('This message has already been streamed.');
        }

        const allMsgs = await this.messages.find({
          where: { sessionId },
          order: { createdAt: 'ASC' },
        });
        const transcript = allMsgs
          .filter((m) => m.id !== assistantMessageId && m.status === 'complete')
          .slice(0, -1)
          .map((m) => ({ role: m.role, content: m.content }));
        const lastUser = [...allMsgs]
          .reverse()
          .find((m) => m.role === 'user' && m.status === 'complete');
        if (!lastUser) throw new BadRequestException('No user message to respond to');

        assistantMsg.status = 'streaming';
        await this.messages.save(assistantMsg);

        const systemPrompt = systemPromptFor(session.kind);
        this.logger.log(
          `Chat turn for session ${sessionId} kind=${session.kind} ` +
            `→ injecting system prompt (${systemPrompt.length} chars, ` +
            `${session.codexSessionId ? `resuming codex sid=${session.codexSessionId}` : 'fresh session'})`,
        );
        const events: ChatTurnEvent[] = [];

        const repos = { sessions: this.sessions, messages: this.messages };

        await new Promise<void>((resolve) => {
          const sub = this.codex
            .streamChat({
              userId: ownerId,
              projectId: session.projectId,
              systemPrompt,
              transcript,
              newUserMessage: lastUser.content,
              codexSessionId: session.codexSessionId,
            })
            .subscribe({
              next: async (part) => {
                if (cancelled) return;
                await applyPartToMessage(repos, session, assistantMsg, events, part, subscriber);
                if (part.kind === 'done') {
                  await finalizeMessage(repos, assistantMsg, events, part.fullText, part.tokenUsage, 'complete', null);
                  subscriber.next({
                    type: 'done',
                    message: toMessageDto(assistantMsg),
                    session: toSessionDto(session),
                  });
                  subscriber.complete();
                  resolve();
                }
                if (part.kind === 'error') {
                  await finalizeMessage(repos, assistantMsg, events, assistantMsg.content, null, 'failed', part.message);
                  subscriber.next({ type: 'error', message: part.message });
                  subscriber.complete();
                  resolve();
                }
              },
              error: async (err: Error) => {
                this.logger.error(err);
                await finalizeMessage(
                  repos,
                  assistantMsg,
                  events,
                  assistantMsg.content,
                  null,
                  'failed',
                  err.message,
                );
                subscriber.next({ type: 'error', message: err.message });
                subscriber.complete();
                resolve();
              },
            });

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

  private async assertProjectOwned(ownerId: string, projectId: string): Promise<Project> {
    const project = await this.projects.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== ownerId) throw new ForbiddenException();
    return project;
  }
}

