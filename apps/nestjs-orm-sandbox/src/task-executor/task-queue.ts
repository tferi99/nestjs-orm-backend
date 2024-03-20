import { Task } from './task';
import { TaskQueueOptions } from './task.model';

/**
 * FIFO queue of tasks.
 */
export class TaskQueue {
  private _id: string;
  private _priority: number;
  private entries: Task[] = [];

  get id(): string {
    return this._id;
  }

  get priority(): number {
    return this._priority;
  }

  constructor(options: TaskQueueOptions) {
    this._id = options.id;
    this._priority = options.priority;
  }

  add(task: Task): void {
    this.entries.push(task);
  }

  dequeue(): Task | undefined {
    return this.entries.shift();
  }

  /**
   * It returns the first item of FIFO.
   */
  getFirstItem(): Task | undefined {
    if (this.entries.length === 0) {
      return undefined;
    }
    return this.entries[length - 1];
  }
}
