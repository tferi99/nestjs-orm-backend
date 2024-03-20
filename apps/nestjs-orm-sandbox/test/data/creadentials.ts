import { DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_USERNAME, DEFAULT_USER_PASSWORD, DEFAULT_USER_USERNAME } from '@nestjs-orm/client';
import { TEST_USER1, TEST_USER2 } from './data';

export interface Credentials {
  username: string;
  password: string;
}

export const TEST_ADMIN_CREDENTIALS: Credentials = {
  username: DEFAULT_ADMIN_USERNAME,
  password: DEFAULT_ADMIN_PASSWORD,
};

export const TEST_USER_CREDENTIALS: Credentials = {
  username: DEFAULT_USER_USERNAME,
  password: DEFAULT_USER_PASSWORD,
};

export const TEST_USER1_CREDENTIALS: Credentials = {
  username: TEST_USER1.name,
  password: TEST_USER1.password,
};

export const TEST_USER2_CREDENTIALS: Credentials = {
  username: TEST_USER2.name,
  password: TEST_USER2.password,
};

export const TEST_BAD_CREDENTIALS: Credentials = {
  username: 'dummy',
  password: '123',
};
