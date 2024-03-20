import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { AuthorizedRoles } from '../feature-data-provider-locator.service';
import { AppConfigId, Auth, Feature, Trace } from '@nestjs-orm/client';
import { TraceService } from '../../../core/trace/trace.service';
import { ClientConnectionService } from '../../client-connection.service';
import { AppConfigService } from '../../../core/config/app-config/app-config.service';
import { COUNTER_INTERVAL } from '../../../config/scheduler.config';
import { INIT_LOG_PREFIX } from '../../../init/init.service';
import { FeatureDataProviderBase } from '../../../core/features/feature-data-provider';
import { EventsApiService } from '../../../core/events/events-api/events-api.service';

@Injectable()
export class CounterService extends FeatureDataProviderBase<number, number> {
  private readonly logger = new Logger(CounterService.name);
  private counter = 0;

  constructor(
    @Inject(forwardRef(() => ClientConnectionService)) clientConnectionService: ClientConnectionService,
    @Inject(forwardRef(() => AppConfigService)) private appConfigService: AppConfigService,
    @Inject(forwardRef(() => TraceService)) private traceService: TraceService,
    eventsApiService: EventsApiService,
  ) {
    super(Feature.Counter, clientConnectionService, eventsApiService);
  }

  init() {
    this.logger.log(INIT_LOG_PREFIX + this.constructor.name + ' initializing...');
    this.logger.log(INIT_LOG_PREFIX + this.constructor.name + ' initialized');
  }

  @Interval('counterInterval', COUNTER_INTERVAL)
  count(): void {
    if (!this.appConfigService.getBoolean(AppConfigId.DevCounter)) {
      return;
    }

    this.counter++;
    // here we add counter value twice for testing purposes: into message and as data, too
    if (this.traceService.isTraceEnabled(Trace.DevCounter)) {
      this.traceService.verbose(this.logger, Trace.DevCounter, 'Counter changed: ' + this.counter, this.counter);
    }
    this.notifyDataChanged(this.counter);
  }

  setCounter(value: number) {
    this.counter = value;
  }

  async getInitialFeatureData(user: Auth): Promise<number[]> {
    const data: number[] = [];
    data.push(this.counter);
    return data;
  }

  getAuthorizedRoles(): AuthorizedRoles {
    return 'AnyRole';
  }
}
