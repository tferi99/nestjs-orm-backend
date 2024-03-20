import { Controller, Get } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

@Controller('task-executor')
export class TaskExecutorController {
  constructor(private schedulerRegistry: SchedulerRegistry) {}
  @Get()
  getAll() {
    const crons = this.schedulerRegistry.getCronJobs();
    const intervals = this.schedulerRegistry.getIntervals();
    const timeouts = this.schedulerRegistry.getTimeouts();

    console.log('CRON JOBS:', crons);
    console.log('INTERVALS:', intervals);
    console.log('TIMEOUTS:', timeouts);
  }
}
