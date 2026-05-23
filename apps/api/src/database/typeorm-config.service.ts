import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: this.configService.get('db.type'),
      host: this.configService.get('db.host'),
      port: this.configService.get('db.port'),
      schema: 'public',
      username: this.configService.get('db.username'),
      password: this.configService.get('db.password'),
      database: this.configService.get('db.name'),
      synchronize: this.configService.get('nodeEnv') !== 'production',
      dropSchema: false,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
      extra: {
        max: this.configService.get('db.maxConnections'),
        ssl: this.configService.get('db.sslEnabled')
          ? {
              rejectUnauthorized: this.configService.get('db.rejectUnauthorized'),
            }
          : undefined,
      },
    } as TypeOrmModuleOptions;
  }
}
