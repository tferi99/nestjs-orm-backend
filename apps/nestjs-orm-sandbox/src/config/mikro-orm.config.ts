import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs/typings';
import { AnyEntity, EntityName, LoadStrategy, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { logger } from '@mikro-orm/nestjs';
import { DynamicModule } from '@nestjs/common';
import { User } from '../core/orm/entity/user.entity';
import { OrmModule } from '../core/orm/orm.module';
import { UserCfg } from '../core/config/user-config/user-cfg.entity';
import { Person } from '../feature-modules/sandbox/person/person.entity';
import { EnvUtils } from '../core/util/env-utils';
import { AppCfg } from '../core/config/app-config/app-cfg.entity';
import { Company } from '../feature-modules/sandbox/company/company.entity';

export const ENTITIES: EntityName<AnyEntity<any>>[] = [User, UserCfg, AppCfg, Person, Company];

export const GET_MIKRO_ORM_OPTIONS = (): MikroOrmModuleSyncOptions => {
  const dbUser = EnvUtils.getValue('DATABASE_USER');
  if (!dbUser) {
    throw new Error('No DATABASE_USER specified in .env or .env not found');
  }
  // console.log('Database user: ', dbUser);
  return {
    // registerRequestContext: false,       // by default enabled
    type: 'postgresql',
    dbName: 'nestjsormsandbox',
    user: dbUser,
    password: EnvUtils.getValue('DATABASE_PASSWORD'),

    //  metadataProvider: TsMorphMetadataProvider,
    namingStrategy: UnderscoreNamingStrategy,
    highlighter: new SqlHighlighter(),
    debug: EnvUtils.getBooleanValue('DATABASE_DEBUG_SQL'),
    logger: logger.log.bind(logger),
    loadStrategy: LoadStrategy.JOINED,
    discovery: {
      disableDynamicFileAccess: true, // required for Webpack - it forces ReflectMetadataProvider!
    },
    /**
     * From https://github.com/etienne-bechara/nestjs-orm
     * see more https://mikro-orm.io/docs/usage-with-nestjs/#using-asynclocalstorage-for-request-context
     */
    //context: (): EntityManager => ContextStorage.getStore()?.get(OrmStoreKey.ENTITY_MANAGER),
    //loadStrategy: LoadStrategy.JOINED
  };
};

/**
 * It's just a shortcut to avoid copy-paste.
 */
export const ConfiguredOrmModule = (): DynamicModule => {
  return OrmModule.forRoot(GET_MIKRO_ORM_OPTIONS(), ENTITIES);
};
