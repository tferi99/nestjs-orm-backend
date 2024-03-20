import { Logger, LoggerService } from '@nestjs/common';

export class DevUtils {
  static printErrorStackTrace(label: string, err?: Error) {
    if (!err) {
      err = new Error();
    }
    if (label) {
      console.log(label);
    }
    console.log('########################################################## Stack trace ##########################################################\n', err.stack);
    console.log('#################################################################################################################################');
  }

  static logErrorStackTrace(logger: LoggerService, err?: Error) {
    if (!err) {
      err = new Error();
    }
    logger.error(err.stack);
  }
}
