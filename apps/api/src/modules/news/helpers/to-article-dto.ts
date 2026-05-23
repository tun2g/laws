import type { NewsArticle } from '../entities/news-article.entity';

/** Map the entity to its JSON-friendly DTO shape returned by GET /api/news. */
export function toArticleDto(a: NewsArticle) {
  return {
    id: a.id,
    source: a.source,
    sourceUrl: a.sourceUrl,
    articleUrl: a.articleUrl,
    title: a.title,
    summary: a.summary,
    imageUrl: a.imageUrl,
    publishedAt: a.publishedAt.toISOString(),
    fetchedAt: a.fetchedAt.toISOString(),
  };
}
