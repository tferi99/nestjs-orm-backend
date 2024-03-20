import { Module } from '@nestjs/common';
import { DevController } from './dev.controller';
import { DevService } from './dev.service';
import { EventsApiModule } from '../../core/events/events-api/events-api.module';
import { ConfiguredOrmModule } from '../../config/mikro-orm.config';
import { AppManagementService } from './app-managment.service';

@Module({
  imports: [ConfiguredOrmModule(), EventsApiModule],
  controllers: [DevController],
  providers: [DevService, AppManagementService],
})
export class DevModule {}
