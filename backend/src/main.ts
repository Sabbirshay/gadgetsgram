import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());

  const corsOriginRaw = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:8080',
  );
  // Support comma-separated origins for multi-environment CORS
  const corsOrigins = corsOriginRaw.split(',').map((o) => o.trim());
  app.enableCors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  return app;
}

let cachedApp: any;

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    const app = await bootstrap();
    cachedApp = app.getHttpAdapter().getInstance();
  }
  return cachedApp(req, res);
}

if (process.env.VERCEL !== '1') {
  bootstrap().then(async (app) => {
    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3000);
    await app.listen(port);
    console.log(`Application is running on: ${await app.getUrl()}`);
  });
}
