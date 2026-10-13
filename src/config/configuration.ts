export interface AppConfig {
  port: number;
  stripeSecret: string;
  stripeSuccessUrl: string;
  stripeCancelUrl: string;
  stripeEndpointSecret: string;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Falta la variable de entorno obligatoria "${name}". Revisa .env.template y creá tu .env`,
    );
  }
  return value;
}

export default (): AppConfig => {
  const port = Number(process.env.PORT ?? 3003);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('La variable de entorno "PORT" debe ser un número de puerto válido.');
  }

  return {
    port,
    stripeSecret: required('STRIPE_SECRET'),
    stripeSuccessUrl: required('STRIPE_SUCCESS_URL'),
    stripeCancelUrl: required('STRIPE_CANCEL_URL'),
    stripeEndpointSecret: required('STRIPE_ENDPOINT_SECRET'),
  };
};