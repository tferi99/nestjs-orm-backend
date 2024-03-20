import { forwardRef, Module } from '@nestjs/common';
import { ConfiguredOrmModule } from '../../config/mikro-orm.config';
import { ClientConnectionModule } from '../../client-connection/client-connection.module';
import { AppConfigController } from './app-config/app-config.controller';
import { UserConfigService } from './user-config/user-config.service';
import { AppConfigService } from './app-config/app-config.service';
import { UserConfigController } from './user-config/user-config.controller';
import { TraceModule } from '../trace/trace.module';

@Module({
  imports: [ConfiguredOrmModule(), forwardRef(() => ClientConnectionModule), forwardRef(() => TraceModule)],
  controllers: [AppConfigController, UserConfigController],
  providers: [UserConfigService, AppConfigService],
  exports: [UserConfigService, AppConfigService],
})
export class ConfigModule {}
