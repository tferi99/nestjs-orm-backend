import * as request from 'supertest';
import { BASE_URL } from './config';
import { HttpStatus } from '@nestjs/common';
import { Company, Person } from '@nestjs-orm/client';
import { TEST_COMPANY, TEST_PERSON } from './data/data';
import { TestJwtTokenProvider } from './common/test-jwt-token-provider';
import { TEST_ADMIN_CREDENTIALS, TEST_USER1_CREDENTIALS } from './data/creadentials';
import { CompanyTestHelper } from './utils/CompanyTestHelper';

let testCompany: Company = undefined;
let testPerson: Person = undefined;
let jwtForAdmin: string;
let jwtForUser1: string;

/**
 * beforeAll:
 *  - delete test company if exists (and test persons by cascade)
 *  - create new test company
 *
 * Tests:
 *  [1] create company
 *  [2] create person as admin
 *  [3] try to get this person as user -> fails
 *  [4] try to get this person as admin -> ok
 *  [5] try to update this person as user -> fails
 *  [6] try to update this person as admin -> ok
 *  [7] try to delete this person as user -> fails
 *  [8] try to delete this person as admin -> ok
 */
describe('OrmCrudForCurrentUserController', () => {
  beforeAll(async () => {
    jwtForAdmin = await TestJwtTokenProvider.getJwtToken(TEST_ADMIN_CREDENTIALS);
    jwtForUser1 = await TestJwtTokenProvider.getJwtToken(TEST_USER1_CREDENTIALS);

    const response = await request(BASE_URL)
      .get('/company/name/' + TEST_COMPANY.name)
      .set('Authorization', `Bearer ${jwtForAdmin}`)
      .expect(HttpStatus.OK);
    const c: Company = response.body;

    // delete if exists
    if (c && c.id !== undefined) {
      await request(BASE_URL)
        .delete('/company/' + c.id)
        .set('Authorization', `Bearer ${jwtForAdmin}`)
        .expect(HttpStatus.OK);
    }
  });

  afterAll(async () => {
    const response = await request(BASE_URL)
      .delete('/company/' + testCompany.id)
      .set('Authorization', `Bearer ${jwtForAdmin}`)
      .expect(HttpStatus.OK);
  });

  it('[1] create company', async () => {
    await CompanyTestHelper.createCompany(TEST_COMPANY, jwtForAdmin);
    testCompany = CompanyTestHelper.lastCompany;
  });

  it('[2] create person as admin', async () => {
    const data: Person = { ...TEST_PERSON, workingFor: undefined };

    return request(BASE_URL)
      .post('/person/company/' + testCompany.id)
      .send(data)
      .set('Authorization', `Bearer ${jwtForAdmin}`)
      .expect(HttpStatus.CREATED)
      .expect((response: request.Response) => {
        testPerson = response.body;
        expect(testPerson).toBeDefined();
        expect(testPerson.id).toBeDefined();
        expect(testPerson.name).toEqual(TEST_PERSON.name);
      });
  });

  it('[3] try to get this person as user -> fails', async () => {
    return request(BASE_URL)
      .get('/person/' + testPerson.id)
      .set('Authorization', `Bearer ${jwtForUser1}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        const p: Person = response.body;
        expect(p.id).not.toBeDefined();
      });
  });

  it('[4] try to get this person as admin -> ok', async () => {
    return request(BASE_URL)
      .get('/person/' + testPerson.id)
      .set('Authorization', `Bearer ${jwtForAdmin}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        const p: Person = response.body;
        expect(p.id).toBeDefined();
      });
  });

  it('[5] try to update this person as user -> fails', async () => {
    const change: Partial<Person> = {
      active: false,
    };
    return request(BASE_URL)
      .put('/person/' + testPerson.id)
      .send(change)
      .set('Authorization', `Bearer ${jwtForUser1}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        const result = Number(response.text);
        expect(result).toEqual(0);
      });
  });

  it('[6] try to update this person as admin -> ok', async () => {
    const change: Partial<Person> = {
      active: false,
    };
    return request(BASE_URL)
      .put('/person/' + testPerson.id)
      .send(change)
      .set('Authorization', `Bearer ${jwtForAdmin}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        const result = Number(response.text);
        expect(result).toEqual(1);
      });
  });

  it('[7] try to delete this person as user -> fails', async () => {
    return request(BASE_URL)
      .delete('/person/' + testPerson.id)
      .set('Authorization', `Bearer ${jwtForUser1}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        const result = Number(response.text);
        expect(result).toEqual(0);
      });
  });

  it('[8] try to delete this person as admin -> ok', async () => {
    return request(BASE_URL)
      .delete('/person/' + testPerson.id)
      .set('Authorization', `Bearer ${jwtForUser1}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        const result = Number(response.text);
        expect(result).toEqual(0);
      });
  });
});
