import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const isStripeConfigured = Boolean(
  stripeSecretKey && process.env.STRIPE_PRICE_ID,
);

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
