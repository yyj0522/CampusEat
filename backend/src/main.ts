import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ 최종 해결책: 모든 요청에 대해 CORS 헤더를 수동으로 설정하는 미들웨어
  app.use((req: Request, res: Response, next: NextFunction) => {
    // 허용할 오리진(프론트엔드 주소)
    res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
    
    // 허용할 HTTP 메서드
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    
    // 허용할 헤더
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // preflight 요청(OPTIONS)에 대한 처리
    // 브라우저가 본 요청(PATCH 등)을 보내기 전에 OPTIONS 메서드로 먼저 허용 여부를 확인합니다.
    // 이때 200 OK로 응답을 보내주어야 다음 본 요청을 정상적으로 보낼 수 있습니다.
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // 다음 미들웨어로 요청을 전달합니다.
    next();
  });

  // 기존의 app.enableCors()는 이 미들웨어로 대체되었으므로 제거합니다.

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // 디버깅을 위한 요청 로거는 그대로 유지합니다.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const logger = new Logger('HTTP');
    const { method, originalUrl } = req;
    if (!originalUrl.includes('socket.io')) { // 소켓IO 로그는 제외
        logger.log(`Request... ${method} ${originalUrl}`);
    }
    next();
  });

  await app.listen(3000);
}
bootstrap();

