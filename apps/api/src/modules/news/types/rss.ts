import type { NewsArticle } from '../entities/news-article.entity';

/** Custom-field-aware item type for our rss-parser instance. */
export interface ExtendedRssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  content?: string;
  contentSnippet?: string;
  enclosure?: { url?: string };
  'media:content'?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
  'media:thumbnail'?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
  guid?: string;
}

/** Shape an item is normalized into before insertion. */
export type NormalizedArticle = Omit<NewsArticle, 'id' | 'fetchedAt'>;

/** Result of normalize() — discriminates success vs. drop reason for logging. */
export type NormalizeResult =
  | { ok: true; value: NormalizedArticle }
  | { ok: false; reason: 'no-url' | 'no-title' | 'bad-date' };
