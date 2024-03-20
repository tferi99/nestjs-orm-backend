/**
 * DB schehama creator application.
 * It loads configuration from .env .
 */

// loading .env
import { config } from 'dotenv';
config(); // it should be called after importing .env

import { ENTITIES } from './config/mikro-orm.config';
import { DatabaseSchemaCreator } from './core/orm/schema/database-schema-creator';

try {
  DatabaseSchemaCreator.create(ENTITIES, true);
} catch (e) {
  console.log('ERROR:', e);
}
