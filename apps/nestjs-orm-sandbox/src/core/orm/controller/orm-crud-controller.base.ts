import { AnyEntity, DeleteOptions, EntityData, EntityManager, FilterQuery, FindOneOptions, FindOptions, Primary, UpdateOptions } from '@mikro-orm/core';
import { ControllerBase } from '../../controller/controller.base';
import { CrudEntityRepository } from '../crud/crud-entity-repository';
import { TraceService } from '../../trace/trace.service';
import { OrmCrudControllerOptions } from './orm-crud-controller-options';
import { Request } from 'express';
import { Trace } from '@nestjs-orm/client';

/**
 * This is an adapter/wrapper to call repository CRUD operations.
 *
 * If {@link controllerOptions.featureEventEmitter} has been specified, then application event will be emitted about data changes.
 *
 * Parameters for operations can be specified during initialization (in constructor as {@link OrmCrudControllerOptions}),
 * but it can be overridden during call.
 *
 * Features:
 *  - tracing ORM CRUD operations
 *  - emitting events about using {@link FeatureEventEmitterForController}
 */
export abstract class OrmCrudControllerBase<E extends AnyEntity<E>> extends ControllerBase {
  private _repo: CrudEntityRepository<E>;
  private _traceService: TraceService;
  protected controllerOptions: OrmCrudControllerOptions<E>;

  protected constructor(controllerOptions: OrmCrudControllerOptions<E>) {
    super();
    this._repo = controllerOptions.repository;
    this._traceService = controllerOptions.traceService;
    this.controllerOptions = controllerOptions;
  }

  protected get repo() {
    return this._repo;
  }

  protected get traceService() {
    return this._traceService;
  }

  protected async crudGetAll(req: Request, where?: FilterQuery<E>, options?: FindOptions<E>): Promise<E[]> {
    const opts: FindOptions<E> = { ...this.controllerOptions.getAllOptions, ...options };
    if (this.traceService.isTraceEnabled(Trace.OrmCrudController)) {
      this.traceService.verbose(this.logger, Trace.OrmCrudController, `${this.getClassName()}.getAll()`, { where, options: opts });
    }
    return this.repo.getAll(where, opts);
  }

  protected async crudGet(req: Request, id: Primary<E>, options?: FindOneOptions<E>): Promise<E> {
    const opts: FindOneOptions<E> = { ...this.controllerOptions.getOptions, ...options };
    if (this.traceService.isTraceEnabled(Trace.OrmCrudController)) {
      this.traceService.verbose(this.logger, Trace.OrmCrudController, `${this.getClassName()}.get(${id})`, { id, options: opts });
    }
    return this.repo.get(id, opts);
  }

  protected async crudInsert(req: Request, data: E): Promise<E> {
    if (this.traceService.isTraceEnabled(Trace.OrmCrudController)) {
      this.traceService.verbose(this.logger, Trace.OrmCrudController, `${this.getClassName()}OrmCrudControllerBase.insert()`, data);
    }

    // return sync for event emitter
    if (this.controllerOptions.featureEventEmitter) {
      const ret = await this.repo.insert(data);
      this.controllerOptions.featureEventEmitter.emitFeatureDataAdded(req, data);
      return ret;
    }
    // return async - no emitter
    return this.repo.insert(data);
  }

  /**
   * No options allowed if caching is active.
   *
   * @param req
   * @param id
   * @param data
   * @param options
   * @protected
   */
  protected async crudUpdate(req: Request, id: Primary<E>, data: EntityData<E>, options?: UpdateOptions<E>): Promise<number | E> {
    const opts: UpdateOptions<E> = { ...this.controllerOptions.updateOptions, ...options };
    if (this.traceService.isTraceEnabled(Trace.OrmCrudController)) {
      this.traceService.verbose(this.logger, Trace.OrmCrudController, `${this.getClassName()}.update(' + id + ')`, { id, data, options: opts });
    }
    delete data[this.repo.config.pkName];

    // return sync - for event emitter
    if (this.controllerOptions.featureEventEmitter) {
      const ret = await this.repo.update(id, data);
      this.controllerOptions.featureEventEmitter.emitFeatureDataChanged(req, ret);
      return ret;
    }
    // return async - no event emitter
    const where = this.repo.createFilterQueryForId(id);
    return this.repo.nativeUpdate(where, data, options);
  }

  protected async crudDelete(req: Request, id: Primary<E>, options?: DeleteOptions<E>): Promise<number> {
    const opts: DeleteOptions<E> = { ...this.controllerOptions.deleteOptions, ...options };
    if (this.traceService.isTraceEnabled(Trace.OrmCrudController)) {
      this.traceService.verbose(this.logger, Trace.OrmCrudController, `${this.getClassName()}.delete()`, { id, options: opts });
    }
    const where = this.repo.createFilterQueryForId(id);
    // return sync - for event emitter
    if (this.controllerOptions.featureEventEmitter) {
      const num = await this.repo.nativeDelete(where, options);
      if (num) {
        this.controllerOptions.featureEventEmitter.emitFeatureDataRemoved(req, id);
      }
      return num;
    }
    return this.repo.nativeDelete(where, options);
  }

  protected async crudDeleteAll(req: Request, where: FilterQuery<E>, options?: DeleteOptions<E>): Promise<number> {
    const opts: DeleteOptions<E> = { ...this.controllerOptions.deleteAllOptions, ...options };
    if (this.traceService.isTraceEnabled(Trace.OrmCrudController)) {
      this.traceService.verbose(this.logger, Trace.OrmCrudController, `${this.getClassName()}.deleteAll()`, { where, options: opts });
    }
    return this.repo.nativeDelete(where, opts);
  }
}
