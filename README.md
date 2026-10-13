# TP4 – Sesiones de pago y webhook Stripe

Microservicio HTTP (NestJS) que (1) crea Checkout Sessions de pago en Stripe con una
API REST y (2) recibe el aviso de Stripe cuando el cobro se concreta (webhook).

## Requisitos

- Node.js 20+
- Una cuenta de Stripe en modo test con clave `sk_test_...`
- Stripe CLI (solo para probar el webhook en local)

## Configuración

1. Copiar `.env.template` a `.env`:

   ```bash
   copy .env.template .env
   ```

2. Completar `.env` con tus valores (`.env` NO se versiona; `.env.template` sí).

| Variable                  | Uso                                   |
| ------------------------- | ------------------------------------- |
| `PORT`                    | Puerto HTTP (sugerido: `3003`)        |
| `STRIPE_SECRET`           | Clave secreta de TEST (`sk_test_...`) |
| `STRIPE_SUCCESS_URL`      | URL de redirect al pagar bien         |
| `STRIPE_CANCEL_URL`       | URL de redirect al cancelar           |
| `STRIPE_ENDPOINT_SECRET`  | Signing secret del webhook (`whsec_...`) |

La app **falla al arrancar** si falta alguna de estas variables (fail-fast).

## Levantar

```bash
npm install
npm run start:dev
```

## Rutas

### Entrega 1 – Crear sesión de pago

```
POST /payments/create-payment-session
```

Body:

```json
{
  "orderId": "ord-1",
  "currency": "usd",
  "items": [
    { "name": "Producto", "price": 20, "quantity": 1 }
  ]
}
```

- `orderId` es obligatorio y viaja en `payment_intent_data.metadata`.
- Los precios se envían a Stripe en centavos (`Math.round(price * 100)`).
- Un payload inválido (sin `items`, precio negativo, campos extra) responde `400`.
- Respuesta: `{ "id": "...", "url": "https://checkout.stripe.com/..." }`.

Redirects de la Checkout Session (valores salen del `.env`, no del body):

```
GET /payments/success  -> { "ok": true,  "message": "Payment successful" }
GET /payments/cancel   -> { "ok": false, "message": "Payment cancelled"  }
```

### Entrega 2 – Webhook

```
POST /payments/webhook
```

- Verifica la firma (`stripe-signature`) con `STRIPE_ENDPOINT_SECRET`.
- Firma inválida/sin firma: `400`, no se procesa.
- `charge.succeeded`: extrae y loguea `metadata.orderId`.
- Otros eventos: log de "no manejado" y `200` (Stripe no reintenta).

Para probar en local:

```bash
stripe listen --forward-to localhost:3003/payments/webhook
```

Usar el `whsec_...` que imprime la CLI como `STRIPE_ENDPOINT_SECRET` y pagar con
una tarjeta de prueba (https://docs.stripe.com/testing).

## Tests y calidad

```bash
npm test        # tests unitarios (validación del DTO)
npm run lint    # oxlint
npm run build   # compila a dist/
```

## Fuera de alcance (de la consigna)

Integración con el MS de órdenes, NATS/TCP, reembolsos y modo live de Stripe.