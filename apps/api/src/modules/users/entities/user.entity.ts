import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export type UserRole = 'USER' | 'ADMIN';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 320 })
  email!: string;

  @Column({ type: 'varchar', length: 256 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 128 })
  name!: string;

  @Column({ type: 'varchar', length: 16, default: 'USER' })
  role!: UserRole;

  /** Set when the user has completed the Codex CLI device-code login. */
  @Column({ type: 'timestamptz', nullable: true })
  codexConnectedAt!: Date | null;

  /** Server-side absolute path of this user's CODEX_HOME (auth.json + config). */
  @Column({ type: 'text', nullable: true })
  codexHomeDir!: string | null;

  /** Server-side absolute path of this user's sandboxed Codex workspace (--cd). */
  @Column({ type: 'text', nullable: true })
  codexWorkspaceDir!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Project, (project) => project.owner)
  projects!: Project[];
}
