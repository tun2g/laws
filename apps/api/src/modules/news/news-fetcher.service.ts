import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import Parser from 'rss-parser';
import { In, LessThan, Repository } from 'typeorm';
import { NewsArticle, NewsSourceId } from './entities/news-article.entity';
import { NEWS_SOURCES, SourceDefinition } from './constants/news-sources';
import { MAX_PER_SOURCE, NEWS_CRON } from './constants/news.constants';
import type { ExtendedRssItem, NormalizedArticle } from './types/rss';
import { normalizeRssItem } from './helpers/normalize-rss-item';

/**
 * Fetches Vietnamese legal-news RSS feeds on a cron, upserts into the
 * news_articles table, and prunes any source's history past the retention
 * limit. Each source is fetched in parallel; failures are logged but do
 * not interrupt other sources.
 */
@Injectable()
export class NewsFetcherService implements OnModuleInit {
  private readonly logger = new Logger(NewsFetcherService.name);
  private readonly parser = new Parser<unknown, ExtendedRssItem>({
    timeout: 15_000,
    headers: {
      // Several VN sites return 403/406 for "bot-shaped" clients — mirror a
      // recent desktop Chrome and ship the full set of headers a real
      // navigation would emit. Note: this won't bypass IP-range blocks; if
      // 403 persists in production but not locally, the hosting egress IP
      // is the likely cause.
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
    customFields: {
      item: ['media:content', 'media:thumbnail', 'enclosure'],
    },
  });

  constructor(
    @InjectRepository(NewsArticle)
    private readonly articles: Repository<NewsArticle>,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(`News fetcher scheduled at "${NEWS_CRON}"; kicking initial fetch…`);
    void this.refreshAll();
  }

  @Cron(NEWS_CRON, { name: 'news-fetch' })
  async runCron(): Promise<void> {
    await this.refreshAll();
  }

  async refreshAll(): Promise<{ source: NewsSourceId; added: number; total: number; error?: string }[]> {
    const runStart = Date.now();
    this.logger.log(`[news] Refresh cycle started — ${NEWS_SOURCES.length} source(s)`);

    const results = await Promise.all(
      NEWS_SOURCES.map((src) => this.refreshOne(src).catch((err: Error) => {
        this.logger.error(`[news] [${src.id}] failed: ${err.message}`);
        return { source: src.id, added: 0, total: 0, error: err.message };
      })),
    );

    const elapsed = Date.now() - runStart;
    const addedTotal = results.reduce((a, r) => a + r.added, 0);
    const failed = results.filter((r) => 'error' in r && r.error).length;
    this.logger.log(
      `[news] Refresh cycle finished in ${elapsed}ms — ` +
        `+${addedTotal} new article(s), ${failed} source(s) failed`,
    );
    return results;
  }

  private async refreshOne(src: SourceDefinition): Promise<{ source: NewsSourceId; added: number; total: number }> {
    const start = Date.now();
    this.logger.log(`[news] [${src.id}] GET ${src.rssUrl}`);
    const feed = await this.parser.parseURL(src.rssUrl);
    const fetchMs = Date.now() - start;
    const items = feed.items ?? [];
    this.logger.log(
      `[news] [${src.id}] feed parsed in ${fetchMs}ms — ${items.length} item(s) received`,
    );

    const parsed: NormalizedArticle[] = [];
    const dropReasons: Record<string, number> = {};
    for (const it of items) {
      const r = normalizeRssItem(src, it);
      if (r.ok) parsed.push(r.value);
      else dropReasons[r.reason] = (dropReasons[r.reason] ?? 0) + 1;
    }
    const dropped = items.length - parsed.length;
    if (dropped > 0) {
      const breakdown = Object.entries(dropReasons)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      this.logger.warn(
        `[news] [${src.id}] dropped ${dropped} item(s) during normalize (${breakdown})`,
      );
    }

    if (parsed.length === 0) {
      this.logger.warn(`[news] [${src.id}] no parseable items — skipping`);
      return { source: src.id, added: 0, total: 0 };
    }

    const urls = parsed.map((p) => p.articleUrl);
    const existing = await this.articles.find({
      where: { articleUrl: In(urls) },
      select: ['articleUrl'],
    });
    const existingSet = new Set(existing.map((e) => e.articleUrl));
    const fresh = parsed.filter((p) => !existingSet.has(p.articleUrl));
    const duplicates = parsed.length - fresh.length;

    if (fresh.length > 0) {
      await this.articles.save(
        fresh.map((f) => this.articles.create({ ...f, fetchedAt: new Date() })),
      );
      this.logger.log(
        `[news] [${src.id}] inserted ${fresh.length} new (${duplicates} duplicate, ` +
          `${parsed.length} valid in feed)`,
      );
      const firstTitle = fresh[0]?.title.slice(0, 80);
      if (firstTitle) this.logger.debug(`[news] [${src.id}] newest: "${firstTitle}…"`);
    } else {
      this.logger.log(
        `[news] [${src.id}] no new articles (all ${duplicates} already present)`,
      );
    }

    await this.prune(src.id);
    const total = await this.articles.count({ where: { source: src.id } });
    const elapsed = Date.now() - start;
    this.logger.log(
      `[news] [${src.id}] done in ${elapsed}ms — ${total} total stored`,
    );
    return { source: src.id, added: fresh.length, total };
  }

  /** Keep only the newest MAX_PER_SOURCE rows per source. */
  private async prune(sourceId: NewsSourceId): Promise<void> {
    const count = await this.articles.count({ where: { source: sourceId } });
    if (count <= MAX_PER_SOURCE) return;
    const rows = await this.articles.find({
      where: { source: sourceId },
      order: { publishedAt: 'DESC' },
      skip: MAX_PER_SOURCE,
      take: 1,
    });
    const cutoff = rows[0];
    if (!cutoff) return;
    const result = await this.articles.delete({
      source: sourceId,
      publishedAt: LessThan(cutoff.publishedAt),
    });
    this.logger.log(
      `[news] [${sourceId}] pruned ${result.affected ?? 0} old row(s) — ` +
        `cap is ${MAX_PER_SOURCE}`,
    );
  }
}
