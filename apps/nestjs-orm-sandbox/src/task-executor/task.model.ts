export enum TaskId {}

export interface TaskExecutorOptions {
  queues: TaskQueueOptions[];
  defaultQueueId: string;
}

export interface TaskQueueOptions {
  id: string;
  priority: number;
}
