import * as request from 'supertest';
import { BASE_URL } from '../config';
import { HttpStatus } from '@nestjs/common';
import { User } from '@nestjs-orm/client';
import { TestJwtTokenProvider } from './test-jwt-token-provider';
import { TEST_ADMIN_CREDENTIALS } from '../data/creadentials';

export class TestUserFactory {
  static async recreateUser(user: User): Promise<User> {
    const jwtForAdmin = await TestJwtTokenProvider.getJwtToken(TEST_ADMIN_CREDENTIALS);

    const response = await request(BASE_URL).get('/user').set('Authorization', `Bearer ${jwtForAdmin}`).expect(HttpStatus.OK);
    const users: User[] = response.body;

    const found = users.filter((u) => u.name === user.name);
    if (found.length > 0) {
      // delete if exist
      await request(BASE_URL)
        .delete('/user/' + found[0].id)
        .set('Authorization', `Bearer ${jwtForAdmin}`)
        .expect(HttpStatus.OK);
    }
    // create new TEST_USER
    let newUser: User;
    await request(BASE_URL)
      .post('/user')
      .send(user)
      .set('Authorization', `Bearer ${jwtForAdmin}`)
      .expect(HttpStatus.CREATED)
      .expect((response: request.Response) => {
        newUser = response.body;
        expect(newUser).toBeDefined();
        expect(newUser.id).toBeDefined();
        expect(newUser.name).toEqual(user.name);
      });
    return newUser;
  }

  static async deleteUser(id: number) {
    const jwtForAdmin = await TestJwtTokenProvider.getJwtToken(TEST_ADMIN_CREDENTIALS);
    await request(BASE_URL)
      .delete('/user/' + id)
      .set('Authorization', `Bearer ${jwtForAdmin}`)
      .expect(HttpStatus.OK);
  }
}
