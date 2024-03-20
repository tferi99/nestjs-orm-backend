import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { PersonRepository } from './person.repository';
import { CompanyRepository } from '../company/company.repository';
import { Company } from '../company/company.entity';
import { Person } from './person.entity';
import { Auth } from '@nestjs-orm/client';
import { UserRepository } from '../../admin/user/user.repository';

@Injectable()
export class PersonService {
  constructor(
    private em: EntityManager,
    private e: EntityManager,
    private personRepository: PersonRepository,
    private companyRepository: CompanyRepository,
    private userRepository: UserRepository,
  ) {}

  async createTestData(owner: Auth) {
    await this.em.transactional(async (em) => {
      const user = await this.userRepository.getReference(owner.id);

      // MS
      const c1: Company = await this.companyRepository.insert({
        name: 'Microsoft',
        active: true,
        location: 'Redmond',
      });
      const p1: Person = await this.personRepository.insert({
        name: 'Bill Gates',
        pin: '123',
        active: false,
        workingFor: c1,
        user,
      });
      const p2: Person = await this.personRepository.insert({
        name: 'Steve Ballmer',
        pin: '987654',
        active: false,
        workingFor: c1,
        user,
      });
      const p3: Person = await this.personRepository.insert({
        name: 'Satya Nadella',
        pin: 'abc123',
        active: true,
        workingFor: c1,
        user,
      });

      // Apple
    });
  }

  async deleteTestData() {
    await this.em.transactional(async (em) => {
      await this.personRepository.nativeDelete({});
      await this.companyRepository.nativeDelete({});
    });
  }

  async test(p: Person, name: string, transaction: boolean, error: boolean): Promise<void> {
    console.log('ENTRY: test()');
    if (transaction) {
      console.log('BEFORE transaction 2');
      await this.em.transactional(async (em) => {
        console.log('START transaction 2');
        this.doTest(p, name, error);
        console.log('END transaction 2');
      });
      console.log('AFTER transaction 2');
    } else {
      this.doTest(p, name, error);
    }
    console.log('EXIT: test()');
  }

  private doTest(p: Person, name: string, error: boolean): void {
    p.name = name;
    this.personRepository.persist(p);
    if (error) {
      throw new Error('Error from PersonService.test()');
    }
  }
}
