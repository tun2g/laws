import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

export type ChatMessageRole = 'user' | 'assistant';
export type ChatMessageStatus = 'pending' | 'streaming' | 'complete' | 'failed' | 'cancelled';

@Entity({ name: 'chat_messages' })
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  sessionId!: string;

  @ManyToOne(() => ChatSession, (s) => s.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session!: ChatSession;

  @Column({ type: 'varchar', length: 16 })
  role!: ChatMessageRole;

  /** For user rows: the user input. For assistant rows: accumulated text. */
  @Column({ type: 'text', default: '' })
  content!: string;

  /**
   * Assistant-only. JSON array of structured events emitted during the turn:
   * reasoning deltas, tool calls + outputs, file changes. Allows the UI to
   * re-render the full turn on page reload.
   */
  @Column({ type: 'text', nullable: true })
  eventsJson!: string | null;

  @Column({ type: 'integer', nullable: true })
  tokenUsage!: number | null;

  @Column({ type: 'varchar', length: 16, default: 'complete' })
  status!: ChatMessageStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;
}
