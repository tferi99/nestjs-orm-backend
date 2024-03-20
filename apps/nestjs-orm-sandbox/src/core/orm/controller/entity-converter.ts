import { AnyEntity, EntityData } from '@mikro-orm/core';

export interface EntityConverter<D, E extends AnyEntity<E>> {
  toEntityData(data: D): EntityData<E>;
  fromEntity(entity: E): D;
}

export interface WithEntityConverter<D, E extends AnyEntity<E>> {
  getEntityConverter(): EntityConverter<D, E>;
}
