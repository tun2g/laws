import { createHash } from 'node:crypto';
import type { SourceDefinition } from '../constants/news-sources';
import type { ExtendedRssItem, NormalizeResult } from '../types/rss';
import { parseVietnameseDate } from './parse-vietnamese-date';
import { stripHtml } from './strip-html';
import { extractFirstImgFromHtml, extractImage } from './extract-image';

/**
 * Convert a raw RSS item into a NormalizedArticle, or report the reason it
 * was dropped (missing title/url/date). Defends against feeds that omit
 * <link> in favour of <guid>, and recognises Vietnamese-locale dates.
 */
export function normalizeRssItem(src: SourceDefinition, item: ExtendedRssItem): NormalizeResult {
  const articleUrl = (item.link ?? item.guid)?.trim();
  const title = item.title?.trim();
  if (!articleUrl) return { ok: false, reason: 'no-url' };
  if (!title) return { ok: false, reason: 'no-title' };

  let publishedAt: Date | null = null;
  if (item.isoDate) {
    const d = new Date(item.isoDate);
    if (!isNaN(d.getTime())) publishedAt = d;
  }
  if (!publishedAt && item.pubDate) {
    const d = new Date(item.pubDate);
    if (!isNaN(d.getTime())) publishedAt = d;
    else publishedAt = parseVietnameseDate(item.pubDate);
  }
  if (!publishedAt) return { ok: false, reason: 'bad-date' };

  const summary = stripHtml(item.contentSnippet ?? item.content ?? '').slice(0, 600) || null;
  const imageUrl = extractImage(item) ?? extractFirstImgFromHtml(item.content);
  const hash = createHash('sha256').update(articleUrl).digest('hex');

  return {
    ok: true,
    value: {
      source: src.id,
      sourceUrl: src.homepage,
      articleUrl,
      title: title.slice(0, 500),
      summary,
      imageUrl,
      publishedAt,
      hash,
    },
  };
}
