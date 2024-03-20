import { Entity, Enum, Filter, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { OrmIntEntity } from '../../orm/entity';
import { UserCfgRepository } from './user-cfg.repository';
import { User } from '../../orm/entity/user.entity';
import { ConfigType } from '@nestjs-orm/client';
import { OwnedByUserEntity, OWNER_USER_FIELD_NAME } from '../../orm/entity/owned-by-user.entity';

@Entity({ customRepository: () => UserCfgRepository })
@Unique({ properties: ['configId', 'user'] })
export class UserCfg extends OwnedByUserEntity {
  @Property({ length: 128 })
  configId: string;

  @Enum(() => ConfigType)
  type: ConfigType;

  @Property({ type: 'text' })
  value: string;

  constructor() {
    super();
  }
}
