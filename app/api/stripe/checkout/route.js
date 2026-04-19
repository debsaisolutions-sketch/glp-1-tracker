import { stripe } from "@/lib/stripeServer";

export async function POST(req) {
  try {
    const { email } = await req.json();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
      customer_email: email || undefined,
    });

    return Response.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
