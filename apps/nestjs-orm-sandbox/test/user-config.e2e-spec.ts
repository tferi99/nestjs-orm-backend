import { TEST_SERVER_PORT, TEST_USER1, TEST_USER2 } from './data/data';
import { AppConfig, ConfigType, Feature, FeatureUtils, User, UserConfig, UserConfigId, WsEvent } from '@nestjs-orm/client';
import { TestWsClient } from './common/test-ws-client';
import { TestUserFactory } from './common/test-user-factory';
import * as request from 'supertest';
import { BASE_URL } from './config';
import { HttpStatus } from '@nestjs/common';
import { SchedulerUtils } from './common/scheduler-utils';
import { TestJwtTokenProvider } from './common/test-jwt-token-provider';
import { TestAuthUtils } from './common/test-auth-utils';
import { TEST_ADMIN_CREDENTIALS, TEST_USER1_CREDENTIALS, TEST_USER2_CREDENTIALS } from './data/creadentials';
import { TestFeatureUtils } from './common/test-feature-utils';

let wsClientUser1: TestWsClient;
let testUser1: User = undefined;
let testUser2: User = undefined;
let jwtForAdmin: string = undefined;
let jwtForUser1: string = undefined;
let jwtForUser2: string = undefined;
let allConfigs: AppConfig[];
let userFeatureData: UserConfig[];

const CFG_VAR1: UserConfigId = UserConfigId.TestString;
const CFG_VAR1_ORIG_VALUE = 'dog';
const CFG_VAR1_NEW_VALUE = 'cat';

/**
 * Startup:
 * [INIT] authorize WS client for user1
 * [INIT] addFeature: UserConfig to user1
 *
 * Tests:
 *  [1] create new variable for user1 and listen to pushed event
 */

describe('UserConfig', () => {
  beforeAll(async () => {
    await SchedulerUtils.stopAllSchedulers();

    // users
    testUser1 = await TestUserFactory.recreateUser(TEST_USER1);
    testUser2 = await TestUserFactory.recreateUser(TEST_USER2);

    // WS clients
    wsClientUser1 = new TestWsClient('localhost', String(TEST_SERVER_PORT));

    // JWT
    jwtForAdmin = await TestJwtTokenProvider.getJwtToken(TEST_ADMIN_CREDENTIALS);
    jwtForUser1 = await TestJwtTokenProvider.getJwtToken(TEST_USER1_CREDENTIALS);
    jwtForUser2 = await TestJwtTokenProvider.getJwtToken(TEST_USER2_CREDENTIALS);

    // new config for user1
    const cfg: Partial<UserConfig> = {
      type: ConfigType.String,
      value: CFG_VAR1_ORIG_VALUE,
    };
    await request(BASE_URL)
      .put('/userconfig/' + CFG_VAR1)
      .send(cfg)
      .set('Authorization', `Bearer ${jwtForUser1}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        const newCfg: UserConfig = response.body;
        expect(newCfg.configId).toEqual(CFG_VAR1);
      });
  });

  afterAll(async () => {
    if (wsClientUser1) {
      wsClientUser1.socket.close();
    }
    if (testUser1) {
      TestUserFactory.deleteUser(testUser1.id);
    }
    if (testUser2) {
      TestUserFactory.deleteUser(testUser2.id);
    }
  });

  it('[INIT] authorize WS client for user1', (done) => {
    TestAuthUtils.authorizeSocket(wsClientUser1, done, jwtForUser1);
  });

  it(`[INIT] addFeature: ${Feature.UserConfig} to user1`, (done) => {
    TestFeatureUtils.addFeature(wsClientUser1, done, Feature.UserConfig, (data) => {
      userFeatureData = data;
      console.log('CFG: ', data);
      expect(userFeatureData.length).toEqual(1);
      expect(userFeatureData[0].configId).toEqual(CFG_VAR1);
      expect(userFeatureData[0].type).toEqual(ConfigType.String);
      expect(userFeatureData[0].value).toEqual(CFG_VAR1_ORIG_VALUE);
    });
  });

  it('[1] create new variable for user1 and listen to pushed event', (done) => {
    const ev = FeatureUtils.createFeatureWsEventId(Feature.UserConfig, WsEvent.FeatureDataChanged);
    wsClientUser1.socket.on(ev, (res) => {
      const config: UserConfig = res;
      expect(config.configId).toEqual(CFG_VAR1);
      expect(config.value).toEqual(CFG_VAR1_NEW_VALUE);

      wsClientUser1.socket.off(WsEvent.UserConfigChanged);
      done();
    });

    const cfg: Partial<UserConfig> = {
      type: ConfigType.String,
      value: CFG_VAR1_NEW_VALUE,
    };
    request(BASE_URL)
      .put('/userconfig/' + CFG_VAR1)
      .send(cfg)
      .set('Authorization', `Bearer ${jwtForUser1}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        const newCfg: UserConfig = response.body;
        expect(newCfg.configId).toEqual(CFG_VAR1);
      })
      .end((err, res) => {
        if (err) {
          done(err);
        }
      });
  });

  it('AFTER getAll users', async () => {
    console.log('###########################################################################');
    return request(BASE_URL)
      .get('/user')
      .set('Authorization', `Bearer ${jwtForAdmin}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        const users: User[] = response.body;
        expect(users.length).toBeGreaterThan(0);
        console.log('users: ' + users.length);
      });
  });
});
