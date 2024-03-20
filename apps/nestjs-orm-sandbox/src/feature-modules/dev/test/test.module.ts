import { Module } from '@nestjs/common';
import { ConfiguredOrmModule } from '../../../config/mikro-orm.config';
import { PaymentController } from './payment/payment.controller';
import { PaymentService } from './payment/payment.service';

@Module({
  imports: [ConfiguredOrmModule()],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [],
})
export class TestModule {}
