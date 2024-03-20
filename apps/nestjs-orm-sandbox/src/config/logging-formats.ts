import * as winston from 'winston';
import safeStringify from 'fast-safe-stringify';
import * as moment from 'moment';
import { StringUtils } from '@nestjs-orm/client';

//console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! logging-formats.ts !!!!!!!!!!!!!!!!!!!!!!!!!!!!!! - winston.format: ' + winston.format);

/**
 * Byte length of longest level name.
 */
const LEVEL_MAX_LEN = ' '.repeat(StringUtils.getCharacterLength('verbose')).length;

/**
 * Factory to create console logging format.
 *
 * @param appName
 * @constructor
 */
const ConsoleLoggingFormat = winston.format.printf(({ context, level, timestamp, message, ms, ...meta }) => {
  //if ('undefined' !== typeof timestamp) {
  timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  //}
  const fillLen = 20 - level.length;
  //console.log(`### ${level} ${level.length} -> ${fillLen}`);
  const fixLenlevel = (level.charAt(0).toUpperCase() + level.slice(1)).padEnd(17);
  return ('undefined' !== typeof timestamp ? `${timestamp}` : '') + '|' + fixLenlevel + '|' + ('undefined' !== typeof context ? `${context}` : '') + '|' + message + '|' + safeStringify(meta);
});

/**
 * Factory to create file logging format.
 *
 * @param appName
 * @constructor
 */
export const FileLoggingFormat = winston.format.printf(({ level, message, label, timestamp }) => {
  timestamp = moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
  const fixLenlevel = (level.charAt(0).toUpperCase() + level.slice(1)).padEnd(LEVEL_MAX_LEN);
  return `${timestamp}|${fixLenlevel}|${message}`;
});

export const LogginFormats = {
  CONSOLE: ConsoleLoggingFormat,
  FILE: FileLoggingFormat,
};
