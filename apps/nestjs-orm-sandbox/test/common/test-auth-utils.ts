import * as request from 'supertest';
import { Credentials } from '../data/creadentials';
import { HttpStatus } from '@nestjs/common';
import { BASE_URL } from '../config';
import { AuthForServer, AuthReason, JwtPayload, WsEvent } from '@nestjs-orm/client';
import { TestWsClient } from './test-ws-client';
import jwt_decode from 'jwt-decode';

export class TestAuthUtils {
  static loginForTests = async (cred: Credentials): Promise<string> => {
    let jwtToken = '';

    //console.log('loginForTests: ', cred);
    const res = await request(BASE_URL)
      .post('/auth/login')
      .send(cred)
      .expect(HttpStatus.CREATED)
      .expect((response: request.Response) => {
        const { access_token } = response.body;
        jwtToken = access_token;
      });
    return jwtToken;
  };

  static authorizeSocket(client: TestWsClient, done: jest.DoneCallback, token: string): void {
    const payload: JwtPayload = jwt_decode(token);
    //console.log(`socket authorizing for user[${payload.username}]`);
    const authTokenData: AuthForServer = {
      token,
      reason: AuthReason.Login,
    };

    client.socket.on(WsEvent.Authorized, (res) => {
      const data: AuthReason = res;
      expect(data).toEqual(AuthReason.Login);
      done();
    });
    client.socket.emit(WsEvent.Auth, authTokenData);
  }
}
