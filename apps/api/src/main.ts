import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      config.get<string>('cors.webOrigin')!,
      config.get<string>('cors.adminOrigin')!,
    ],
    credentials: true,
  });

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (config.get<boolean>('swaggerEnabled')) {
    setupSwagger(app);
  }

  const port = Number(config.get('port') ?? 4000);
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}/api`, 'Bootstrap');
  if (config.get<boolean>('swaggerEnabled')) {
    logger.log(`Swagger UI at http://localhost:${port}/api/docs`, 'Bootstrap');
  }
}

bootstrap();
