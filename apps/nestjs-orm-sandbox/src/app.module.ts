import { forwardRef, Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { TestModule } from './feature-modules/dev/test/test.module';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './core/filter/global-exception.filter';
import { InitModule } from './init/init.module';
import { ProfileModule } from './feature-modules/profile/profile.module';
import { AdminModule } from './feature-modules/admin/admin.module';
import { ClientConnectionModule } from './client-connection/client-connection.module';
import { SandboxModule } from './feature-modules/sandbox/sandbox.module';
import { ConfiguredEventsModule } from './config/events.config';
import { TaskExecutorModule } from './task-executor/task-executor.module';
import { DevModule } from './feature-modules/dev/dev.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfiguredEventsModule(),

    // feature-modules
    AuthModule,
    InitModule,
    AdminModule,
    ProfileModule,
    SandboxModule,
    TestModule,
    TaskExecutorModule,
    DevModule,

    forwardRef(() => ClientConnectionModule),
  ],
  controllers: [AppController],
  providers: [
    Logger, // for default logger

    // global error handling
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [],
})
export class AppModule {}

/* export class AppModule implements NestModule
{
  configure(consumer: MiddlewareConsumer): any {
    const opts: MikroOrmMiddlewareModuleOptions = {
      forRoutesPath: '.*',
    };
    consumer
      .apply(TestMiddleware) // MikroOrmMiddleware
      .forRoutes({ path: forRoutesPath(opts, consumer), method: RequestMethod.ALL });

  }
}
*/
