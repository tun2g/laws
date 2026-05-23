import type { NewsArticle } from '../entities/news-article.entity';

/** Compose the user-side prompt passed to Codex when summarizing an article. */
export function buildSummaryUserPrompt(article: NewsArticle): string {
  return (
    `Tiêu đề: ${article.title}\n` +
    `Đường dẫn: ${article.articleUrl}\n` +
    (article.summary ? `Trích đoạn: ${article.summary}\n` : '')
  );
}
