import { AnyEntity, DeleteOptions, EntityData, FilterQuery, FindOneOptions, FindOptions, Primary, UpdateOptions } from '@mikro-orm/core';
import { OrmCrudControllerBase } from './orm-crud-controller.base';
import { OrmCrudProtectedControllerOptions } from './orm-crud-controller-options';
import { CrudOperations, REQ_PARAM_ORM_CRUD_CONTROLLER_OPERATIONS } from './crud-operation-guard/orm-crud-controller-operation.guard';
import { NotImplementedException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { EnvUtils } from '../../util/env-utils';

/**
 * It adds authorization + hiding/converting sensitive data to {@link OrmCrudControllerBase}.
 */
export abstract class OrmCrudProtectedControllerBase<E extends AnyEntity<E>> extends OrmCrudControllerBase<E> {
  protected controllerOptions: OrmCrudProtectedControllerOptions<E>;

  protected constructor(controllerOptions: OrmCrudProtectedControllerOptions<E>) {
    super(controllerOptions);
    this.controllerOptions = controllerOptions;
    if (EnvUtils.getBooleanValue('INACTIVATE_SENSITIVE_HIDE', false)) {
      this.controllerOptions.convertSensitiveData = false;
    }
  }

  protected async crudGetAll(req: Request, where?: FilterQuery<E>, options?: FindOptions<E>): Promise<E[]> {
    this.checkEnabledFeature(req, 'getAll');

    if (this.controllerOptions.convertSensitiveData) {
      const ret: E[] = await super.crudGetAll(req, where, options);
      return ret.map((d) => this.convertSensitiveData(d));
    }
    return super.crudGetAll(req, where, options);
  }

  protected async crudGet(req: Request, id: Primary<E>, options?: FindOneOptions<E>): Promise<E> {
    this.checkEnabledFeature(req, 'get');

    if (this.controllerOptions.convertSensitiveData) {
      const ret: E = await super.crudGet(req, id, options);
      return ret ? this.convertSensitiveData(ret) : ret;
    } else {
      return super.crudGet(req, id, options);
    }
  }

  protected async crudInsert(req: Request, data: E): Promise<E> {
    this.checkEnabledFeature(req, 'insert');

    if (this.controllerOptions.convertSensitiveData) {
      const obj = await super.crudInsert(req, data);
      return obj ? this.convertSensitiveData(obj) : obj;
    }
    return super.crudInsert(req, data);
  }

  protected async crudUpdate(req: Request, id: Primary<E>, data: EntityData<E>, options?: UpdateOptions<E>): Promise<number | E> {
    this.checkEnabledFeature(req, 'update');
    return super.crudUpdate(req, id, data, options);
  }

  protected async crudDelete(req: Request, id: Primary<E>, options?: DeleteOptions<E>): Promise<number> {
    this.checkEnabledFeature(req, 'delete');
    return super.crudDelete(req, id, options);
  }

  protected async crudDeleteAll(req: Request, where: FilterQuery<E>, options?: DeleteOptions<E>): Promise<number> {
    this.checkEnabledFeature(req, 'deleteAll');
    return super.crudDeleteAll(req, where, options);
  }

  /**
   * Authorize feature-modules.
   *
   * @param req
   * @param feature
   * @private
   */
  private checkEnabledFeature(req: any, feature: keyof CrudOperations): void {
    const features: CrudOperations = req[REQ_PARAM_ORM_CRUD_CONTROLLER_OPERATIONS];
    if (!features) {
      throw new NotImplementedException('@Feature not configured for feature: ' + feature);
    }
    if (!features[feature]) {
      throw new UnauthorizedException(feature + ' : this feature not enabled for this controller with @Features');
    }
  }

  /**
   * Set OrmCrudControllerOptions.convertSensitiveData to 'true' and
   * override this base method if you want to hide sensitive data from clients.
   *
   * @param orig
   * @protected
   */
  protected convertSensitiveData(orig: E): E {
    throw new Error('Override convertSensitiveData()');
  }
}
