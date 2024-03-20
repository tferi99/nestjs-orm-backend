import { Controller, Delete, forwardRef, Get, Inject, Param, ParseIntPipe, Req } from '@nestjs/common';
import { OrmCrudController } from '../../../core/orm/controller/orm-crud.controller';
import { Company } from './company.entity';
import { EntityManager, Primary } from '@mikro-orm/core';
import { TraceService } from '../../../core/trace/trace.service';
import { CompanyRepository } from './company.repository';
import { CrudOperationControl } from '../../../core/orm/controller/crud-operation-guard/crud-operation-control.decorator';
import { ClientConnectionService } from '../../../client-connection/client-connection.service';
import { Request } from 'express';
import { Roles } from '../../../auth/role/roles.decorator';
import { Role } from '@nestjs-orm/client';

@Controller('company')
@Roles(Role.Admin)
@CrudOperationControl({
  getAll: true,
  get: true,
  insert: true,
  update: true,
  delete: true,
  deleteAll: true,
})
export class CompanyController extends OrmCrudController<Company> {
  constructor(
    private repository: CompanyRepository,
    @Inject(forwardRef(() => TraceService)) traceService: TraceService,
    @Inject(forwardRef(() => ClientConnectionService)) private clientConnectionService: ClientConnectionService,
  ) {
    super({ repository, traceService });
  }

  @Get('/name/:name')
  async getByName(@Param('name') name: string): Promise<Company> {
    return this.repo.findOne({ name });
  }

  /**
   * To delete a company from the database directly - cache not affected
   *
   * @param req
   * @param id
   */
  @Delete('/direct/:id')
  async deleteDierct(@Req() req: Request, @Param('id', ParseIntPipe) id: Primary<Company>): Promise<number> {
    const where = this.repo.createFilterQueryForId(id);
    return this.repo.nativeDelete(where);
  }
}
