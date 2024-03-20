import { DynamicModule, Logger, Module } from '@nestjs/common';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { OrmUtilController } from './util/orm-util.controller';
import { OrmUtilsService } from './util/orm-utils.service';
import { AnyEntity, EntityName } from '@mikro-orm/core';
import { BASE_ENTITIES } from './entity/base-entities';

const logger = new Logger('MikroORM');

/**
 * DYNAMIC MODULE!
 *
 * Don't import EventsModule directly, use forRoot()
 * or preferred way is calling ConfiguredOrmModule() instead.
 */
@Module({})
export class OrmModule {
  static forRoot(mikroOrmModuleSyncOptions: MikroOrmModuleSyncOptions, entities: EntityName<AnyEntity<any>>[]): DynamicModule {
    mikroOrmModuleSyncOptions.autoLoadEntities = false;
    mikroOrmModuleSyncOptions.entities = [...BASE_ENTITIES, ...entities];

    return {
      module: OrmModule,
      imports: [MikroOrmModule.forRoot(mikroOrmModuleSyncOptions), MikroOrmModule.forFeature({ entities })],
      providers: [OrmUtilsService],
      controllers: [OrmUtilController],
      exports: [MikroOrmModule, OrmUtilsService],
    };
  }
}
