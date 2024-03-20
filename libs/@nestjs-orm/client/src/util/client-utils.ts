export const SHORT_TOKEN_LEN = 5;

export class ClientUtils {
  static getShortToken(token: string | null | undefined): string {
    if (!token) {
      return '';
    }
    if (token.length < SHORT_TOKEN_LEN * SHORT_TOKEN_LEN) {
      return token.substring(0, SHORT_TOKEN_LEN);
    }
    return token.substring(0, SHORT_TOKEN_LEN) + '.....' + token.substring(token.length - SHORT_TOKEN_LEN, token.length);
  }
}
