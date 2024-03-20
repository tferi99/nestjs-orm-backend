import * as request from 'supertest';
import { BASE_URL } from './config';
import { HttpStatus } from '@nestjs/common';
import { TEST_SERVER_PORT, TEST_USER1 } from './data/data';
import { AppConfig, AppConfigId, ConfigType, CustomHttpStatus, Feature, FeatureUtils, User, WsEvent } from '@nestjs-orm/client';
import { TestWsClient } from './common/test-ws-client';
import { TestJwtTokenProvider } from './common/test-jwt-token-provider';
import { TestAuthUtils } from './common/test-auth-utils';
import { TestFeatureUtils } from './common/test-feature-utils';
import { TEST_ADMIN_CREDENTIALS, TEST_USER1_CREDENTIALS } from './data/creadentials';
import { TestUserFactory } from './common/test-user-factory';

let testUser1: User = undefined;
let wsClientAdmin: TestWsClient;
let wsClientUser1: TestWsClient;
let allConfigs: AppConfig[];
let jwtForAdmin: string;
let jwtForUser1: string;

/**
 * Startup:
 *  [INIT] authorize WS client for admin
 *  [INIT] authorize WS client for user1
 *  [INIT] addFeature: AppConfig to admin
 *  [INIT] addFeature: AppConfig to user1
 *
 * Tests:
 *  [1] get all from REST without auth -> fails
 *  [2] get all from REST as user -> fails
 *  [3] get all from REST as admin
 *  [4] get all from WS feature
 *  [5] get by invalid ID -> fails
 *  [6] change application config as user -> fails
 *  [7] change application config as admin
 */
describe('AppConfig', () => {
  beforeAll(async () => {
    // users
    testUser1 = await TestUserFactory.recreateUser(TEST_USER1);

    // WS clients
    wsClientAdmin = new TestWsClient('localhost', String(TEST_SERVER_PORT));
    wsClientUser1 = new TestWsClient('localhost', String(TEST_SERVER_PORT));

    // JWT
    jwtForAdmin = await TestJwtTokenProvider.getJwtToken(TEST_ADMIN_CREDENTIALS);
    jwtForUser1 = await TestJwtTokenProvider.getJwtToken(TEST_USER1_CREDENTIALS);

    // get all AppConfigs from REST as admin
    return request(BASE_URL)
      .get('/appconfig')
      .set('Authorization', `Bearer ${jwtForAdmin}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        allConfigs = response.body;
      });
  });

  afterAll(async () => {
    if (wsClientAdmin) {
      wsClientAdmin.socket.close();
    }
    if (testUser1) {
      TestUserFactory.deleteUser(testUser1.id);
    }
  });

  it('[INIT] authorize WS client for admin', (done) => {
    TestAuthUtils.authorizeSocket(wsClientAdmin, done, jwtForAdmin);
  });

  it('[INIT] authorize WS client for user1', (done) => {
    TestAuthUtils.authorizeSocket(wsClientUser1, done, jwtForUser1);
  });

  it(`[INIT] addFeature: ${Feature.AppConfig} to admin`, (done) => {
    TestFeatureUtils.addFeature(wsClientAdmin, done, Feature.AppConfig);
  });

  it(`[INIT] addFeature: ${Feature.AppConfig} to user1`, (done) => {
    TestFeatureUtils.addFeature(wsClientUser1, done, Feature.AppConfig);
  });

  it('[1] get all from REST without auth -> fails', async () => {
    return request(BASE_URL).get('/appconfig').expect(HttpStatus.UNAUTHORIZED);
  });

  it('[2] get all from REST as user -> fails', async () => {
    return request(BASE_URL).get('/appconfig').set('Authorization', `Bearer ${jwtForUser1}`).expect(HttpStatus.FORBIDDEN);
  });

  it('[3] get all from REST as admin', async () => {
    return request(BASE_URL)
      .get('/appconfig')
      .set('Authorization', `Bearer ${jwtForAdmin}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        const items: AppConfig[] = response.body;
        expect(items).toBeDefined();
        expect(items.length).toBeGreaterThan(0);
      });
  });

  it('[4] get all from WS feature', (done) => {
    const ev = FeatureUtils.createFeatureWsEventId(Feature.AppConfig, WsEvent.FeatureAdded);
    wsClientAdmin.socket.on(ev, (res) => {
      const data: AppConfig[] = res;
      expect(data.length).toEqual(allConfigs.length);
      done();
    });
    wsClientAdmin.socket.emit(WsEvent.AddFeature, Feature.AppConfig);
  });

  it('[5] get by invalid ID -> fails', async () => {
    return request(BASE_URL)
      .get('/appconfig/' + AppConfigId.TestInvalidVar)
      .set('Authorization', `Bearer ${jwtForAdmin}`)
      .expect(CustomHttpStatus.ApplicationError);
  });

  it('[6] change application config as user -> fails', async () => {
    const cfg: AppConfig = {
      configId: AppConfigId.TestVar,
      type: ConfigType.String,
      value: 'something',
    };
    return request(BASE_URL)
      .put('/appconfig/' + AppConfigId.TestVar)
      .send(cfg)
      .set('Authorization', `Bearer ${jwtForUser1}`)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('[7] change application config as admin and notified as user', (done) => {
    const ev = FeatureUtils.createFeatureWsEventId(Feature.AppConfig, WsEvent.FeatureDataChanged);
    wsClientUser1.socket.on(ev, (res) => {
      const data: AppConfig = res;
      done();
    });

    const newValue = 'something-' + Date.now();
    const cfg: AppConfig = {
      configId: AppConfigId.TestVar,
      type: ConfigType.String,
      value: newValue,
    };
    request(BASE_URL)
      .put('/appconfig/' + AppConfigId.TestVar)
      .send(cfg)
      .set('Authorization', `Bearer ${jwtForAdmin}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        const changed: AppConfig = response.body;
        expect(changed.value).toEqual(newValue);
      })
      .end((err, res) => {
        if (err) {
          done(err);
        }
      });
  });
});
