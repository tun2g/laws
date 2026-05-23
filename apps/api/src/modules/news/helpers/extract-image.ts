import type { ExtendedRssItem } from '../types/rss';

/** First image URL we can locate in an RSS item — enclosure, media:*, or inline. */
export function extractImage(item: ExtendedRssItem): string | null {
  const enc = item.enclosure?.url;
  if (enc) return enc;
  const mc = item['media:content'];
  if (Array.isArray(mc)) {
    const first = mc[0]?.$?.url;
    if (first) return first;
  } else if (mc?.$?.url) {
    return mc.$.url;
  }
  const mt = item['media:thumbnail'];
  if (Array.isArray(mt)) {
    const first = mt[0]?.$?.url;
    if (first) return first;
  } else if (mt?.$?.url) {
    return mt.$.url;
  }
  return null;
}

/** Fallback: pull the first <img src="…"> out of a content HTML blob. */
export function extractFirstImgFromHtml(html: string | undefined): string | null {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] ?? null;
}
