import { User } from '../entity/user.entity';
import { Body, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../auth/current-user.decorator';
import { Auth, Role, Trace } from '@nestjs-orm/client';
import { DeleteOptions, EntityData, FilterQuery, FindOneOptions, FindOptions, Primary, UpdateOptions } from '@mikro-orm/core';
import { OrmCrudControllerOperationGuard } from './crud-operation-guard/orm-crud-controller-operation.guard';
import { UserRepository } from '../../../feature-modules/admin/user/user.repository';
import { Request } from 'express';
import { OrmCrudOptions, OrmCrudProtectedForCurrentUserControllerOptions } from './orm-crud-controller-options';
import { OrmCrudProtectedControllerBase } from './orm-crud-protected-controller.base';
import { OwnedByUserEntity, OWNER_USER_FIELD_NAME } from '../entity/owned-by-user.entity';
import { NoAuth } from '../../../auth/passport/no-auth.decorator';
import { Roles } from '../../../auth/role/roles.decorator';
import { FeatureEventEmitterForController } from '../../features/feature-event-emitter-for-controller';

const PROP_USER = 'user';

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
export abstract class OrmCrudForCurrentUserController<E extends OwnedByUserEntity> extends OrmCrudProtectedControllerBase<E> {
  private _userRepo: UserRepository;

  protected constructor(controllerOptions: OrmCrudProtectedForCurrentUserControllerOptions<E>) {
    super(controllerOptions);
    this._userRepo = controllerOptions.userRepository;
  }

  protected get userRepo() {
    return this._userRepo;
  }

  @Get()
  async getAll(@Req() req: Request, @CurrentUser() me: Auth, where?: FilterQuery<E>): Promise<E[]> {
    if (this.traceService.isTraceEnabled(Trace.OrmCrudController)) {
      this.traceService.verbose(this.logger, Trace.OrmCrudController, 'OrmCrudForCurrentUserControllerBase.getAll() - user:' + me.id);
    }

    // for current user
    const options: FindOptions<E> = <FindOptions<E>>this.optionsForCurrentUser(me);
    return super.crudGetAll(req, where, options);
  }

  @Get('/:id')
  async get(@Req() req: Request, @CurrentUser() me: Auth, @Param('id', ParseIntPipe) id: Primary<E>): Promise<E> {
    if (this.traceService.isTraceEnabled(Trace.OrmCrudController)) {
      this.traceService.verbose(this.logger, Trace.OrmCrudController, 'OrmCrudForCurrentUserControllerBase.get() - user:' + me.id);
    }
    // for current user
    const options: FindOneOptions<E> = <FindOneOptions<E>>this.optionsForCurrentUser(me);
    return this.crudGet(req, id, options);
  }

  @Post()
  async insert(@Req() req: Request, @CurrentUser() me: Auth, @Body() data: E): Promise<E> {
    if (this.traceService.isTraceEnabled(Trace.OrmCrudController)) {
      this.traceService.verbose(this.logger, Trace.OrmCrudController, 'OrmCrudForCurrentUserControllerBase.insertForCurrentUser() - user:' + me.id + ', data:' + data);
    }

    // current user is the owner
    this.saveAuthForEventEmitter(req, me);
    const u: User = this.userRepo.getReference(me.id);
    data.user = u;

    return super.crudInsert(req, data);
  }

  @Put('/:id')
  async update(@Req() req: Request, @CurrentUser() me: Auth, @Param('id', ParseIntPipe) id: Primary<E>, @Body() data: EntityData<E>): Promise<number | E> {
    if (this.traceService.isTraceEnabled(Trace.OrmCrudController)) {
      this.traceService.verbose(this.logger, Trace.OrmCrudController, 'OrmCrudForCurrentUserControllerBase.update() - user:' + me.id + ', data:' + data);
    }

    // current user is the owner
    this.saveAuthForEventEmitter(req, me);
    const options: UpdateOptions<E> = <UpdateOptions<E>>this.optionsForCurrentUser(me);

    return super.crudUpdate(req, id, data, options);
  }

  @Delete('/:id')
  async delete(@Req() req: Request, @CurrentUser() me: Auth, @Param('id', ParseIntPipe) id: Primary<E>): Promise<number> {
    // current user is the owner
    this.saveAuthForEventEmitter(req, me);
    const options: DeleteOptions<E> = <DeleteOptions<E>>this.optionsForCurrentUser(me);

    return super.crudDelete(req, id, options);
  }

  @Delete()
  async deleteAll(@Req() req: Request, @CurrentUser() me: Auth, where?: FilterQuery<E>): Promise<number> {
    // current user is the owner
    this.saveAuthForEventEmitter(req, me);
    const options: DeleteOptions<E> = <DeleteOptions<E>>this.optionsForCurrentUser(me);
    return this.repo.nativeDelete(this.repo.getEmptyFilterQuery(), options);
  }

  /**
   * Extending 'filters' property of ORM options with {@link OWNER_USER_FIELD_NAME} field.
   *
   * @param me
   * @param options
   * @protected
   */
  protected optionsForCurrentUser<O extends OrmCrudOptions<E>>(me: Auth): O {
    const options: OrmCrudOptions<E> = {
      filters: {},
    };

    // add new filter for the owner
    options.filters[OWNER_USER_FIELD_NAME] = { id: me.id };
    return options as O;
  }

  protected saveAuthForEventEmitter(req: Request, auth: Auth) {
    if (this.controllerOptions.featureEventEmitter) {
      FeatureEventEmitterForController.saveAuthForEventEmitter(req, auth);
    }
  }
}
