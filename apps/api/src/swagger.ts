import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const builder = new DocumentBuilder()
    .setTitle('Laws API')
    .setDescription('Backend for the Laws web app — Vietnamese legal research workflows.')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();

  const doc = SwaggerModule.createDocument(app, builder);
  SwaggerModule.setup('api/docs', app, doc, {
    swaggerOptions: { persistAuthorization: true },
  });
}
