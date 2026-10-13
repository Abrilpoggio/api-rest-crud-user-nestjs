import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { STRIPE, createStripeClient } from './stripe/stripe.client';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: STRIPE,
      useFactory: (config: ConfigService) =>
        createStripeClient(config.getOrThrow<string>('stripeSecret')),
      inject: [ConfigService],
    },
  ],
})
export class PaymentsModule {}