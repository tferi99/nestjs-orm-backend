import { Injectable, LoggerService, Query } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { LoggingConfig } from '../../config/logging.config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { UserRepository } from '../admin/user/user.repository';
import { ScedulersInfo } from './dev.controller';
import { NoAuth } from '../../auth/passport/no-auth.decorator';
import { EventsApiService } from '../../core/events/events-api/events-api.service';
import { CrudEntityRepository } from '../../core/orm/crud/crud-entity-repository';

@Injectable()
export class AppManagementService {
  logger: LoggerService;
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    // repos
    private userRepository: UserRepository,
    private eventsApiService: EventsApiService,
  ) {
    this.logger = WinstonModule.createLogger(LoggingConfig.DEV);
  }

  getSchedulers(): ScedulersInfo {
    const timeouts = this.schedulerRegistry.getTimeouts();
    const intervals = this.schedulerRegistry.getIntervals();
    const cronJobs = this.schedulerRegistry.getCronJobs();

    return {
      timeouts,
      intervals,
      cronJobs,
    };
  }

  getTimeout(id: string) {
    return this.schedulerRegistry.getTimeout(id);
  }

  addTimeout(taskId: string, timeout: NodeJS.Timeout) {
    this.schedulerRegistry.addTimeout(taskId, timeout);
  }

  getInterval(id: string) {
    const i = this.schedulerRegistry.getInterval(id);
    return {
      id,
      repeat: i._repeat,
    };
  }

  getCronJob(id: string) {
    return this.schedulerRegistry.getCronJob(id);
  }

  stopAllSchedulers() {
    this.logger.log('Stopping all scheduler');
    const timeouts = this.schedulerRegistry.getTimeouts();
    const intervals = this.schedulerRegistry.getIntervals();
    const cronJobs = this.schedulerRegistry.getCronJobs();
    timeouts.forEach((t) => this.schedulerRegistry.deleteTimeout(t));
    intervals.forEach((i) => this.schedulerRegistry.deleteInterval(i));
    cronJobs.forEach((j, key) => this.schedulerRegistry.deleteCronJob(key));
  }
}
