import { Body, Controller, Delete, forwardRef, Get, Inject, Param, ParseIntPipe, Post, Put, Req } from '@nestjs/common';
import { Person } from './person.entity';
import { TraceService } from '../../../core/trace/trace.service';
import { PersonRepository } from './person.repository';
import { CrudOperationControl } from '../../../core/orm/controller/crud-operation-guard/crud-operation-control.decorator';
import { EntityManager } from '@mikro-orm/core';
import { UserRepository } from '../../admin/user/user.repository';
import { CurrentUser } from '../../../auth/current-user.decorator';
import { Auth, Role, SENSITIVE_DATA_MASK } from '@nestjs-orm/client';
import { OrmCrudForCurrentUserController } from '../../../core/orm/controller/orm-crud-for-current-user.controller';
import { ClientConnectionService } from '../../../client-connection/client-connection.service';
import { PersonService } from './person.service';
import { Request } from 'express';
import { CompanyRepository } from '../company/company.repository';
import { Company } from '../company/company.entity';
import { Roles } from '../../../auth/role/roles.decorator';

@Controller('person')
@Roles(Role.Admin)
@CrudOperationControl({
  getAll: true,
  get: true,
  insert: true,
  update: true,
  delete: true,
  deleteAll: true,
})
export class PersonController extends OrmCrudForCurrentUserController<Person> {
  constructor(
    private repository: PersonRepository,
    private userRepository: UserRepository,
    private companyRepository: CompanyRepository,
    @Inject(forwardRef(() => TraceService)) traceService: TraceService,
    @Inject(forwardRef(() => ClientConnectionService)) private clientConnectionService: ClientConnectionService,
    private personService: PersonService,
  ) {
    super({ repository, traceService, userRepository, convertSensitiveData: true });
  }

  @Post('/createTestData')
  async createTestData(@CurrentUser() me: Auth): Promise<void> {
    this.repo.em.isInTransaction();
    return this.personService.createTestData(me);
  }

  @Delete('/deleteTestData')
  async deleteTestData(): Promise<void> {
    return this.personService.deleteTestData();
  }

  @Put('/test_without_transaction/:id/:name/:name2')
  async testWithoutTransaction(@Param('id', ParseIntPipe) id: number, @Param('name') name: string, @Param('name2') name2: string): Promise<void> {
    const p = await this.repo.findOne(id);
    p.name = name;
    this.repo.persist(p);
    await this.personService.test(p, name2, false, false);

    this.repo.em.flush();
  }

  @Post('/company/:companyId')
  async insertForCompany(@Req() req: Request, @CurrentUser() me: Auth, @Body() data: Person, @Param('companyId', ParseIntPipe) companyId: number): Promise<Person> {
    const c: Company = this.companyRepository.getReference(companyId);
    data.workingFor = c;
    return this.insert(req, me, data);
  }

  @Put('/test_with_transaction/:id/:name/:name2')
  async testWithTransaction(@Param('id', ParseIntPipe) id: number, @Param('name') name: string, @Param('name2') name2: string): Promise<void> {
    console.log('BEFORE transaction 1');
    await this.repo.em.transactional(async (em) => {
      //    await this.em.transactional(async (em) => {
      console.log('START transaction 1');
      const p = await this.repo.findOne(id);
      p.name = name;
      this.repo.persist(p);

      console.log('BEFORE call test()');
      await this.personService.test(p, name2, true, false);

      console.log('END transaction 1');
    });
    console.log('AFTER transaction 1');
  }

  @Get('/test')
  test(): Promise<Person[]> {
    return this.repo.find(undefined, {
      filters: {
        owner: { id: 3 },
        pin: { $and: [{ $not: { $null: true } }, { $ne: '' }] },
        active: {},
      },
    });
  }

  protected convertSensitiveData(orig: Person): Person {
    return {
      ...orig,
      pin: SENSITIVE_DATA_MASK,
    } as Person;
  }
}
