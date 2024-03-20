import { DynamicModule } from '@nestjs/common';
import { EventsModule } from '../core/events/events-module';
import { LoggingConfig } from './logging.config';
import { EventEmitterModuleOptions } from '@nestjs/event-emitter/dist/interfaces';

export const EMITTER_CONFIG: EventEmitterModuleOptions = {
  // https://docs.nestjs.com/techniques/events
  wildcard: true,
  delimiter: '.',
  newListener: false,
  removeListener: false,
  maxListeners: 10,
  verboseMemoryLeak: true,
  ignoreErrors: false,
};

/**
 * EventsModule should be registered only ONCE, otherwise application
 * might be frozen during startup!!!!!!!!!!!!!!!
 *
 * @constructor
 */
export const ConfiguredEventsModule = (): DynamicModule => {
  return EventsModule.forRoot(EMITTER_CONFIG, LoggingConfig.EVENTS);
};
