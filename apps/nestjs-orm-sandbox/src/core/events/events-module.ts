import { DynamicModule, Module } from '@nestjs/common';
import { WinstonModuleOptions } from 'nest-winston/dist/winston.interfaces';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { EVENT_MONITOR_CONFIG_OPTIONS, EventMonitorService } from './event-monitor.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventEmitterModuleOptions } from '@nestjs/event-emitter/dist/interfaces';
import { TraceModule } from '../trace/trace.module';

/**
 * It's a dynamic module wraps NestJS EventEmitterModule in configurable way.
 *
 * It's DYNAMIC MODULE:
 *    Don't import EventsModule directly, use forRoot()
 *    or preferred way is calling ConfiguredEventsModule() instead.
 *
 *          !!!!!!! SHOULD BE REGISTERED ONLY ONCE !!!!!!!
 *
 * Client objects (who emit/listen events) should import {@link EventClientModule}.
 */
@Module({})
export class EventsModule {
  static forRoot(config: EventEmitterModuleOptions, eventMonitorLoggerConfig?: WinstonModuleOptions): DynamicModule {
    const dynamicProviders: Provider[] = [];

    // if logger configured, event monitor also will be provided
    if (eventMonitorLoggerConfig) {
      dynamicProviders.push({
        provide: EVENT_MONITOR_CONFIG_OPTIONS,
        useValue: eventMonitorLoggerConfig,
      });
      dynamicProviders.push(EventMonitorService);
    }

    return {
      module: EventsModule,
      imports: [EventEmitterModule.forRoot(config), TraceModule],
      providers: [...dynamicProviders],
    };
  }
}
