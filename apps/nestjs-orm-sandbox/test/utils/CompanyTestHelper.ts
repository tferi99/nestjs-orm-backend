import * as request from 'supertest';
import { BASE_URL } from '../config';
import { HttpStatus } from '@nestjs/common';
import { Company } from '@nestjs-orm/client';

export class CompanyTestHelper {
  static lastCompany: Company;

  static async createCompany(company: Company, jwt: string) {
    return request(BASE_URL)
      .post('/company')
      .send(company)
      .set('Authorization', `Bearer ${jwt}`)
      .expect(HttpStatus.CREATED)
      .expect((response: request.Response) => {
        CompanyTestHelper.lastCompany = response.body;
        expect(CompanyTestHelper.lastCompany).toBeDefined();
        expect(CompanyTestHelper.lastCompany.id).toBeDefined();
        expect(CompanyTestHelper.lastCompany.name).toEqual(company.name);
      });
  }

  static async updateCompany(company: Company, jwt: string) {
    return request(BASE_URL)
      .put('/company/' + company.id)
      .send(company)
      .set('Authorization', `Bearer ${jwt}`)
      .expect(HttpStatus.OK)
      .expect((response: request.Response) => {
        CompanyTestHelper.lastCompany = response.body;
        expect(CompanyTestHelper.lastCompany).toBeDefined();
        expect(CompanyTestHelper.lastCompany.id).toBeDefined();
        expect(CompanyTestHelper.lastCompany.name).toEqual(company.name);
      });
  }

  static async deleteAllCompanies(jwt: string) {
    return request(BASE_URL).delete('/company').set('Authorization', `Bearer ${jwt}`).expect(HttpStatus.OK);
  }

  static async deleteCompany(id: number, jwt: string) {
    return request(BASE_URL)
      .delete('/company/' + id)
      .set('Authorization', `Bearer ${jwt}`)
      .expect(HttpStatus.OK);
  }

  static async deleteCompanyDirect(id: number, jwt: string) {
    return request(BASE_URL)
      .delete('/company/direct/' + id)
      .set('Authorization', `Bearer ${jwt}`)
      .expect(HttpStatus.OK);
  }

  static async getAllCompanies(jwt: string) {
    const response = await request(BASE_URL).get('/company').set('Authorization', `Bearer ${jwt}`).expect(HttpStatus.OK);
    return response.body as Company[];
  }

  static async getAllCachedCompanies(jwt: string) {
    const response = await request(BASE_URL).get('/company/cache_values/').set('Authorization', `Bearer ${jwt}`).expect(HttpStatus.OK);
    return response.body as Company[];
  }

  static async invalidateCompanyCache(jwt: string) {
    return request(BASE_URL).post('/company/invalidate-cache').set('Authorization', `Bearer ${jwt}`).expect(HttpStatus.CREATED);
  }
}
