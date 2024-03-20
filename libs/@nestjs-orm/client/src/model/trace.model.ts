/**
 * Traced feature-modules.
 */
export enum Trace {
  AppConfig = 'TRACE_APP_CONFIG',
  UserConfig = 'TRACE_USER_CONFIG',
  Auth = 'TRACE_AUTH',
  OrmCrudController = 'TRACE_ORM_CRUD_CONTROLLER',
  DevCounter = 'TRACE_DEV_COUNTER',
  ClientConnections = 'TRACE_CLIENT_CONNECTIONS',
  WebSocket = 'TRACE_WEB_SOCKET',
  Events = 'TRACE_EVENTS',
  Broadcast = 'TRACE_BROADCAST',
}

export const TAG_TRACE_PREFIX = 'Trace;';
