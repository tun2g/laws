import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export type SkillRunStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED';
export type SkillRunKind = 'research' | 'review' | 'translate' | 'dual-lang' | 'docx';

/**
 * One execution of a skill (research / review / translate / dual-lang / docx)
 * against an input. Persists progress and the final markdown output so the
 * user can resume, re-open, or export it later.
 */
@Entity({ name: 'skill_runs' })
export class SkillRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => Project, (p) => p.skillRuns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @Column({ type: 'varchar', length: 32 })
  kind!: SkillRunKind;

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'QUEUED' })
  status!: SkillRunStatus;

  @Column({ type: 'text' })
  input!: string;

  @Column({ type: 'text', nullable: true })
  output!: string | null;

  /** Secondary output, e.g. review changelog or translation notes. */
  @Column({ type: 'text', nullable: true })
  sideOutput!: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'integer', nullable: true })
  tokenUsage!: number | null;

  /** JSON-encoded { title, url, snippet? }[] of web citations. */
  @Column({ type: 'text', nullable: true })
  citationsJson!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  model!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;
}
