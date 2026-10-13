import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePaymentSessionDto } from './create-payment-session.dto';

function toDto(body: unknown): CreatePaymentSessionDto {
  return plainToInstance(CreatePaymentSessionDto, body);
}

describe('CreatePaymentSessionDto', () => {
  it('acepta un payload válido', async () => {
    const dto = toDto({
      orderId: 'ord-1',
      currency: 'usd',
      items: [{ name: 'Producto', price: 20, quantity: 1 }],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza el payload sin items', async () => {
    const dto = toDto({ orderId: 'ord-1', currency: 'usd' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('rechaza items vacío', async () => {
    const dto = toDto({ orderId: 'ord-1', currency: 'usd', items: [] });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'items')).toBe(true);
  });

  it('rechaza precio negativo', async () => {
    const dto = toDto({
      orderId: 'ord-1',
      currency: 'usd',
      items: [{ name: 'Producto', price: -5, quantity: 1 }],
    });
    const errors = await validate(dto);
    expect(errors[0].property).toBe('items');
  });

  it('rechaza quantity que no es entero positivo', async () => {
    const dto = toDto({
      orderId: 'ord-1',
      currency: 'usd',
      items: [{ name: 'Producto', price: 10, quantity: 1.5 }],
    });
    const errors = await validate(dto);
    expect(errors[0].property).toBe('items');
  });

  it('rechaza orderId vacío', async () => {
    const dto = toDto({
      orderId: '',
      currency: 'usd',
      items: [{ name: 'Producto', price: 10, quantity: 1 }],
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'orderId')).toBe(true);
  });
});