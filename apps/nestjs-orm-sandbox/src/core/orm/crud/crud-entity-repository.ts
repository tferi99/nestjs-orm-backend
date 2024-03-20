import { AnyEntity, EntityData, EntityName, EntityRepository, FilterQuery, FindOneOptions, FindOptions, Primary, RequiredEntityData } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/core/EntityManager';
import { OrmCrud } from './crud';

/**
 *
 *
 *
 *  Just saving old class - maybe can be refactored,
 *
 *
 *
 *
 */

export interface AssociatedParentEntity<C extends AnyEntity, P extends AnyEntity> {
  parentId: keyof C;
  parentEntity: EntityName<P>;
}

export interface AssociatedParentEntityExt<C extends AnyEntity, P extends AnyEntity> {
  parentIdName: string;
}

/**
 * Configuration to override default behavior of {@link EntityRepository}
 */
export interface CrudEntityRepositoryConfig<T extends AnyEntity<T>> {
  /**
   * Name of primary key.
   * NOTE: This property should be deleted if autoIncrement=true.
   */
  pkName: string;

  /**
   * Primary key of the database table is auto-incremented.
   */
  autoIncrement: boolean;

  /**
   * Parent keys: if these fields are not empty then parent entity should be associated during insert.
   */
  associatedParentEntities?: AssociatedParentEntity<T, any>[];
}

/**
 * This is an extended EntityRepository which provides compact CRUD operations.
 */
export abstract class CrudEntityRepository<E extends AnyEntity<E>> extends EntityRepository<E> implements OrmCrud<E> {
  //  private _crud: CrudImpl<E>;

  //-------------------------- CRUD --------------------------
  /**
   * @param where
   * @param options
   */
  async getAll(where?: FilterQuery<E>, options?: FindOptions<E>): Promise<E[]> {
    if (where) {
      return this.find(where, options);
    }
    return this.findAll(options);
  }

  async get(id: Primary<E>, options?: FindOneOptions<E>): Promise<E> {
    const where = this.createFilterQueryForId(id);
    return this.findOne(where, options);
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
    if (this.config.autoIncrement) {
      delete data[this.config.pkName];
    }

    // collecting parent associations and deleting foreign IDs from data
    const parentAssociations = {};
    if (this.config.associatedParentEntities) {
      this.config.associatedParentEntities.forEach((parent) => {
        const parentIdName = parent.parentId as string;
        if (data[parentIdName] !== undefined) {
          parentAssociations[parentIdName] = data[parentIdName]; // save parent id
          delete data[parentIdName]; // delete parent key from parent property
        }
      });
    }

    const obj = this.create(data);

    // adding collected associations to wrapped object
    Object.keys(parentAssociations).forEach((key) => {
      obj[key] = parentAssociations[key];
    });
    this.persist(obj);
    if (!this.em.isInTransaction()) {
      await this.flush();
    }
    return obj;
  }

  async update(id: Primary<E>, data: EntityData<E>): Promise<E> {
    delete data[this.config.pkName];
    const obj = await this.get(id);
    this.assign(obj, data);
    this.persist(obj);
    if (!this.em.isInTransaction()) {
      await this.flush();
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
    const ref = this.getReference(id);
    this.remove(ref);
    if (!this.em.isInTransaction()) {
      await this.flush();
    }
  }

  //-------------------------- etc --------------------------
  getEmptyFilterQuery(): FilterQuery<E> {
    return {} as FilterQuery<E>;
  }

  createFilterQueryForId(id: Primary<E>): FilterQuery<E> {
    const idName = this.config.pkName;
    const filter: FilterQuery<E> = this.getEmptyFilterQuery();
    filter[idName] = id;
    return filter;
  }

  /**
   * To describes crud behavior.
   * Override to change default behavior.
   *
   * By default:
   *  - PK name is: id
   *  - ID generated automatically in database (should be removed from input data)
   */
  get config(): CrudEntityRepositoryConfig<E> {
    return {
      pkName: 'id',
      autoIncrement: true,
    };
  }

  get em(): EntityManager {
    return this._em;
  }

  getClassName(): string {
    return (<any>this).constructor.name;
  }
}
