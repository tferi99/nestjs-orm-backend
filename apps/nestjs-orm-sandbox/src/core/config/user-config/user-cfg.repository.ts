import { UserCfg } from './user-cfg.entity';
import { CrudEntityRepository, CrudEntityRepositoryConfig } from '../../orm/crud/crud-entity-repository';
import { User } from '../../orm/entity/user.entity';

export class UserCfgRepository extends CrudEntityRepository<UserCfg> {
  get config(): CrudEntityRepositoryConfig<UserCfg> {
    const defaultConfig = super.config;
    return {
      ...defaultConfig,
      associatedParentEntities: [{ parentId: 'user', parentEntity: User }],
    };
  }
}
