import { TAG_TRACE_PREFIX } from './trace.model';

/**
 * CONFIGURATION VARIABLES (general):
 *  - configuration variables are ID-value pairs
 *  - variables have ID, value, type
 *  - supported types are here: {@link ConfigType}
 *  - configuration variables are managed by *ConfigService services
 *  - variables are persisted into database
 *  - a config service loads variables into cache from the database before provided
 *  - if a variable is changed config service persist it into the database
 *      - database only involved during initial loading and during persisting changes
 *      - if a variable is not persisted into database then it's populated with the default value
 *  - values are stored into database as strings, during loading string values converted into real type using {@link ConfigUtils.valueFromString()}
 *  - there are 2 types of configuration variables:
 *      - application variables
 *      - user variables
 *  - variable IDs are hardcoded in enums:
 *      - {@link AppConfigId}
 *      - {@link UserConfigId}
 *  - variables a configured in descriptor arrays:
 *      - {@link APP_CONFIG_VARIABLES}
 *      - {@link USER_CONFIG_VARIABLES}
 *  - all variable should be configured with a descriptor, if a variable is not configured, it cannot be used
 *  - to access values with real type use service.get<TYPE>(id) or set<TYPE>(id, value)
 *      - if you try to use a variable with invalid type you get an exception (e.g. getting/setting a number as string)
 *
 * Application and user level variables behave a little bit differently.
 *
 * APPLICATION CONFIGURATION VARIABLES
 * - application level variables are global, all user can access them for reading, but only admins can write them
 * - all application level variables are mandatory, so default values should be specified:
 *      - either as an .env entry
 *      - or a default value in the variable descriptor: {@link ConfigInfo.defaultValue}
 *  - caching:
 *      - map of variableID value pairs
 *      - all variables populated into the cache during the startup (from .env overridden by database)
 *
 * USER CONFIGURATION VARIABLES
 * - user level variables can be accessed (RW) only by the owner user
 *      - if you ask all variables from service you get only your own variables
 *      - in persistence entries contain reference to a user record and all DB operations filtered with the current user ID
 * - user level variables are optional, no default value should be specified ({@link ConfigInfo.defaultValue} is not used)
 * - cache for user variables has an extra leve
 * - caching:
 *      - map of user userID-map pairs where child map is a map of variableID-value pairs
 *      - variables loaded into cache from database per users - on-demand - during the first access
 */

/**
 * Supported configuration variable types
 */
export enum ConfigType {
  String = 'S',
  Number = 'N',
  Boolean = 'B',
  Date = 'D',
  Timestamp = 'T',
  Array = 'A',
  Object = 'O',
}

/**
 * Variable descriptor
 */
export interface ConfigInfo<ID> {
  configId: ID;
  type: ConfigType;
  defaultValue?: string;
  tag?: string;
}

export interface ConfigVariable<ID> extends ConfigInfo<ID> {
  value: any;
}

export type AppConfigInfo = ConfigInfo<AppConfigId>;
export type UserConfigInfo = ConfigInfo<UserConfigId>;
export type AppConfig = ConfigVariable<AppConfigId>;
export type UserConfig = ConfigVariable<UserConfigId>;

/**
 * IDs of application configuration variables.
 *
 * NOTE: It's mandatory to create a descriptor for a variable into {@link APP_CONFIG_VARIABLES}).
 */
export enum AppConfigId {
  // Trace enabled
  TraceAppConfig = 'TRACE_APP_CONFIG',
  TraceUserConfig = 'TRACE_USER_CONFIG',
  TraceAuth = 'TRACE_AUTH',
  TraceRolesGuard = 'TRACE_ROLES_GUARD',
  TraceOrmCrudController = 'TRACE_ORM_CRUD_CONTROLLER',
  TraceDevCounter = 'TRACE_DEV_COUNTER',
  TraceClientConnections = 'TRACE_CLIENT_CONNECTIONS',
  TraceWebSocket = 'TRACE_WEB_SOCKET',
  TraceEvents = 'TRACE_EVENTS',
  TraceBroadcast = 'TRACE_BROADCAST',

  // Trace data enabled
  TraceAppConfigData = 'TRACE_APP_CONFIG_DATA',
  TraceUserConfigData = 'TRACE_USER_CONFIG_DATA',
  TraceAuthData = 'TRACE_AUTH_DATA',
  TraceRolesGuardData = 'TRACE_ROLES_GUARD_DATA',
  TraceOrmCrudControllerData = 'TRACE_ORM_CRUD_CONTROLLER_DATA',
  TraceDevCounterData = 'TRACE_DEV_COUNTER_DATA',
  TraceClientConnectionsData = 'TRACE_CLIENT_CONNECTIONS_DATA',
  TraceWebSocketData = 'TRACE_WEB_SOCKET_DATA',
  TraceEventsData = 'TRACE_EVENTS_DATA',
  TraceBroadcastData = 'TRACE_BROADCAST_DATA',

  FilterForTracing = 'FILTER_FOR_TRACING',
  FilterForTracingIsRegex = 'FILTER_FOR_TRACING_IS_REGEX',

  // Development
  DevCounter = 'DEV_COUNTER',
  // Dummy (non-existing) to generate error
  DummyForError = 'DUMMY_FOR_ERROR',

  // Test
  TestVar = 'TEST_VAR',
  TestInvalidVar = 'TEST_INVALID_VAR', // don't add to descriptors
}

/**
 * Descriptors of application variables.
 *
 * MOTE: It's mandatory to create a descriptor for a variable here - not enough to add it to {@link AppConfigId} enum.
 */
export const APP_CONFIG_VARIABLES: AppConfigInfo[] = [
  // Trace
  { configId: AppConfigId.TraceAppConfig, type: ConfigType.Boolean, tag: TAG_TRACE_PREFIX + 'Config' },
  { configId: AppConfigId.TraceUserConfig, type: ConfigType.Boolean, tag: TAG_TRACE_PREFIX + 'Config' },
  { configId: AppConfigId.TraceAuth, type: ConfigType.Boolean },
  { configId: AppConfigId.TraceOrmCrudController, type: ConfigType.Boolean },
  { configId: AppConfigId.TraceDevCounter, type: ConfigType.Boolean },
  { configId: AppConfigId.TraceClientConnections, type: ConfigType.Boolean },
  { configId: AppConfigId.TraceWebSocket, type: ConfigType.Boolean },
  { configId: AppConfigId.TraceEvents, type: ConfigType.Boolean },
  { configId: AppConfigId.TraceBroadcast, type: ConfigType.Boolean },
  // Data for trace
  { configId: AppConfigId.TraceAppConfigData, type: ConfigType.Boolean },
  { configId: AppConfigId.TraceUserConfigData, type: ConfigType.Boolean },
  { configId: AppConfigId.TraceAuthData, type: ConfigType.Boolean },
  { configId: AppConfigId.TraceOrmCrudControllerData, type: ConfigType.Boolean },
  { configId: AppConfigId.TraceDevCounterData, type: ConfigType.Boolean },
  { configId: AppConfigId.TraceClientConnectionsData, type: ConfigType.Boolean },
  { configId: AppConfigId.TraceWebSocketData, type: ConfigType.Boolean },
  { configId: AppConfigId.TraceEventsData, type: ConfigType.Boolean },
  { configId: AppConfigId.TraceBroadcastData, type: ConfigType.Boolean },

  { configId: AppConfigId.FilterForTracing, type: ConfigType.String },
  { configId: AppConfigId.FilterForTracingIsRegex, type: ConfigType.Boolean },

  // Development
  { configId: AppConfigId.DevCounter, type: ConfigType.Boolean },

  // Test
  //{ configId: AppConfigId.TestVar, type: ConfigType.String },
  { configId: AppConfigId.TestVar, type: ConfigType.String, defaultValue: 'something' },
];

/**
 * IDs of user configuration variables.
 *
 * NOTE: It's mandatory to create a descriptor for a variable into {@link USER_CONFIG_VARIABLES}).
 */
export enum UserConfigId {
  // test
  TestStringForAdmin = 'TEST_STRING_FOR_ADMIN',
  TestStringForUser = 'TEST_STRING_FOR_USER',
  TestNumberForUser = 'TEST_NUMBER_FOR_USER',
  TestArrayForUser = 'TEST_ARRAY_FOR_USER',
  TestObjectForUser = 'TEST_OBJECT_FOR_USER',
  TestStringForGod = 'TEST_STRING_FOR_GOD',
  TestString = 'TEST_STRING',
}

/**
 * Descriptors of application variables.
 *
 * MOTE: It's mandatory to create a descriptor for a variable here - it's not enough to add it to {@link UserConfigId} enum.
 */
export const USER_CONFIG_VARIABLES: UserConfigInfo[] = [
  { configId: UserConfigId.TestStringForAdmin, type: ConfigType.String },
  { configId: UserConfigId.TestStringForUser, type: ConfigType.String },
  { configId: UserConfigId.TestNumberForUser, type: ConfigType.Number },
  { configId: UserConfigId.TestArrayForUser, type: ConfigType.Array },
  { configId: UserConfigId.TestObjectForUser, type: ConfigType.Object },
  { configId: UserConfigId.TestStringForGod, type: ConfigType.String },
  { configId: UserConfigId.TestString, type: ConfigType.String },
];

export type ConfigId = AppConfigId | UserConfigId;
export type ConfigVar = AppConfig | UserConfig;
