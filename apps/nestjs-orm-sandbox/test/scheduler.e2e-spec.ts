import { TestJwtTokenProvider } from './common/test-auth-utils';
import * as request from 'supertest';
import { BASE_URL } from './config';
import { HttpStatus } from '@nestjs/common';
import { ScedulersInfo } from '../src/feature-modules/dev/dev.controller';
import { SchedulerUtils } from './common/scheduler-utils';

let adminJwt: string = undefined;

/**
 * Tests:
 *  BEFORE: stop all schedulers
 *  [1] check if no scheduler
 */

describe('Scheduler', () => {
  beforeAll(async () => {
    adminJwt = await TestJwtTokenProvider.getTestAdminJwtToken();
    await SchedulerUtils.stopAllSchedulers();
  });

  it('[1] check if no scheduler', async () => {
    return request(BASE_URL)
      .get('/dev/schedulers')
      .set('Authorization', `Bearer ${adminJwt}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        const si: ScedulersInfo = response.body;
        expect(si.intervals.length).toEqual(0);
        expect(si.timeouts.length).toEqual(0);
        expect(si.cronJobs).toEqual({});
      });
  });
});
