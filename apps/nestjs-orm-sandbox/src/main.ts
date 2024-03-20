// loading .env
import { config } from 'dotenv';
config({}); // it should be called after importing .env

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { LoggingConfig } from './config/logging.config';
import { EnvUtils } from './core/util/env-utils';
import { DevUtils } from './core/util/dev-utils';
import { DatabaseSchemaCreator } from './core/orm/schema/database-schema-creator';
import { ENTITIES } from './config/mikro-orm.config';
import { InitService } from './init/init.service';

const PORT = EnvUtils.getNumberValue('SERVER_PORT');
/**
 * Logging configured by documentation here: https://github.com/gremo/nest-winston#replacing-the-nest-logger-also-for-bootstrapping
 * This way Nest default logger replaced by a Winson logger and it can be inject as default logger later:
 *
 *    constructor(@Inject(Logger) private readonly logger: LoggerService) {}
 *
 *  NOTE: in this case Logger should be provided by AppModule.
 */

/**
 * If you want to process commend line parameters
 */
const argv = process.argv.slice(2);
if (argv.includes('createdbschema')) {
  try {
    DatabaseSchemaCreator.create(ENTITIES, true);
  } catch (e) {
    console.log('ERROR:', e);
  }
} else {
  /**
   *  Documentation: https://github.com/winstonjs/winston
   *
   *  Normally Winston can handle unhanled exceptipns and rejections
   *  but in this application this solution cannot work and application crashes.
   *  That't the reason why I handle+log rejections in main.ts manually.
   */
  /**
   * To fix unhandled exceptions which can crash application
   * if thrown from an async function called without await.
   *
   * SEE ALSO: https://stackoverflow.com/questions/64341200/how-to-fix-unhandled-promise-rejection-warning-in-nestjs
   */
  const rejectionLogger = WinstonModule.createLogger(LoggingConfig.REJECTIONS);
  process.on('unhandledRejection', (err: Error) => {
    DevUtils.printErrorStackTrace('UNHANDLED REJECTION:', err);
    DevUtils.logErrorStackTrace(rejectionLogger, err);
  });

  async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
      logger: WinstonModule.createLogger(LoggingConfig.MAIN),
      // logger: console,
      //logger: false,
    });

    // swagger
    /*  const options = new DocumentBuilder().setTitle('Cats example').setDescription('The cats API description').setVersion('1.0').addTag('cats').build();
      const document = SwaggerModule.createDocument(app, options);
      SwaggerModule.setup('api', app, document);*/

    //  app.useGlobalInterceptors(new ErrorsInterceptor());

    const initService = app.get(InitService);
    await initService.initApplication();

    await app.listen(PORT);
  }
  bootstrap();
}
