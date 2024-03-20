import { User } from './user.entity';
import { OrmIntTimestampEntity } from './index';
import { Filter, ManyToOne } from '@mikro-orm/core';

export const OWNER_USER_FIELD_NAME = 'owner';

@Filter({ name: OWNER_USER_FIELD_NAME, cond: (args) => ({ user: args.id }) })
export abstract class OwnedByUserEntity extends OrmIntTimestampEntity {
  //@ManyToOne({ entity: () => User, strategy: LoadStrategy.JOINED, onDelete: 'cascade' })
  @ManyToOne({ entity: () => User, onDelete: 'cascade' })
  user: User;
}
