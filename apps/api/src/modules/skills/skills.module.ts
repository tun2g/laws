import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { SkillRun } from './entities/skill-run.entity';
import { Project } from '../projects/entities/project.entity';
import { UsersModule } from '../users/users.module';
import { CodexCliModule } from '../codex-cli/codex-cli.module';

@Module({
  imports: [TypeOrmModule.forFeature([SkillRun, Project]), UsersModule, CodexCliModule],
  controllers: [SkillsController],
  providers: [SkillsService],
  exports: [SkillsService],
})
export class SkillsModule {}
