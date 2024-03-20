import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Task } from './task';
import { TaskQueue } from './task-queue';
import { TaskExecutorOptions, TaskQueueOptions } from './task.model';
import { TraceService } from '../core/trace/trace.service';
import { INIT_LOG_PREFIX } from '../init/init.service';

@Injectable()
export class TaskExecutorService {
  private readonly logger = new Logger(TaskExecutorService.name);

  private queues: TaskQueue[] = [];
  private defaultQueue?: TaskQueue;

  constructor(@Inject(forwardRef(() => TraceService)) traceService: TraceService) {}

  init(options: TaskExecutorOptions) {
    this.logger.log(INIT_LOG_PREFIX + 'Task executor initializing...');
    this.createQueues(options.queues);
    this.logger.log(INIT_LOG_PREFIX + 'Task executor initialized');
  }

  addTask(task: Task, queue?: TaskQueue) {}

  private createQueues(queuesConfig: TaskQueueOptions[]) {
    queuesConfig.forEach((cfg) => {
      const q = new TaskQueue(cfg);
      if (queuesConfig) this.queues.push();
    });
  }

  /*  @Cron('* * 8 * * *', {
    name: 'test',
  })
  testCron() {
    console.log('>>>>>>>>>>> testCron() called');
  }*/
}
