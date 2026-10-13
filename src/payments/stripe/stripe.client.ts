import Stripe from 'stripe';

export const STRIPE: unique symbol = Symbol('STRIPE');

export function createStripeClient(apiKey: string): Stripe {
  return new Stripe(apiKey);
}