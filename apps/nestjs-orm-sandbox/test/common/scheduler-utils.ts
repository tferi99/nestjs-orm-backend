import * as request from 'supertest';
import { BASE_URL } from '../config';
import { HttpStatus } from '@nestjs/common';
import { TestJwtTokenProvider } from './test-jwt-token-provider';
import { TEST_ADMIN_CREDENTIALS } from '../data/creadentials';

export class SchedulerUtils {
  static async stopAllSchedulers() {
    const jwt = await TestJwtTokenProvider.getJwtToken(TEST_ADMIN_CREDENTIALS);
    await request(BASE_URL).delete('/dev/schedulers').set('Authorization', `Bearer ${jwt}`).expect(HttpStatus.OK);
  }
}
