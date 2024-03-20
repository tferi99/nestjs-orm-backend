import { IsEmail, IsNotEmpty, IsNumberString } from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsNumberString()
  price: number;
}

export interface Payment {
  id: number;
  email: string;
  price: number;
}
