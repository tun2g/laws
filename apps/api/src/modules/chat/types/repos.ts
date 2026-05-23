import type { Repository } from 'typeorm';
import type { ChatSession } from '../entities/chat-session.entity';
import type { ChatMessage } from '../entities/chat-message.entity';

/** Bundle the two repositories used by the chat stream applier. */
export interface ChatRepos {
  sessions: Repository<ChatSession>;
  messages: Repository<ChatMessage>;
}

export interface ChatStreamSink {
  next: (e: import('@laws/shared').ChatStreamEvent) => void;
}
