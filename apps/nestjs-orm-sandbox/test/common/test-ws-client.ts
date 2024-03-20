import { io, Socket } from 'socket.io-client';

export class TestWsClient {
  private _socket: Socket;

  public get socket(): Socket {
    return this._socket;
  }

  constructor(host: string, port: string) {
    this._socket = io(`http://127.0.0.1:${port}`);

    this._socket.on('connect', () => {
      //console.log('WS connected - client: ' + this._socket.id);
      this._socket.emit('some-event');
    });
  }
}
