import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { SkillRun } from '../skills/entities/skill-run.entity';
import { ChatSession } from '../chat/entities/chat-session.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Project, SkillRun, ChatSession, ChatMessage])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
