import { CrudEntityRepository } from '../../../core/orm/crud/crud-entity-repository';
import { Person } from './person.entity';

export class PersonRepository extends CrudEntityRepository<Person> {}
