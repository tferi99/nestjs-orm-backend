import { AnyEntity, Primary } from '@mikro-orm/core';

/**
 * This cache has a collection which contains all entities,
 * and it has a very simple invalidation logic.
 * Only the whole collection can be invalidated in a single step.
 * Invalidating entities is not supported.
 */
export class SimpleEntityCache<T extends AnyEntity<T>> {
  private entities: Map<Primary<T>, T> = new Map<Primary<T>, T>();
  valid = false;

  load(items: T[]) {
    this.entities = new Map<Primary<T>, T>();
    items.forEach((i) => this.entities.set(i['id'], i));
    this.valid = true;
  }

  get(id: Primary<T>): T {
    if (!this.valid) {
      throw new Error('Cache is invalid, load entities first.');
    }
    return this.entities.get(id);
  }

  getAll(): T[] {
    if (!this.valid) {
      throw new Error('Cache is invalid, load entities first.');
    }
    return Array.from(this.entities.values());
  }

  get invalid(): boolean {
    return !this.valid;
  }
}
