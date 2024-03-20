import { AnyEntity, DeleteOptions, EntityManager, FindOneOptions, FindOptions, Primary, UpdateOptions } from '@mikro-orm/core';
import { CrudEntityRepository } from '../crud/crud-entity-repository';
import { TraceService } from '../../trace/trace.service';
import { UserRepository } from '../../../feature-modules/admin/user/user.repository';
import { FeatureEventEmitterForController } from '../../features/feature-event-emitter-for-controller';

export type OrmCrudOptions<E extends AnyEntity<E>> = FindOptions<E> | FindOneOptions<E> | UpdateOptions<E> | DeleteOptions<E>;

export interface OrmCrudControllerOptions<E extends AnyEntity<E>> {
  repository: CrudEntityRepository<E>;
  traceService: TraceService;
  updateWithFetch?: boolean;
  featureEventEmitter?: FeatureEventEmitterForController<E, Primary<E>>;

  // default parameters for CRUD operations
  getAllOptions?: FindOptions<E>;
  getOptions?: FindOneOptions<E>;
  updateOptions?: UpdateOptions<E>;
  deleteOptions?: DeleteOptions<E>;
  deleteAllOptions?: DeleteOptions<E>;
}

export interface OrmCrudProtectedControllerOptions<E extends AnyEntity<E>> extends OrmCrudControllerOptions<E> {
  convertSensitiveData?: boolean;
}

export interface OrmCrudProtectedForCurrentUserControllerOptions<E extends AnyEntity<E>> extends OrmCrudProtectedControllerOptions<E> {
  userRepository: UserRepository;
}
