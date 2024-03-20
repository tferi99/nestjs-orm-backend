import { forwardRef, Module } from '@nestjs/common';
import { EventTestService } from './event-test.service';
import { SandboxController } from './sandbox.controller';
import { EventsApiModule } from '../../core/events/events-api/events-api.module';
import { ConfigModule } from '../../core/config/config.module';
import { SandboxService } from './sandbox.service';
import { PersonController } from './person/person.controller';
import { TraceModule } from '../../core/trace/trace.module';
import { ConfiguredOrmModule } from '../../config/mikro-orm.config';
import { PersonService } from './person/person.service';
import { CompanyController } from './company/company.controller';
import { ClientConnectionModule } from '../../client-connection/client-connection.module';

@Module({
  imports: [ConfiguredOrmModule(), EventsApiModule, forwardRef(() => ConfigModule), forwardRef(() => TraceModule), forwardRef(() => ClientConnectionModule)],
  controllers: [SandboxController, PersonController, CompanyController],
  providers: [EventTestService, SandboxService, PersonService],
})
export class SandboxModule {}
