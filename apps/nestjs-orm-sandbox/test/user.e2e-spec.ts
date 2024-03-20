import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { BASE_URL } from './config';
import { SENSITIVE_DATA_MASK, User } from '@nestjs-orm/client';
import { TEST_ADMIN_CREDENTIALS, TEST_USER1_CREDENTIALS } from './data/creadentials';
import { TEST_USER1 } from './data/data';
import { TestJwtTokenProvider } from './common/test-jwt-token-provider';

let jwtForAdmin: string;
let jwtForUser1: string;
let foundTestUser: User = undefined;
let createdTestUser: User = undefined;

/**
 * Tests:
 *  [1] get all users
 *  [2] get - not implemented
 *  [3] delete if test user exists
 *  [4] check if test user deleted successfully
 *  [5] insert test user as user -> fails
 *  [6] insert test user as admin -> ok
 *  [7] update testUser
 *  [8] check if test user updated successfully
 *  [9] delete test user
 */

describe('User', () => {
  beforeAll(async () => {
    // JWT
    jwtForAdmin = await TestJwtTokenProvider.getJwtToken(TEST_ADMIN_CREDENTIALS);
    jwtForUser1 = await TestJwtTokenProvider.getJwtToken(TEST_USER1_CREDENTIALS);
  });

  describe('CRUD', () => {
    it('[1] getAll', async () => {
      return request(BASE_URL)
        .get('/user')
        .set('Authorization', `Bearer ${jwtForAdmin}`)
        .expect(HttpStatus.OK)
        .expect((response: request.Response) => {
          const users: User[] = response.body;
          expect(users.length).toBeGreaterThan(0);
          expect(users[0].password).toEqual(SENSITIVE_DATA_MASK); // for next steps
          foundTestUser = users.find((u) => u.name === TEST_USER1_CREDENTIALS.username);
        });
    });

    it('[2] get - not implemented', async () => {
      return request(BASE_URL).get('/user/1').set('Authorization', `Bearer ${jwtForAdmin}`).expect(HttpStatus.UNAUTHORIZED);
    });

    it('[3] delete if test user exists', async () => {
      if (foundTestUser) {
        return request(BASE_URL)
          .delete('/user/' + foundTestUser.id)
          .set('Authorization', `Bearer ${jwtForAdmin}`)
          .expect(HttpStatus.OK);
      }
    });

    it('[4] check if test user deleted successfully', async () => {
      if (foundTestUser) {
        return request(BASE_URL)
          .get('/user')
          .set('Authorization', `Bearer ${jwtForAdmin}`)
          .expect((response: request.Response) => {
            const users = response.body;
            expect(users.length).toBeGreaterThan(0);
            const u = users.find((u) => u.name === TEST_USER1.name);
            expect(u).not.toBeDefined();
          });
      }
    });

    it('[5] insert test user as user -> fails', async () => {
      return request(BASE_URL).post('/user').send(TEST_USER1).set('Authorization', `Bearer ${jwtForUser1}`).expect(HttpStatus.FORBIDDEN);
    });

    it('[6] insert test user as admin -> ok', async () => {
      return request(BASE_URL)
        .post('/user')
        .send(TEST_USER1)
        .set('Authorization', `Bearer ${jwtForAdmin}`)
        .expect(HttpStatus.CREATED)
        .expect((response: request.Response) => {
          createdTestUser = response.body;
          expect(createdTestUser).toBeDefined();
          expect(createdTestUser.id).toBeDefined();
          expect(createdTestUser.name).toEqual(TEST_USER1.name);
        });
    });

    it('[7] update test user', async () => {
      const change: Partial<User> = {
        user: false,
      };
      return request(BASE_URL)
        .put('/user/' + createdTestUser.id)
        .send(change)
        .set('Authorization', `Bearer ${jwtForAdmin}`)
        .expect(HttpStatus.OK)
        .expect((response: request.Response) => {
          const result = Number(response.text);
          expect(result).toEqual(1);
        });
    });

    it('[8] check if test user updated successfully', async () => {
      return request(BASE_URL)
        .get('/user')
        .set('Authorization', `Bearer ${jwtForAdmin}`)
        .expect((response: request.Response) => {
          const users = response.body;
          //console.log('USERS:', users);
          expect(users.length).toBeGreaterThan(0);
          foundTestUser = users.find((u) => u.name === TEST_USER1.name);
          expect(foundTestUser.name).toEqual(TEST_USER1.name);
          expect(foundTestUser.user).toEqual(false);
        });
    });

    it('[9] delete test user', async () => {
      return request(BASE_URL)
        .delete('/user/' + foundTestUser.id)
        .set('Authorization', `Bearer ${jwtForAdmin}`)
        .expect(HttpStatus.OK)
        .expect((response: request.Response) => {
          const result = Number(response.text);
          expect(result).toEqual(1);
        });
    });
  });
});
