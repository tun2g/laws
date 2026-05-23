// Must be imported first to load .env file for process.env
import * as dotenv from 'dotenv';
dotenv.config();

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { DataSource } from 'typeorm';

import { configuration } from './config/configuration';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { loggerModuleParams } from './shared/logger/logger-module-params';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SkillsModule } from './modules/skills/skills.module';
import { AdminModule } from './modules/admin/admin.module';
import { CodexCliModule } from './modules/codex-cli/codex-cli.module';
import { ChatModule } from './modules/chat/chat.module';
import { NewsModule } from './modules/news/news.module';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      cache: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options) => new DataSource(options!).initialize(),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    LoggerModule.forRootAsync(loggerModuleParams),
    ScheduleModule.forRoot(),

    AuthModule,
    UsersModule,
    ProjectsModule,
    SkillsModule,
    AdminModule,
    CodexCliModule,
    ChatModule,
    NewsModule,
    FilesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // JwtAuthGuard is applied globally; routes opt out with @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
