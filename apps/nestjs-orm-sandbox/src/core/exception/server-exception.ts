import { HttpException } from '@nestjs/common';
import { ServerError } from '@nestjs-orm/client';

export class ServerException extends HttpException {
  constructor(response: string | Record<string, any>, status: number, appError: ServerError) {
    super(response, status);
  }
}
