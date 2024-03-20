import { TaskExecutorOptions } from '../task-executor/task.model';

export enum QueueId {
  Important = 'IMPORTANT',
  Normal = 'NORMAL',
}

export const TASK_EXECUTOR_CONFIG: TaskExecutorOptions = {
  queues: [
    { id: QueueId.Important, priority: 0 },
    { id: QueueId.Normal, priority: 1 },
  ],
  defaultQueueId: QueueId.Normal,
};
