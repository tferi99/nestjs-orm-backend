import { SetMetadata } from '@nestjs/common';
import { DEFAULT_ORM_CRUD_CONTROLLER_OPERATION_CONTROL_POLICY, CrudOperations } from './orm-crud-controller-operation.guard';

export const ORM_CRUD_CONTROLLER_OPERATION_CONTROL_KEY = 'crud-operation-control';
export const CrudOperationControl = (operations: Partial<CrudOperations>) =>
  SetMetadata(ORM_CRUD_CONTROLLER_OPERATION_CONTROL_KEY, { ...DEFAULT_ORM_CRUD_CONTROLLER_OPERATION_CONTROL_POLICY, ...operations });
