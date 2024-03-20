import { AppCfg } from './app-cfg.entity';
import { CrudEntityRepository } from '../../orm/crud/crud-entity-repository';

export class AppCfgRepository extends CrudEntityRepository<AppCfg> {}
