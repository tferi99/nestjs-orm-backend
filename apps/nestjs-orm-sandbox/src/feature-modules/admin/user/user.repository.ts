import { User } from '../../../core/orm/entity/user.entity';
import { CrudEntityRepository } from '../../../core/orm/crud/crud-entity-repository';
import { EntityData, FilterQuery, RequiredEntityData, UpdateOptions } from '@mikro-orm/core';
import { SecurityUtils } from '../../../core/util/security-utils';

/**
 * Repository with CRUD operations and caching.
 */
export class UserRepository extends CrudEntityRepository<User> {
  override async insert(user: RequiredEntityData<User>): Promise<User> {
    user.password = SecurityUtils.hashStringSync(user.password);
    return super.insert(user);
  }

  override async nativeUpdate(where: FilterQuery<User>, user: EntityData<User>, options?: UpdateOptions<User>): Promise<number> {
    if (!user.password || user.password === '') {
      delete user.password;
    } else {
      //user.password = await SecurityUtils.hashString(user.password);
      user.password = SecurityUtils.hashStringSync(user.password);
    }
    return super.nativeUpdate(where, user);
  }

  async getByName(name: string): Promise<User> {
    const all = await super.getAll();
    return all.find((u) => u.name === name);
  }
  /*  async insertWithPwdEncrypt(user: EntityData<User>) {
    user.password = await SecurityUtils.hashString(user.password);
    return this.crud.insert(user);
  }

  async updateWithPwdEncrypt(id: number, user: Partial<User>) {
    //console.log('updateWithPwdEncrypt[' + id + ']: ', user);
    if (!user.password || user.password === '') {
      delete user.password;
    } else {
      user.password = await SecurityUtils.hashString(user.password);
    }
    return this.crud.update({ id }, user);
  }*/
}
