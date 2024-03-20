import { Body, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AnyEntity, DeleteOptions, EntityData, FilterQuery, FindOptions, Primary, UpdateOptions } from '@mikro-orm/core';
import { OrmCrudControllerOperationGuard } from './crud-operation-guard/orm-crud-controller-operation.guard';
import { Request } from 'express';
import { OrmCrudProtectedControllerOptions } from './orm-crud-controller-options';
import { OrmCrudProtectedControllerBase } from './orm-crud-protected-controller.base';
import { NoAuth } from '../../../auth/passport/no-auth.decorator';
import { Roles } from '../../../auth/role/roles.decorator';
import { MapUtils, Role } from '@nestjs-orm/client';

/**
 * End-points:
 *
 *  GET     /                          : getAll
 *  GET     /ID                        : get(id)
 *  POST    /              body: data  : insert(data)
 *  PUT     /ID            body: data  : update(id, data)
 *  DELETE  /ID                        : delete(id)
 *  DELETE  /                          : deleteAll
 */
@UseGuards(OrmCrudControllerOperationGuard)
export abstract class OrmCrudController<E extends AnyEntity<E>> extends OrmCrudProtectedControllerBase<E> {
  protected constructor(controllerOptions: OrmCrudProtectedControllerOptions<E>) {
    super(controllerOptions);
  }

  @Get()
  async getAll(@Req() req: Request, where?: FilterQuery<E>, options?: FindOptions<E>): Promise<E[]> {
    return this.crudGetAll(req, where, options);
  }

  @Get('/:id')
  async get(@Req() req: Request, @Param('id', ParseIntPipe) id: Primary<E>, options?: FindOptions<E>): Promise<E> {
    const where: FilterQuery<E> = this.repo.createFilterQueryForId(id);
    return this.crudGet(req, id, options);
  }

  @Post()
  async insert(@Req() req: Request, @Body() data: E): Promise<E> {
    return this.crudInsert(req, data);
  }

  @Put('/:id')
  async update(@Req() req: Request, @Param('id', ParseIntPipe) id: Primary<E>, @Body() data: EntityData<E>, options?: UpdateOptions<E>): Promise<number | E> {
    const where = this.repo.createFilterQueryForId(id);
    return this.crudUpdate(req, id, data, options);
  }

  @Delete('/:id')
  async delete(@Req() req: Request, @Param('id', ParseIntPipe) id: Primary<E>, options?: DeleteOptions<E>): Promise<number> {
    return this.crudDelete(req, id, options);
  }

  @Delete()
  async deleteAll(@Req() req: Request, where?: FilterQuery<E>, options?: DeleteOptions<E>): Promise<number> {
    if (!where) {
      return this.repo.nativeDelete(this.repo.getEmptyFilterQuery(), options);
    } else {
      return this.repo.nativeDelete(where, options);
    }
  }
}
