import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Project } from '../projects/entities/project.entity';
import { SkillRun } from '../skills/entities/skill-run.entity';
import { ChatSession } from '../chat/entities/chat-session.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import type { CodexUsageSummary } from '@laws/shared';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(SkillRun) private readonly skillRuns: Repository<SkillRun>,
    @InjectRepository(ChatSession) private readonly chatSessions: Repository<ChatSession>,
    @InjectRepository(ChatMessage) private readonly chatMessages: Repository<ChatMessage>,
  ) {}

  async findById(id: string): Promise<User> {
    const u = await this.users.findOne({ where: { id } });
    if (!u) throw new NotFoundException();
    return u;
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);
    if (dto.name !== undefined) user.name = dto.name;
    return this.users.save(user);
  }

  async getCodexUsage(id: string): Promise<CodexUsageSummary> {
    const user = await this.findById(id);
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [skillTotalRaw, skillRecentRaw, chatTotalRaw, chatRecentRaw, lastSkillRaw, lastChatRaw] =
      await Promise.all([
        this.skillRuns
          .createQueryBuilder('run')
          .innerJoin(Project, 'project', 'project.id = run.projectId')
          .select('COALESCE(SUM(run.tokenUsage), 0)', 'tokens')
          .addSelect('COUNT(*)', 'count')
          .where('project.ownerId = :userId', { userId: id })
          .andWhere('run.tokenUsage IS NOT NULL')
          .getRawOne<{ tokens: string; count: string }>(),
        this.skillRuns
          .createQueryBuilder('run')
          .innerJoin(Project, 'project', 'project.id = run.projectId')
          .select('COALESCE(SUM(run.tokenUsage), 0)', 'tokens')
          .addSelect('COUNT(*)', 'count')
          .where('project.ownerId = :userId', { userId: id })
          .andWhere('run.tokenUsage IS NOT NULL')
          .andWhere('run.createdAt >= :since', { since })
          .getRawOne<{ tokens: string; count: string }>(),
        this.chatMessages
          .createQueryBuilder('message')
          .innerJoin(ChatSession, 'session', 'session.id = message.sessionId')
          .innerJoin(Project, 'project', 'project.id = session.projectId')
          .select('COALESCE(SUM(message.tokenUsage), 0)', 'tokens')
          .addSelect('COUNT(*)', 'count')
          .where('project.ownerId = :userId', { userId: id })
          .andWhere('message.role = :role', { role: 'assistant' })
          .andWhere('message.tokenUsage IS NOT NULL')
          .getRawOne<{ tokens: string; count: string }>(),
        this.chatMessages
          .createQueryBuilder('message')
          .innerJoin(ChatSession, 'session', 'session.id = message.sessionId')
          .innerJoin(Project, 'project', 'project.id = session.projectId')
          .select('COALESCE(SUM(message.tokenUsage), 0)', 'tokens')
          .addSelect('COUNT(*)', 'count')
          .where('project.ownerId = :userId', { userId: id })
          .andWhere('message.role = :role', { role: 'assistant' })
          .andWhere('message.tokenUsage IS NOT NULL')
          .andWhere('message.createdAt >= :since', { since })
          .getRawOne<{ tokens: string; count: string }>(),
        this.skillRuns
          .createQueryBuilder('run')
          .innerJoin(Project, 'project', 'project.id = run.projectId')
          .select('MAX(COALESCE(run.finishedAt, run.createdAt))', 'lastActivityAt')
          .where('project.ownerId = :userId', { userId: id })
          .andWhere('run.tokenUsage IS NOT NULL')
          .getRawOne<{ lastActivityAt: string | null }>(),
        this.chatMessages
          .createQueryBuilder('message')
          .innerJoin(ChatSession, 'session', 'session.id = message.sessionId')
          .innerJoin(Project, 'project', 'project.id = session.projectId')
          .select('MAX(COALESCE(message.finishedAt, message.createdAt))', 'lastActivityAt')
          .where('project.ownerId = :userId', { userId: id })
          .andWhere('message.role = :role', { role: 'assistant' })
          .andWhere('message.tokenUsage IS NOT NULL')
          .getRawOne<{ lastActivityAt: string | null }>(),
      ]);

    const totalSkillTokens = toInt(skillTotalRaw?.tokens);
    const totalSkillRuns = toInt(skillTotalRaw?.count);
    const recentSkillTokens = toInt(skillRecentRaw?.tokens);
    const recentSkillRuns = toInt(skillRecentRaw?.count);
    const totalChatTokens = toInt(chatTotalRaw?.tokens);
    const totalChatMessages = toInt(chatTotalRaw?.count);
    const recentChatTokens = toInt(chatRecentRaw?.tokens);
    const recentChatMessages = toInt(chatRecentRaw?.count);

    const lastActivityCandidates = [lastSkillRaw?.lastActivityAt, lastChatRaw?.lastActivityAt]
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())
      .filter((value) => Number.isFinite(value));
    const lastActivityAt = lastActivityCandidates.length
      ? new Date(Math.max(...lastActivityCandidates)).toISOString()
      : null;

    return {
      connected: Boolean(user.codexConnectedAt),
      totals: {
        tokens: totalSkillTokens + totalChatTokens,
        skillRuns: totalSkillRuns,
        chatMessages: totalChatMessages,
      },
      last30Days: {
        tokens: recentSkillTokens + recentChatTokens,
        skillRuns: recentSkillRuns,
        chatMessages: recentChatMessages,
      },
      lastActivityAt,
    };
  }
}

function toInt(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
