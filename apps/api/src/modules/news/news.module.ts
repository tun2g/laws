import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsArticle } from './entities/news-article.entity';
import { User } from '../users/entities/user.entity';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsFetcherService } from './news-fetcher.service';
import { NewsSummaryService } from './news-summary.service';
import { CodexCliModule } from '../codex-cli/codex-cli.module';

@Module({
  imports: [TypeOrmModule.forFeature([NewsArticle, User]), CodexCliModule],
  controllers: [NewsController],
  providers: [NewsService, NewsFetcherService, NewsSummaryService],
  exports: [NewsService, NewsFetcherService],
})
export class NewsModule {}
