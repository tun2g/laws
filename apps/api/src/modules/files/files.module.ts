import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { CodexCliModule } from '../codex-cli/codex-cli.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project]), CodexCliModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
