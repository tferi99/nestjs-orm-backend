import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { CompanyRepository } from './company.repository';

@Entity({ customRepository: () => CompanyRepository })
export class Company {
  @PrimaryKey()
  id!: number;

  @Property({ length: 64 })
  @Unique()
  name: string;

  @Property()
  location: string;

  @Property()
  active: boolean = true;
}
