import * as request from 'supertest';
import { APP_WELCOME } from '../src/app.controller';
import { TEST_BAD_CREDENTIALS, TEST_ADMIN_CREDENTIALS, TEST_USER1_CREDENTIALS } from './data/creadentials';
import { HttpStatus } from '@nestjs/common';
import { BASE_URL } from './config';
import { JwtPayload } from '@nestjs-orm/client';
import { TestJwtTokenProvider } from './common/test-jwt-token-provider';
import { jwtDecode } from 'jwt-decode';

/**
 * This approach requires a running server on BASE_URL.
 */

let jwtForAdmin: string;
let jwtForUser1: string;

describe('Auth', () => {
  beforeAll(async () => {
    // JWT
    jwtForAdmin = await TestJwtTokenProvider.getJwtToken(TEST_ADMIN_CREDENTIALS);
    jwtForUser1 = await TestJwtTokenProvider.getJwtToken(TEST_USER1_CREDENTIALS);
  });

  it('Initial request "/"', () => {
    return request(BASE_URL).get('/').expect(200).expect(APP_WELCOME);
  });

  describe('Authentication', () => {
    it('Login failed', async () => {
      return request(BASE_URL)
        .post('/auth/login')
        .send(TEST_BAD_CREDENTIALS)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((response: request.Response) => {
          const { access_token } = response.body;
          expect(access_token).not.toBeDefined();
        });
    });

    it('Admin login OK', async () => {
      return request(BASE_URL)
        .post('/auth/login')
        .send(TEST_ADMIN_CREDENTIALS)
        .expect(HttpStatus.CREATED)
        .expect((response: request.Response) => {
          const { access_token } = response.body;
          expect(typeof access_token).toBe('string');

          const payload: JwtPayload = jwtDecode(access_token);
          expect(payload.username).toEqual(TEST_ADMIN_CREDENTIALS.username);
        });
    });

    it('User login OK', async () => {
      return request(BASE_URL)
        .post('/auth/login')
        .send(TEST_USER1_CREDENTIALS)
        .expect(HttpStatus.CREATED)
        .expect((response: request.Response) => {
          const { access_token } = response.body;
          expect(typeof access_token).toBe('string');

          const payload: JwtPayload = jwtDecode(access_token);
          expect(payload.username).toEqual(TEST_USER1_CREDENTIALS.username);
        });
    });
  });

  describe('Authorization', () => {
    it('REST unauthorized (bad JWT token)', () => {
      return request(BASE_URL).get('/client/dev').set('Authorization', 'Bearer something').expect(HttpStatus.UNAUTHORIZED);
    });

    it('REST with Admin OK', async () => {
      return request(BASE_URL).get('/client/dev').set('Authorization', `Bearer ${jwtForAdmin}`).expect(HttpStatus.OK);
    });

    it('REST with Non-admin calls admin failed', async () => {
      return request(BASE_URL).get('/client/dev').set('Authorization', `Bearer ${jwtForUser1}`).expect(HttpStatus.FORBIDDEN);
    });

    it('JWT renew for user', async () => {
      return request(BASE_URL)
        .post('/auth/renew')
        .set('Authorization', `Bearer ${jwtForUser1}`)
        .expect(HttpStatus.CREATED)
        .expect((response: request.Response) => {
          const { access_token } = response.body;
          expect(typeof access_token).toBe('string');

          const payload: JwtPayload = jwtDecode(access_token);
          expect(payload.username).toEqual(TEST_USER1_CREDENTIALS.username);
          expect(payload.username).not.toEqual(TEST_ADMIN_CREDENTIALS.username);
        });
    });
  });
});
