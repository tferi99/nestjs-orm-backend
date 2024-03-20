import { Company, Person, User } from '@nestjs-orm/client';

export const TEST_SERVER_PORT = 3020;

export const TEST_ADMIN: User = {
  id: 0,
  name: 'test_admin',
  password: 'admin',
  active: true,
  admin: true,
  user: false,
};

export const TEST_USER1: User = {
  id: 0,
  name: 'test_user1',
  password: '// = 1',
  active: true,
  admin: false,
  user: true,
};

export const TEST_USER2: User = {
  id: 0,
  name: 'test_// = 2',
  password: '// = 2',
  active: true,
  admin: false,
  user: true,
};

export const TEST_COMPANY: Company = {
  id: 0,
  name: 'test_company',
  active: true,
  location: 'Budapest',
};

export const TEST_PERSON: Person = {
  id: 0,
  name: 'test_person',
  pin: '12345',
  workingFor: TEST_COMPANY,
  active: true,
  user: TEST_USER1,
};

