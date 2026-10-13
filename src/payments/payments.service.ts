import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { STRIPE } from './stripe/stripe.client';
import {
  CreatePaymentSessionDto,
  CreatePaymentSessionItemDto,
} from './dto/create-payment-session.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(STRIPE) private readonly stripe: Stripe,
  ) {}

  async createPaymentSession(dto: CreatePaymentSessionDto) {
    const successUrl = this.config.getOrThrow<string>('stripeSuccessUrl');
    const cancelUrl = this.config.getOrThrow<string>('stripeCancelUrl');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: {
        metadata: { orderId: dto.orderId },
      },
      line_items: dto.items.map((item) => this.toLineItem(item, dto.currency)),
    });

    return { id: session.id, url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const endpointSecret = this.config.getOrThrow<string>('stripeEndpointSecret');

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Webhook rechazado (firma inválida): ${message}`);
      throw new BadRequestException(`Firma inválida del webhook: ${message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_intent) {
          try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(
              session.payment_intent as string,
            );
            const orderId = paymentIntent.metadata?.orderId;
            if (orderId) {
              this.logger.log(`Pago concretado para orderId=${orderId}`);
            } else {
              this.logger.warn('checkout.session.completed sin orderId en metadata');
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Error al recuperar PaymentIntent: ${message}`);
          }
        }
        break;
      }
      case 'charge.succeeded':
        await this.handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;
      default:
        this.logger.log(`Evento no manejado: "${event.type}" (respondiendo 200)`);
        break;
    }
  }

  private async handleChargeSucceeded(charge: Stripe.Charge) {
    const orderId = await this.resolveOrderId(charge);
    if (orderId) {
      this.logger.log(`Pago concretado para orderId=${orderId}`);
    } else {
      this.logger.warn(
        'charge.succeeded recibido sin poder resolver orderId en metadata',
      );
    }
  }

  private async resolveOrderId(charge: Stripe.Charge): Promise<string | undefined> {
    if (charge.metadata?.orderId) {
      return charge.metadata.orderId;
    }
    if (charge.payment_intent) {
      try {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(
          charge.payment_intent as string,
        );
        return paymentIntent.metadata?.orderId;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `No se pudo recuperar el PaymentIntent ${charge.payment_intent}: ${message}`,
        );
      }
    }
    return undefined;
  }

  private toLineItem(
    item: CreatePaymentSessionItemDto,
    currency: string,
  ): Stripe.Checkout.SessionCreateParams.LineItem {
    return {
      quantity: item.quantity,
      price_data: {
        currency,
        unit_amount: Math.round(item.price * 100),
        product_data: { name: item.name },
      },
    };
  }
}