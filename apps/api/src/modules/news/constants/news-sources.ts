import type { NewsSourceId } from '../entities/news-article.entity';

/**
 * Vietnamese legal-news RSS sources. Verified URLs as of 2026-05; if a feed
 * 404s, replace the `rssUrl` here — no code changes needed.
 *
 * Note: `moj.gov.vn` and `tapchitoaan.vn` do not publish public RSS endpoints
 * at present (verified via probing common feed paths). They remain in the
 * NewsSourceId union so we can wire them in if/when they expose a feed.
 */
export interface SourceDefinition {
  id: NewsSourceId;
  label: string;
  homepage: string;
  rssUrl: string;
}

export const NEWS_SOURCES: SourceDefinition[] = [
  {
    id: 'thuvienphapluat',
    label: 'Thư viện Pháp luật',
    homepage: 'https://thuvienphapluat.vn',
    rssUrl: 'https://thuvienphapluat.vn/rss.xml',
  },
  {
    id: 'baochinhphu',
    label: 'Báo Chính phủ',
    homepage: 'https://baochinhphu.vn',
    rssUrl: 'https://baochinhphu.vn/rss',
  },
  {
    id: 'luatvietnam',
    label: 'LuậtVietnam',
    homepage: 'https://luatvietnam.vn',
    rssUrl: 'https://luatvietnam.vn/rss/van-ban-moi.rss',
  },
];

export function sourceById(id: NewsSourceId): SourceDefinition | undefined {
  return NEWS_SOURCES.find((s) => s.id === id);
}
