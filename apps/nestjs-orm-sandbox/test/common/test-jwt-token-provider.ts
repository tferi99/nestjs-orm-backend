import { Credentials } from '../data/creadentials';
import { TestAuthUtils } from './test-auth-utils';

export class TestJwtTokenProvider {
  private static tokens: Map<string, string> = new Map<string, string>();
  private static testAdminJwtToken?: string;
  private static testUser1JwtToken?: string;
  private static testUserJwtToken?: string;

  static async getJwtToken(credentials: Credentials) {
    let token = TestJwtTokenProvider.tokens.get(credentials.username);
    if (token) {
      return token;
    }
    token = await TestAuthUtils.loginForTests(credentials);
    TestJwtTokenProvider.tokens.set(credentials.username, token);
    return token;
  }

  static clean() {
    TestJwtTokenProvider.tokens = new Map<string, string>();
  }
}
