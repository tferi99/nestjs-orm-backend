import { WsException } from '@nestjs/websockets';

export type WsExceptionType = 'BadRequest' | 'Unauthorized' | 'Unknown';

export class WsExceptionWithType extends WsException {
  readonly type: WsExceptionType;

  constructor(type: WsExceptionType, message: string | unknown) {
    const error = {
      type,
      message,
    };
    super(error);
    this.type = type;
  }

  toString(): string {
    return `Error[${this.type}]: ${this.message}`;
  }
}

export class WsBadRequestException extends WsExceptionWithType {
  constructor(message: string | unknown) {
    super('BadRequest', message);
  }
}

export class WsUnauthorizedException extends WsExceptionWithType {
  constructor(message: string | unknown) {
    super('Unauthorized', message);
  }
}

export class WsUnknownException extends WsExceptionWithType {
  constructor(message: string | unknown) {
    super('Unknown', message);
  }
}
