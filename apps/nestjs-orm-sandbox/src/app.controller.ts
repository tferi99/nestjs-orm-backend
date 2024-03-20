import { Controller, Get } from '@nestjs/common';
import { NoAuth } from './auth/passport/no-auth.decorator';

export const APP_WELCOME = 'NestjsOrmSandbox is running...';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  @NoAuth()
  getHello(): string {
    return APP_WELCOME;
  }
}
