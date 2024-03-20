import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ORM_CRUD_CONTROLLER_OPERATION_CONTROL_KEY } from './crud-operation-control.decorator';
import { TraceService } from '../../../trace/trace.service';
import { Trace } from '@nestjs-orm/client';

export interface CrudOperations {
  get: boolean;
  getAll: boolean;
  insert: boolean;
  update: boolean;
  delete: boolean;
  deleteAll: boolean;
}

const OptimisticCrudOperationControlPolicy: CrudOperations = {
  get: true,
  getAll: true,
  insert: true,
  update: false,
  delete: true,
  deleteAll: true,
};

const PessimisticCrudOperationControlPolicy: CrudOperations = {
  get: false,
  getAll: false,
  insert: false,
  update: false,
  delete: false,
  deleteAll: false,
};

export const DEFAULT_ORM_CRUD_CONTROLLER_OPERATION_CONTROL_POLICY = PessimisticCrudOperationControlPolicy;
export const REQ_PARAM_ORM_CRUD_CONTROLLER_OPERATIONS = 'ReqParamOrmCrudControllerOperations';

/**
 * It's not a real guard. It just pushes @Features metadata to current request.
 */
@Injectable()
export class OrmCrudControllerOperationGuard implements CanActivate {
  private readonly logger = new Logger(OrmCrudControllerOperationGuard.name);

  constructor(
    private reflector: Reflector,
    private traceService: TraceService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const clazz = context.getClass();
    const features: CrudOperations = this.reflector.get<CrudOperations>(ORM_CRUD_CONTROLLER_OPERATION_CONTROL_KEY, clazz);
    if (this.traceService.isTraceEnabled(Trace.OrmCrudController)) {
      this.traceService.verbose(this.logger, Trace.OrmCrudController, `FEATURES[${clazz.name}]:`, features);
    }

    if (features) {
      const req = context.switchToHttp().getRequest();
      req[REQ_PARAM_ORM_CRUD_CONTROLLER_OPERATIONS] = features;
    }
    return true;
  }
}
