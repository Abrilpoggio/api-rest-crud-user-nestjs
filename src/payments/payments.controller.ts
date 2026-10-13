import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
  createPaymentSession(@Body() dto: CreatePaymentSessionDto) {
    return this.paymentsService.createPaymentSession(dto);
  }

  @Post('webhook')
  @HttpCode(200)
  webhook(@Req() req: Request) {
    const signature = req.headers['stripe-signature'];
    if (!signature || Array.isArray(signature)) {
      throw new BadRequestException('Falta el header stripe-signature');
    }
    return this.paymentsService.handleWebhook(req.rawBody ?? Buffer.alloc(0), signature);
  }

  @Get('success')
  paymentSuccess() {
    return { ok: true, message: 'Payment successful' };
  }

  @Get('cancel')
  paymentCancel() {
    return { ok: false, message: 'Payment cancelled' };
  }
}