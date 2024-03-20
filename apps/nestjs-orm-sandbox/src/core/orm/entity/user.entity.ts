import { Collection, Entity, OneToMany, Property, Unique } from '@mikro-orm/core';
import { OrmIntTimestampEntity } from './index';
import { UserRepository } from '../../../feature-modules/admin/user/user.repository';

@Entity({ tableName: 'app_user', customRepository: () => UserRepository })
export class User extends OrmIntTimestampEntity {
  @Property({ length: 64 })
  @Unique()
  name!: string;

  @Property({ length: 64 })
  password!: string;

  @Property()
  admin: boolean;

  @Property()
  user: boolean;

  @Property()
  active: boolean;

  constructor() {
    super();

    this.admin = false;
    this.user = false;
    this.active = true;
  }
}
