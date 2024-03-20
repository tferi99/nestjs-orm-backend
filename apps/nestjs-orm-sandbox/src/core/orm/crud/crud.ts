import { AnyEntity, DeleteOptions, EntityData, EntityManager, FilterQuery, FindOneOptions, FindOptions, Primary, RequiredEntityData, UpdateOptions } from '@mikro-orm/core';
import { CrudEntityRepository } from './crud-entity-repository';

export interface OrmCrud<E extends AnyEntity<E>> {
  insert(data: RequiredEntityData<E>): Promise<E>;
  getAll(): Promise<E[]>;
  get(id: Primary<E>): Promise<E>;
  update(id: Primary<E>, data: EntityData<E>): Promise<E>;
  delete(id: Primary<E>): Promise<void>;
  nativeDelete(where: FilterQuery<E>, options?: DeleteOptions<E>): Promise<number>;
  nativeUpdate(where: FilterQuery<E>, data: EntityData<E>, options?: UpdateOptions<E>): Promise<number>;
}

/**
 * CRUD operations for repositories:
 *  {@link get}, {@link getAll}, {@link insert}, {@link insertForParent}, {@link update}, {@link delete}
 *  {@link nativeUpdate}, {@link nativeDelete}
 */
export class CrudImpl<E extends AnyEntity<E>> {
  //implements OrmCrud<E> {
  constructor(
    private em: EntityManager,
    private repo: CrudEntityRepository<E>,
  ) {}

  /**
   * @param where
   * @param options
   */
  async getAll(where?: FilterQuery<E>, options?: FindOptions<E>): Promise<E[]> {
    if (where) {
      return this.repo.find(where, options);
    }
    return this.repo.findAll(options);
  }

  /**
   * To get a single entity by ID.
   *
   * @param id
   * @param options
   */
  async get(id: Primary<E>, options?: FindOneOptions<E>): Promise<E> {
    const where = this.repo.createFilterQueryForId(id);
    return this.repo.findOne(where, options);
  }

  /**
   * Data can contain associated parents, but it can be a parent ID.
   * If parents are described in CrudEntityRepositoryConfig these ID will
   * be replaced with entity references.
   *
   * @param data
   */
  async insert(data: RequiredEntityData<E>): Promise<E> {
    // remove ID from data if primary key generated with auto-increment
    if (this.repo.config.autoIncrement) {
      delete data[this.repo.config.pkName];
    }

    // collecting parent associations and deleting foreign IDs from data
    const parentAssociations = {};
    if (this.repo.config.associatedParentEntities) {
      this.repo.config.associatedParentEntities.forEach((parent) => {
        const parentIdName = parent.parentId as string;
        if (data[parentIdName] !== undefined) {
          parentAssociations[parentIdName] = data[parentIdName]; // save parent id
          delete data[parentIdName]; // delete parent key from parent property
        }
      });
    }

    const obj = this.repo.create(data);

    // adding collected associations to wrapped object
    Object.keys(parentAssociations).forEach((key) => {
      obj[key] = parentAssociations[key];
    });
    this.repo.persist(obj);
    if (!this.em.isInTransaction()) {
      await this.repo.flush();
    }
    return obj;
  }

  async insertForParent(data: RequiredEntityData<E>, parentKey: keyof E, parent: any): Promise<E> {
    if (this.repo.config.autoIncrement) {
      delete data[this.repo.config.pkName];
    }

    const obj = this.repo.create(data);
    obj[parentKey] = parent;
    this.repo.persist(obj);
    if (!this.em.isInTransaction()) {
      await this.repo.flush();
    }
    return obj;
  }

  async update(id: Primary<E>, data: EntityData<E>): Promise<E> {
    delete data[this.repo.config.pkName];
    const obj = await this.get(id);
    this.repo.assign(obj, data);
    this.repo.persist(obj);
    if (!this.em.isInTransaction()) {
      await this.repo.flush();
    }
    return obj;

    // without fetch
    /*
    delete data[this.repo.config.pkName];
    const ref = this.repo.getReference(id);
    await this.repo.assign(ref, data);
    await this.repo.persist(ref);
    if (!this.em.isInTransaction()) {
      await this.repo.flush();
    }
    return ref;*/
  }

  async delete(id: Primary<E>): Promise<void> {
    const ref = this.repo.getReference(id);
    this.repo.remove(ref);
    if (!this.em.isInTransaction()) {
      await this.repo.flush();
    }
  }
}
