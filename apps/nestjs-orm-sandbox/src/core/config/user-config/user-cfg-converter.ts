import { EntityConverter } from '../../orm/controller/entity-converter';
import { UserCfg } from './user-cfg.entity';
import { EntityData } from '@mikro-orm/core';
import { UserConfig, UserConfigId } from '@nestjs-orm/client';

export class UserCfgConverter implements EntityConverter<UserConfig, UserCfg> {
  fromEntity(entity: UserCfg): UserConfig {
    const cfgId = entity.configId;
    if (Object.values(UserConfigId).indexOf(cfgId as UserConfigId) < 0) {
      throw new Error(`[${cfgId}] : invalid UserConfigId`);
    }
    const configId: UserConfigId = cfgId as UserConfigId;
    return entity ? { configId, type: entity.type, value: entity.value } : undefined;
  }

  toEntityData(data: UserConfig): EntityData<UserCfg> {
    return data ? { configId: String(data.configId), type: data.type, value: data.value } : undefined;
  }
}
