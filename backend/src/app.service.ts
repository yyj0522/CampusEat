import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { status: string } {
    //return 'Hello World!';
    return { status: 'ok' };
  }
}
