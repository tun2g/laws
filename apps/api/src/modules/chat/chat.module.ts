import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Project } from '../projects/entities/project.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { CodexCliModule } from '../codex-cli/codex-cli.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChatSession, ChatMessage, Project]), CodexCliModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
