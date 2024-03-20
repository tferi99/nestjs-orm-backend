import { Body, Controller, Delete, Get, Logger, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { DevService } from './dev.service';
import { CronJob } from 'cron';
import { EventsApiService } from '../../core/events/events-api/events-api.service';
import { AppManagementService } from './app-managment.service';
import { Roles } from '../../auth/role/roles.decorator';
import { AppEvent, EventToEmit, FeatureUtils, Role } from '@nestjs-orm/client';
import { ApplicationEvent } from '../../core/events/events.model';

export interface ScedulersInfo {
  timeouts: string[];
  intervals: string[];
  cronJobs: Map<string, CronJob>;
}

@Controller('dev')
@Roles(Role.Admin)
export class DevController {
  private readonly logger = new Logger(DevController.name);

  private devTaskIdx = 0;
  private smallTaskBatchIdx = 0;

  constructor(
    private devService: DevService,
    private appManagementService: AppManagementService,
    private eventsApiService: EventsApiService,
  ) {}

  @Get('/devLog')
  async devLog(@Query('message') message: string): Promise<void> {
    this.logger.log('Message: ' + message);
  }

  /**
   * It starts a blocking background job with a delay.
   *
   * @param id
   * @param steps
   * @param delay
   */
  @Get('/startBlockingTask')
  async startBlockingTask(@Query('id') id: string, @Query('steps', ParseIntPipe) steps: number, @Query('delay', ParseIntPipe) delay: number): Promise<string> {
    const taskId = id + '_' + this.devTaskIdx++;
    this.logger.warn(`BlockingTask[${taskId}] will be started in ${delay} seconds...`);

    const callback = () => {
      this.devService.startBlockingTask(taskId, steps);
    };

    const timeout = setTimeout(callback, delay * 1000);
    this.appManagementService.addTimeout(taskId, timeout);
    return 'ok';
  }

  @Get('/startAsyncTask')
  async startAsyncTask(@Query('id') id: string, @Query('time', ParseIntPipe) time: number): Promise<string> {
    const taskId = id + '_' + this.devTaskIdx++;
    this.logger.warn(`AsyncJob[${taskId}] calling...`);

    return this.devService.startAsyncTask(id, time);
  }

  @Get('/startSmallTasks')
  async startSmallTasks(@Query('count') count: number, @Query('time', ParseIntPipe) time: number): Promise<string> {
    const batchIdx = this.smallTaskBatchIdx++;
    this.logger.log(`------------------------ START of SmallTasks[${batchIdx}] batch ------------------------`);

    if (count < 0) {
      throw new Error(count + ' : task count should be a positive integer.');
    }
    for (let n = 0; n < count; n++) {
      const taskId = `SmallTasks[${batchIdx}][${n}]`;
      await this.devService.startAsyncTask(taskId, time);
    }
    this.logger.log(`======================== END of SmallTasks[${batchIdx}] batch ========================`);
    return 'ok';
  }

  @Get('schedulers')
  getSchedulers(): ScedulersInfo {
    return this.appManagementService.getSchedulers();
  }

  @Get('/timeout')
  getTimeout(@Query('id') id: string) {
    this.appManagementService.getTimeout(id);
  }

  @Get('/interval')
  getInterval(@Query('id') id: string) {
    this.appManagementService.getInterval(id);
  }

  @Get('/cronjob')
  getCronJob(@Query('id') id: string) {
    this.appManagementService.getCronJob(id);
  }

  @Delete('schedulers')
  stopAllSchedulers() {
    this.appManagementService.stopAllSchedulers;
  }

  @Get('/eventhandlers')
  getEventHandlers(@Query('filter') filter: string): string[] {
    return this.eventsApiService.getHandlers(filter);
  }

  @Get('/events')
  getEvents(): string[] {
    const ret: string[] = [];
    for (const value in AppEvent) {
      ret.push(value);
    }
    return ret;
  }

  @Post('/emit_event')
  emitEvent(@Body() event: EventToEmit): boolean {
    console.log('EVENT OT EMIT:', event);
    const appEvent: AppEvent = AppEvent[event.eventId];
    if (!appEvent) {
      return false;
    }
    const ev: ApplicationEvent<any> = { id: appEvent, ownerUserName: event.userName, payload: event.payload };
    console.log('EMIT:', ev);
    this.eventsApiService.emit(ev);
    return true;
  }

  @Get('/features/:bits')
  getFeatures(@Param('bits') bits: number): string {
    return FeatureUtils.featureBitsToString(bits);
  }

  @Get('/features-with-event')
  getActiveFeaturesWithEvent(): void {
    console.log('getActiveFeaturesWithEvent');
    this.eventsApiService.emit({
      id: AppEvent.TestGetActiveFeaures,
    });
  }
}
