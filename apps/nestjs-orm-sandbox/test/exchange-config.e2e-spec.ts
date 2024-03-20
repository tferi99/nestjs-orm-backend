import { TestWsClient } from "./common/test-ws-client";
import { TEST_SERVER_PORT, TEST_USER1, TEST_USER2 } from "./data/data";
import { SchedulerUtils } from "./common/scheduler-utils";
import { TestUserFactory } from "./common/test-user-factory";
import { AuthForServer, AuthReason, User, WsEvent } from "@nestjs-orm/client";
import { TestJwtTokenProvider } from "./common/test-jwt-token-provider";
import { TEST_USER1_CREDENTIALS, TEST_USER2_CREDENTIALS } from "./data/creadentials";

let wsClient1: TestWsClient;
let testUser1: User = undefined;
let jwtForUser1: string = undefined;
let wsClient2: TestWsClient;
let testUser2: User = undefined;
let jwtForUser2: string = undefined;

/**
 * Tests:
 *  [1] auth with user1
 */
describe('User', () => {
  describe('CRUD', () => {
    /**
     * Created pre-requisites:
     *  - socket 1
     *  - socket 2
     *  - non-admin testUser1
     *  - JWT for testUser1
     *  - non-admin testUser2
     *  - JWT for testUser2
     */
    beforeAll(async () => {
      wsClient1 = new TestWsClient('localhost', String(TEST_SERVER_PORT));
      wsClient2 = new TestWsClient('localhost', String(TEST_SERVER_PORT));
      await SchedulerUtils.stopAllSchedulers();

      // user1
      testUser1 = await TestUserFactory.recreateUser(TEST_USER1);
      jwtForUser1 = await TestJwtTokenProvider.getJwtToken(TEST_USER1_CREDENTIALS);
      // user2
      testUser2 = await TestUserFactory.recreateUser(TEST_USER2);
      jwtForUser2 = await TestJwtTokenProvider.getJwtToken(TEST_USER2_CREDENTIALS);
    });

    afterAll(async () => {
      if (wsClient1) {
        wsClient1.socket.close();
      }
      if (wsClient2) {
        wsClient2.socket.close();
      }
      if (testUser1) {
        TestUserFactory.deleteUser(testUser1.id);
      }
      if (testUser2) {
        TestUserFactory.deleteUser(testUser2.id);
      }
    });

    it('[1] auth with user1', (done) => {
      const authTokenData: AuthForServer = {
        token: jwtForUser1,
        reason: AuthReason.Login,
      };

      wsClient1.socket.on(WsEvent.Authorized, (res) => {
        const data: AuthReason = res;
        expect(data).toEqual(AuthReason.Login);
        done();
      });
      wsClient1.socket.emit(WsEvent.Auth, authTokenData);
    });
  });
});
