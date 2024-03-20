import { Entity, Enum, Property, Unique } from '@mikro-orm/core';
import { AppCfgRepository } from './app-cfg.repository';
import { OrmIntEntity } from '../../orm/entity';
import { ConfigType } from '@nestjs-orm/client';

@Entity({ customRepository: () => AppCfgRepository })
@Unique({ properties: ['configId'] })
export class AppCfg extends OrmIntEntity {
  @Property({ length: 128 })
  configId: string;

  @Enum(() => ConfigType)
  type: ConfigType;

  @Property({ length: 256 })
  value: string;
}
