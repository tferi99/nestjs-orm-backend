import { Injectable } from '@nestjs/common';
import { CreatePaymentDto, Payment } from './payment.model';

@Injectable()
export class PaymentService {
  id = 0;

  async createPayment(data: CreatePaymentDto): Promise<Payment> {
    const { email, price } = data;

    return {
      id: this.id++,
      email,
      price,
    };
  }
}
