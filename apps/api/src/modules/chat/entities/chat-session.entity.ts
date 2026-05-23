import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { ChatMessage } from './chat-message.entity';

export type ChatSessionKind = 'research' | 'review' | 'translate' | 'dual-lang' | 'free';

@Entity({ name: 'chat_sessions' })
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @Column({ type: 'varchar', length: 32 })
  kind!: ChatSessionKind;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  /** Codex CLI session id captured from the first turn; used for --resume. */
  @Column({ type: 'varchar', length: 128, nullable: true })
  codexSessionId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => ChatMessage, (m) => m.session)
  messages!: ChatMessage[];
}
