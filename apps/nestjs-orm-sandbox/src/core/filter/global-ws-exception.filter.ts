import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { ArgumentsHost, Catch, Logger } from '@nestjs/common';

@Catch()
export class GlobalWsExceptionsFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(GlobalWsExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.error(exception.toString());
    super.catch(exception, host);
  }
}
