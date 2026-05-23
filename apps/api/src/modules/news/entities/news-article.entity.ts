import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export type NewsSourceId =
  | 'thuvienphapluat'
  | 'baochinhphu'
  | 'moj'
  | 'tapchitoaan'
  | 'luatvietnam';

@Entity({ name: 'news_articles' })
@Unique('UQ_news_articles_articleUrl', ['articleUrl'])
@Index('IDX_news_articles_publishedAt', ['publishedAt'])
@Index('IDX_news_articles_source', ['source'])
export class NewsArticle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  source!: NewsSourceId;

  @Column({ type: 'text' })
  sourceUrl!: string;

  @Column({ type: 'text' })
  articleUrl!: string;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({ type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'timestamptz' })
  publishedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  fetchedAt!: Date;

  /** sha256(articleUrl) — convenient for log lookups; uniqueness is on articleUrl. */
  @Column({ type: 'char', length: 64 })
  hash!: string;
}
