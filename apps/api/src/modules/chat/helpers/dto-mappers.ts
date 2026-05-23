import type { ChatTurnEvent } from '@laws/shared';
import type { ChatSession } from '../entities/chat-session.entity';
import type { ChatMessage } from '../entities/chat-message.entity';

export function toSessionDto(s: ChatSession) {
  return {
    id: s.id,
    projectId: s.projectId,
    kind: s.kind,
    title: s.title,
    codexSessionId: s.codexSessionId,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export function toMessageDto(m: ChatMessage) {
  return {
    id: m.id,
    sessionId: m.sessionId,
    role: m.role,
    content: m.content,
    events: m.eventsJson ? (JSON.parse(m.eventsJson) as ChatTurnEvent[]) : null,
    tokenUsage: m.tokenUsage,
    status: m.status,
    errorMessage: m.errorMessage,
    createdAt: m.createdAt.toISOString(),
    finishedAt: m.finishedAt ? m.finishedAt.toISOString() : null,
  };
}
