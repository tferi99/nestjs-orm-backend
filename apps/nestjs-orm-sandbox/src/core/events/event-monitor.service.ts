import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { OnEvent } from '@nestjs/event-emitter';
import { ApplicationEvent } from './events.model';
import { INIT_LOG_PREFIX } from '../../init/init.service';

export const EVENT_MONITOR_CONFIG_OPTIONS = 'EVENT_MONITOR_CONFIG_OPTIONS';

/**
 * This service monitors event traffic and logs sends all events into log.
 *
 * Configuration is provided by token:  EVENT_MONITOR_CONFIG_OPTIONS (WinstonModuleOptions) .
 *
 * For example specifying LoggingConfig.EVENTS as configuration:
 *
 *  providers: [
 *    {
 *      provide: EVENT_MONITOR_CONFIG_OPTIONS,
 *      useValue: LoggingConfig.EVENTS,
 *    },
 *    EventMonitorService,
 *  ]
 */
@Injectable()
export class EventMonitorService {
  private readonly logger = new Logger(EventMonitorService.name);

  private eventMonitorLogger: LoggerService;

  constructor(@Inject(EVENT_MONITOR_CONFIG_OPTIONS) private options) {
    this.eventMonitorLogger = WinstonModule.createLogger(options);
    this.logger.log(INIT_LOG_PREFIX + 'Event Monitor Logger initialized');
  }

  @OnEvent('**')
  handleAllEvents(event: ApplicationEvent<any>) {
    this.eventMonitorLogger.verbose(JSON.stringify(event));
  }
}
