import { CrudEntityRepository, CrudEntityRepositoryConfig } from '../../../core/orm/crud/crud-entity-repository';
import { Company } from './company.entity';

export class CompanyRepository extends CrudEntityRepository<Company> {
  /*  get config(): CrudEntityRepositoryConfig<Company> {
    const defaultConfig = super.config;
    return {
      ...defaultConfig,
      caching: true,
    };
  }*/
}
