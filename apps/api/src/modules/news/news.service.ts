import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { NewsPage } from '@laws/shared';
import { NewsArticle, NewsSourceId } from './entities/news-article.entity';
import { NEWS_SOURCES } from './constants/news-sources';
import { MAX_PAGE_SIZE } from './constants/news.constants';
import { toArticleDto } from './helpers/to-article-dto';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewsArticle)
    private readonly articles: Repository<NewsArticle>,
  ) {}

  listSources() {
    return NEWS_SOURCES.map((s) => ({ id: s.id, label: s.label, homepage: s.homepage }));
  }

  async page(opts: {
    page: number;
    pageSize: number;
    source?: NewsSourceId;
  }): Promise<NewsPage> {
    const page = Math.max(1, Math.floor(opts.page));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(opts.pageSize)));

    const qb = this.articles
      .createQueryBuilder('a')
      .orderBy('a.publishedAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    if (opts.source) qb.where('a.source = :source', { source: opts.source });

    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map(toArticleDto),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}
