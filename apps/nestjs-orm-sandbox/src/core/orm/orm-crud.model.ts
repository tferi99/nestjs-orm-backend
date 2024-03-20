import { FilterQuery } from '@mikro-orm/core/typings';
import { AnyEntity, Primary } from '@mikro-orm/core';

export interface IdFilterFactory<E extends AnyEntity<E>> {
  createFilter(id: Primary<E>): FilterQuery<E>;
}

/*export interface GetAllOptions<E extends AnyEntity<E>> {
  where?: FilterQuery<E>;
  options?: FindOptions<E>;
}*/

/*export interface GetOptions<E extends AnyEntity<E>> {
  id: Primary<E>;
  options?: FindOptions<E>;
}*/

/*export interface DeleteAllOptions<E extends AnyEntity<E>> {
  where?: FilterQuery<E>;
  options?: DeleteOptions<E>;
}
*/
