import { WinstonModuleOptions } from 'nest-winston/dist/winston.interfaces';
import * as winston from 'winston';
import { LogginFormats } from './logging-formats';
import { EnvUtils } from '../core/util/env-utils';

export const LOG_DIR = 'logs';

// log files
const LOG_APP = 'app.log';
const LOG_REJECTIONS = 'rejections.log';
const LOG_ERRORS = 'errors.log';
const LOG_EVENTS = 'events.log';
const LOG_DEV = 'dev.log';

/**
 * Logging levels:
 *  - info      : show main operations/steps
 *  - verbose   : show developer information (events, feature trace, WS messages)
 *  - debug     : very detailed developer information (e.g. payload of WS messages)
 *
 *  Default level is 'verbose' during development which can be extended to 'debug' if we need very detailed information.
 */
/**
 *  Documentation: https://github.com/winstonjs/winston
 *
 *  Normally Winston can handle unhandled exceptions and rejections
 *  but in this application this solution cannot work and application crashes.
 *  That't the reason why I handle+log rejections in main.ts manually.
 */
const mainLoggerConfig: WinstonModuleOptions = {
  /*  handleExceptions: true,
//  handleRejections: true,
  // logging for unhandled exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: LOG_DIR + '/' + LOG_EXCEPTIONS,
      level: 'error',
      format: winston.format.combine(winston.format.uncolorize({ message: true }), LogginFormats.FILE),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: LOG_DIR + '/' + LOG_REJECTIONS,
      level: 'error',
      format: winston.format.combine(winston.format.uncolorize({ message: true }), LogginFormats.FILE),
    }),
  ],*/

  transports: [
    // logging all here
    new winston.transports.File({
      level: EnvUtils.getValue('LOG_LEVEL_FILE_APP'),
      filename: LOG_DIR + '/' + LOG_APP,
      format: winston.format.combine(winston.format.uncolorize({ message: true }), LogginFormats.FILE), // format is factory
    }),
    // logging only errors here
    new winston.transports.File({
      level: EnvUtils.getValue('LOG_LEVEL_FILE_ERROR'),
      filename: LOG_DIR + '/' + LOG_ERRORS,
      //      format: winston.format.combine(winston.format.timestamp(), winston.format.ms(), winston.format.ms(), LogginFormats.FILE),
      format: winston.format.combine(winston.format.uncolorize({ message: true }), LogginFormats.FILE),
      //format: winston.format.combine(winston.format.uncolorize({ message: true }), LogginFormats.FILE),
    }),
    new winston.transports.Console({
      level: EnvUtils.getValue('LOG_LEVEL_CONSOLE'),
      silent: EnvUtils.isProduction(),
      format: winston.format.combine(winston.format.colorize({ all: true }), LogginFormats.CONSOLE), // factory
      //format: winston.format.combine(winston.format.timestamp(), winston.format.ms(), winston.format.colorize(), winston.format.ms(), LOG_FORMAT_CONSOLE),
      //format: winston.format.combine(winston.format.timestamp(), winston.format.ms(), nestWinstonModuleUtilities.format.nestLike('MyApp', { prettyPrint: false })),
    }),
  ],
};

const eventsLoggerConfig: WinstonModuleOptions = {
  handleExceptions: false,
  handleRejections: false,
  transports: [
    new winston.transports.File({
      level: EnvUtils.getValue('LOG_LEVEL_FILE_EVENTS'),
      filename: LOG_DIR + '/' + LOG_EVENTS,
      format: winston.format.combine(winston.format.uncolorize({ message: true }), LogginFormats.FILE),
    }),
  ],
};

const rejectionsLoggerConfig: WinstonModuleOptions = {
  handleExceptions: false,
  handleRejections: false,
  transports: [
    new winston.transports.File({
      level: EnvUtils.getValue('LOG_LEVEL_FILE_REJECTIONS'),
      filename: LOG_DIR + '/' + LOG_REJECTIONS,
      format: winston.format.combine(winston.format.uncolorize({ message: true }), LogginFormats.FILE),
    }),
  ],
};

const devLoggerConfig: WinstonModuleOptions = {
  handleExceptions: false,
  handleRejections: false,
  transports: [
    /*    new winston.transports.File({
      level: EnvUtils.getValue('LOG_LEVEL_FILE_DEV'),
      filename: LOG_DIR + '/' + LOG_DEV,
      format: winston.format.combine(winston.format.uncolorize({ message: true }), LogginFormats.FILE),
    }),*/
    new winston.transports.Console({
      level: EnvUtils.getValue('LOG_LEVEL_CONSOLE'),
      silent: EnvUtils.isProduction(),
      format: winston.format.combine(winston.format.colorize({ all: true }), LogginFormats.CONSOLE), // factory
    }),
  ],
};

export const LoggingConfig = {
  MAIN: mainLoggerConfig,
  EVENTS: eventsLoggerConfig,
  REJECTIONS: rejectionsLoggerConfig,
  DEV: devLoggerConfig,
};
