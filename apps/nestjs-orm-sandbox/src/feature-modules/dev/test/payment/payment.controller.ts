import { Body, Controller, Get, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, Payment } from './payment.model';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Get()
  getPayments(@Req() req, @Res() res): void {
    const { count, page } = req.query;
    console.log(`Payment - count: ${count}, page: ${page}`);
    if (!count || !page) {
      res.status(HttpStatus.BAD_REQUEST).send('Missing count or page');
      return;
    }
    res.status(HttpStatus.OK).send(`OK - count: ${count}, page: ${page}`);
  }

  @Post()
  async createPayment(@Body() data: CreatePaymentDto): Promise<Payment> {
    return this.paymentService.createPayment(data);
  }
}
