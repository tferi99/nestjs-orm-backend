import { Injectable, LoggerService } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { LoggingConfig } from '../../config/logging.config';

@Injectable()
export class DevService {
  logger: LoggerService;
  constructor() {
    this.logger = WinstonModule.createLogger(LoggingConfig.DEV);
  }

  async startBlockingTask(id: string, steps: number) {
    this.logger.log(`---------- BlockingTask[${id}] started (${steps} steps ----------)`);
    let start = Date.now();
    let step = 0;
    do {
      const now = Date.now();
      if (now - start > 1000) {
        step++;
        this.logger.log(`BlockingTask[${id}] step: ${step}`);
        start = now;
      }
    } while (step < steps);
    this.logger.log(`########## BlockingTask[${id}] completed ##########`);
  }

  /**
   *
   * @param id label for debug
   * @param runningTime in seconds
   */
  async startAsyncTask(id: string, runningTime: number): Promise<string> {
    this.logger.log(`START >>>>>>>>>>>>>> AsyncTask[${id}]: (${runningTime} steps >>>>>>>>>>>>>>)`);
    await new Promise((resolve) => setTimeout(resolve, runningTime * 1000));
    this.logger.log(`END <<<<< AsyncTask[${id}] <<<<<`);
    return 'ok';
  }
}
