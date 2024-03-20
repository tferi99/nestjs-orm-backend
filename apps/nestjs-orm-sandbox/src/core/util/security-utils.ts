import * as bcrypt from 'bcrypt';

const SALT = 10;

export class SecurityUtils {
  public static async hashString(str: string): Promise<string> {
    return bcrypt.hash(str, SALT);
  }

  public static hashStringSync(str: string): string {
    return bcrypt.hashSync(str, SALT);
  }

  public static async validateStringAndHash(str: string, hash: string): Promise<boolean> {
    return bcrypt.compare(str, hash);
  }

  public static async validateStringAndHashSync(str: string, hash: string): Promise<boolean> {
    return bcrypt.compare(str, hash);
  }
}
