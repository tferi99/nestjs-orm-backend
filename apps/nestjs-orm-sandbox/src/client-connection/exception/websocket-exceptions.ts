import { WsException } from '@nestjs/websockets';

export class ConnectionNotFoundException extends WsException {
  constructor(message: string) {
    super(message);
  }
}
