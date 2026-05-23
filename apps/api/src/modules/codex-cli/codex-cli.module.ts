import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { CodexCliController } from './codex-cli.controller';
import { CodexCliAuthService } from './codex-cli-auth.service';
import { CodexCliRunService } from './codex-cli-run.service';
import { CodexCliPathsService } from './codex-cli-paths.service';
import { CodexCliProcessRegistry } from './codex-cli-process-registry.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [CodexCliController],
  providers: [
    CodexCliAuthService,
    CodexCliRunService,
    CodexCliPathsService,
    CodexCliProcessRegistry,
  ],
  exports: [CodexCliAuthService, CodexCliRunService, CodexCliPathsService],
})
export class CodexCliModule {}
