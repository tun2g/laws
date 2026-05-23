import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { NewsArticle } from './entities/news-article.entity';
import { User } from '../users/entities/user.entity';
import { CodexCliRunService } from '../codex-cli/codex-cli-run.service';
import { SUMMARY_SYSTEM_PROMPT } from './constants/summary-prompt';
import { buildSummaryUserPrompt } from './helpers/build-initial-prompt';
import type { NewsSummaryEvent } from './types/news-summary-event';

export type { NewsSummaryEvent };

/**
 * Stream a fresh Codex-generated summary of a single news article via the
 * user's Codex account. No caching — every call spends the user's quota; a
 * deliberate UX choice so lawyers control their spend.
 */
@Injectable()
export class NewsSummaryService {
  private readonly logger = new Logger(NewsSummaryService.name);

  constructor(
    @InjectRepository(NewsArticle) private readonly articles: Repository<NewsArticle>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly codex: CodexCliRunService,
  ) {}

  stream(userId: string, articleId: string): Observable<NewsSummaryEvent> {
    return new Observable<NewsSummaryEvent>((subscriber) => {
      let cancelled = false;

      const exec = async () => {
        const article = await this.articles.findOne({ where: { id: articleId } });
        if (!article) throw new NotFoundException('Article not found');

        const user = await this.users.findOne({
          where: { id: userId },
          select: ['codexConnectedAt'],
        });
        if (!user?.codexConnectedAt) {
          throw new UnauthorizedException({
            code: 'CODEX_NOT_CONNECTED',
            message: 'Bạn cần kết nối tài khoản Codex trước.',
          });
        }

        this.logger.log(
          `[news-summary] user=${userId} article=${article.id} title="${article.title.slice(0, 60)}…"`,
        );

        await new Promise<void>((resolve) => {
          const sub = this.codex
            .streamChat({
              userId,
              systemPrompt: SUMMARY_SYSTEM_PROMPT,
              transcript: [],
              newUserMessage: buildSummaryUserPrompt(article),
              codexSessionId: null,
            })
            .subscribe({
              next: (part) => {
                if (cancelled) return;
                if (part.kind === 'assistant.delta') {
                  subscriber.next({ type: 'delta', text: part.text });
                } else if (part.kind === 'error') {
                  subscriber.next({ type: 'error', message: part.message });
                  subscriber.complete();
                  resolve();
                } else if (part.kind === 'done') {
                  subscriber.next({ type: 'done' });
                  subscriber.complete();
                  resolve();
                }
              },
              error: (err: Error) => {
                this.logger.error(`[news-summary] failed: ${err.message}`);
                subscriber.next({ type: 'error', message: err.message });
                subscriber.complete();
                resolve();
              },
            });

          subscriber.add(() => {
            cancelled = true;
            sub.unsubscribe();
          });
        });
      };

      exec().catch((err: Error) => {
        if (err instanceof UnauthorizedException || err instanceof NotFoundException) {
          subscriber.error(err);
        } else {
          subscriber.next({ type: 'error', message: err.message });
          subscriber.complete();
        }
      });

      return () => {
        cancelled = true;
      };
    });
  }
}
