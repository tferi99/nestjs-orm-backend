import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { BASE_URL } from './config';
import { AuthForServer, AuthReason, ClientConnectionDto, WsEvent } from '@nestjs-orm/client';
import { TestWsClient } from './common/test-ws-client';
import { TEST_SERVER_PORT } from './data/data';
import { WsExceptionWithType } from '../src/auth/exception/ws-exceptions';
import { TestJwtTokenProvider } from './common/test-jwt-token-provider';
import { TEST_ADMIN_CREDENTIALS, TEST_USER1_CREDENTIALS } from './data/creadentials';

let adminJwt: string;
let userJwt: string;
/**
 * Tests:
 *  [1] check WS connection
 *  [2] Ping without user -> ok
 *  [3] PingWithAuth without user -> fails
 *  [4] PingAdminOnly without user -> fails
 *  [5] auth as user
 *  [6] PingWithAuth with User -> ok
 *  [7] PingAdminOnly with User -> fails
 *  [8] logout
 *  [9] auth as admin
 *  [10] PingAdminOnly with admin -> ok
 */

let wsClient: TestWsClient;

describe('Features: add, remove, check', () => {
  beforeAll(async () => {
    wsClient = new TestWsClient('localhost', String(TEST_SERVER_PORT));

    adminJwt = await TestJwtTokenProvider.getJwtToken(TEST_ADMIN_CREDENTIALS);
    userJwt = await TestJwtTokenProvider.getJwtToken(TEST_USER1_CREDENTIALS);
  });

  afterAll(async () => {
    if (wsClient) {
      wsClient.socket.close();
    }
  });

  const step1 = '[1] check WS connection';
  it(step1, async () => {
    return request(BASE_URL)
      .get('/client')
      .set('Authorization', `Bearer ${adminJwt}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        const conns: ClientConnectionDto[] = response.body;
        const found = conns.filter((conn) => conn.socketId === wsClient.socket.id);
        expect(found.length).toEqual(1);
      });
  });

  const step2 = '[2] Ping without user -> ok';
  it(step2, (done) => {
    wsClient.socket.on(WsEvent.Pong, (data) => {
      expect(data).toEqual(step2);

      wsClient.socket.off(WsEvent.Pong);
      done();
    });
    wsClient.socket.emit(WsEvent.Ping, step2);
  });

  const step3 = '[3] PingWithAuth without user -> fails';
  it(step3, (done) => {
    wsClient.socket.on(WsEvent.Exception, (data) => {
      const ex: WsExceptionWithType = data;
      expect(ex.type).toEqual('Unauthorized');

      wsClient.socket.off(WsEvent.Exception);
      done();
    });
    wsClient.socket.emit(WsEvent.PingWithAuth, step3);
  });

  const step4 = '[4] PingAdminOnly without user -> fails';
  it(step4, (done) => {
    wsClient.socket.on(WsEvent.Exception, (data) => {
      const ex: WsExceptionWithType = data;
      expect(ex.type).toEqual('Unauthorized');

      wsClient.socket.off(WsEvent.Exception);
      done();
    });
    wsClient.socket.emit(WsEvent.PingAdminOnly, step4);
  });

  const step5 = '[5] auth as user';
  it(step5, (done) => {
    wsClient.socket.on(WsEvent.Authorized, (res) => {
      const data: AuthReason = res;
      expect(data).toEqual(AuthReason.Login);

      wsClient.socket.off(WsEvent.Authorized);
      done();
    });

    const authTokenData: AuthForServer = {
      token: userJwt,
      reason: AuthReason.Login,
    };
    wsClient.socket.emit(WsEvent.Auth, authTokenData);
  });

  const step6 = '[6] PingWithAuth with user -> ok';
  it(step6, (done) => {
    wsClient.socket.on(WsEvent.Pong, (data) => {
      expect(data).toEqual(step6);

      wsClient.socket.off(WsEvent.Pong);
      done();
    });
    wsClient.socket.emit(WsEvent.PingWithAuth, step6);
  });

  const step7 = '[7] PingAdminOnly with user -> fails';
  it(step7, (done) => {
    wsClient.socket.on(WsEvent.Exception, (data) => {
      const ex: WsExceptionWithType = data;
      expect(ex.type).toEqual('Unauthorized');

      wsClient.socket.off(WsEvent.Exception);
      done();
    });
    wsClient.socket.emit(WsEvent.PingAdminOnly, step7);
  });

  const step8 = '[8] logout';
  it(step8, () => {
    wsClient.socket.emit(WsEvent.Logout);
  });

  const step9 = '[9] auth as admin';
  it(step9, (done) => {
    wsClient.socket.on(WsEvent.Authorized, (res) => {
      const data: AuthReason = res;
      expect(data).toEqual(AuthReason.Login);

      wsClient.socket.off(WsEvent.Authorized);
      done();
    });

    const authTokenData: AuthForServer = {
      token: adminJwt,
      reason: AuthReason.Login,
    };
    wsClient.socket.emit(WsEvent.Auth, authTokenData);
  });

  const step10 = '[10] PingAdminOnly with admin -> ok';
  it(step10, (done) => {
    wsClient.socket.on(WsEvent.Pong, (data) => {
      expect(data).toEqual(step10);

      wsClient.socket.off(WsEvent.Pong);
      done();
    });
    wsClient.socket.emit(WsEvent.PingAdminOnly, step10);
  });
});
