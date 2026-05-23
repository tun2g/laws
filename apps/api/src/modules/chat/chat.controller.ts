import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import { ChatService } from './chat.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { AppendChatMessageDto } from './dto/append-chat-message.dto';
import { toMessageDto, toSessionDto } from './helpers/dto-mappers';
import type { ChatStreamEvent } from '@laws/shared';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'List chat sessions for a project' })
  async list(
    @CurrentUser() u: CurrentUserPayload,
    @Query('projectId', new ParseUUIDPipe()) projectId: string,
  ) {
    const sessions = await this.chat.listSessions(u.id, projectId);
    return sessions.map(toSessionDto);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new chat session and seed the first user message' })
  async create(
    @CurrentUser() u: CurrentUserPayload,
    @Body() dto: CreateChatSessionDto,
  ) {
    return this.chat.createSession(u.id, dto);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Load a chat session + all messages' })
  async get(@CurrentUser() u: CurrentUserPayload, @Param('id', new ParseUUIDPipe()) id: string) {
    const { session, messages } = await this.chat.getSession(u.id, id);
    return {
      session: toSessionDto(session),
      messages: messages.map(toMessageDto),
    };
  }

  @Post('sessions/:id/messages')
  @ApiOperation({ summary: 'Append a user message and queue an assistant turn' })
  async append(
    @CurrentUser() u: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AppendChatMessageDto,
  ) {
    return this.chat.appendMessage(u.id, id, dto);
  }

  @Sse('sessions/:id/messages/:msgId/stream')
  @ApiOperation({ summary: 'Stream the assistant response for a pending message (SSE)' })
  stream(
    @CurrentUser() u: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe()) sessionId: string,
    @Param('msgId', new ParseUUIDPipe()) msgId: string,
  ): Observable<{ data: ChatStreamEvent }> {
    return this.chat
      .streamAssistantMessage(u.id, sessionId, msgId)
      .pipe(map((event) => ({ data: event })));
  }

  @Delete('sessions/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a chat session and all its messages' })
  async remove(@CurrentUser() u: CurrentUserPayload, @Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.chat.deleteSession(u.id, id);
  }
}
