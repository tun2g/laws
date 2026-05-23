import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { SkillRun } from '../skills/entities/skill-run.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Project, SkillRun])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
