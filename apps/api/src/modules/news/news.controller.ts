import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../shared/decorators/current-user.decorator';
import { NewsService } from './news.service';
import { NewsFetcherService } from './news-fetcher.service';
import { NewsSummaryService, NewsSummaryEvent } from './news-summary.service';
import { NewsSourceId } from './entities/news-article.entity';

@ApiTags('news')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('news')
export class NewsController {
  constructor(
    private readonly news: NewsService,
    private readonly fetcher: NewsFetcherService,
    private readonly summary: NewsSummaryService,
  ) {}

  @Get('sources')
  @ApiOperation({ summary: 'List available news sources' })
  sources() {
    return this.news.listSources();
  }

  @Get()
  @ApiOperation({ summary: 'Paginated news feed' })
  async list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '12',
    @Query('source') source?: string,
  ) {
    return this.news.page({
      page: parseInt(page, 10) || 1,
      pageSize: parseInt(pageSize, 10) || 12,
      source: (source && isValidSource(source)) ? source : undefined,
    });
  }

  @Sse(':id/summarize/stream')
  @ApiOperation({ summary: 'Stream a Codex-generated summary of the article (SSE)' })
  summarize(
    @CurrentUser() u: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Observable<{ data: NewsSummaryEvent }> {
    return this.summary.stream(u.id, id).pipe(map((event) => ({ data: event })));
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Force a fetch from all sources (admin only)' })
  async refresh(@CurrentUser() u: CurrentUserPayload) {
    if (u.role !== 'ADMIN') throw new ForbiddenException();
    return this.fetcher.refreshAll();
  }
}

function isValidSource(s: string): s is NewsSourceId {
  return ['thuvienphapluat', 'baochinhphu', 'moj', 'tapchitoaan', 'luatvietnam'].includes(s);
}
