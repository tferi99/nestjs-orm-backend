import { Body, Controller, Delete, forwardRef, Inject, Param, ParseIntPipe, Put, Req } from '@nestjs/common';
import { Roles } from '../../../auth/role/roles.decorator';
import { Feature, Role, SENSITIVE_DATA_MASK, WsEvent } from '@nestjs-orm/client';
import { User } from '../../../core/orm/entity/user.entity';
import { UserRepository } from './user.repository';
import { EntityData, EntityManager, Primary } from '@mikro-orm/core';
import { CrudOperationControl } from '../../../core/orm/controller/crud-operation-guard/crud-operation-control.decorator';
import { TraceService } from '../../../core/trace/trace.service';
import { Request } from 'express';
import { ClientConnectionService } from '../../../client-connection/client-connection.service';
import { OrmCrudController } from '../../../core/orm/controller/orm-crud.controller';

/**
 * User management for Admins.
 */
@Controller('user')
@Roles(Role.Admin)
@CrudOperationControl({
  getAll: true,
  get: true,
  insert: true,
  update: true,
  delete: true,
})
export class UserController extends OrmCrudController<User> {
  constructor(
    private repository: UserRepository,
    @Inject(forwardRef(() => TraceService)) traceService: TraceService,
    @Inject(forwardRef(() => ClientConnectionService)) private clientConnectionService: ClientConnectionService,
  ) {
    super({ repository, traceService, convertSensitiveData: true });
  }

  @Put('/:id')
  async update(@Req() req: Request, @Param('id', ParseIntPipe) id: Primary<User>, @Body() data: EntityData<User>): Promise<User> {
    const where = this.repo.createFilterQueryForId(id);
    const updated: User = (await super.update(req, id, data)) as User; // cached -> object returned
    if (updated) {
      this.clientConnectionService.broadcast({ user: updated.name }, WsEvent.LogoutOnUserChange, id);
    }
    return updated;
  }

  @Delete('/:id')
  async delete(@Req() req: Request, @Param('id', ParseIntPipe) id: Primary<User>): Promise<number> {
    const deletedUser = await this.repo.get(id); // from cache
    const deleted = await super.delete(req, id);
    if (deleted === 1 && deletedUser) {
      this.clientConnectionService.broadcast({ user: deletedUser.name }, WsEvent.LogoutOnUserChange, id);
    }
    return deleted;
  }

  protected convertSensitiveData(orig: User): User {
    return {
      ...orig,
      password: SENSITIVE_DATA_MASK,
    } as User;
  }
}
