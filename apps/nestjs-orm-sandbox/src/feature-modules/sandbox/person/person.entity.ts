import { Entity, Filter, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { PersonRepository } from './person.repository';
import { Company } from '../company/company.entity';
import { OwnedByUserEntity } from '../../../core/orm/entity/owned-by-user.entity';

@Entity({ customRepository: () => PersonRepository })
//@Filter({ name: OWNER_USER_FIELD_NAME, cond: (args) => ({ user: args.id }) })
@Filter({ name: 'active', cond: { active: true } })
export class Person extends OwnedByUserEntity {
  @Property({ length: 64 })
  @Unique()
  name: string;

  @Property()
  pin: string;

  @Property()
  active: boolean;

  @ManyToOne({ entity: () => Company, onDelete: 'cascade' })
  workingFor: Company;

  constructor() {
    super();
    this.active = true;
  }
}
