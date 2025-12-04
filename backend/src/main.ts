import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { winstonLogger } from './common/winston.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  });

  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()'
    );
    next();
  });

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'https://campuseat.shop',
      'https://www.campuseat.shop',
      'https://www.campuseat.shop/'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.use((req: Request, res: Response, next: NextFunction) => {
    const logger = new Logger('HTTP');
    const { method, originalUrl } = req;
    if (!originalUrl.includes('socket.io')) {
      logger.log(`Request... ${method} ${originalUrl}`);
    }
    next();
  });

  await app.listen(3000);
}
bootstrap();