import { NextResponse } from "next/server";
import { isStripeConfigured, stripe } from "@/lib/stripeServer";

export async function POST(request) {
  if (!isStripeConfigured || !stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const supabaseUserId =
    typeof body?.supabaseUserId === "string" ? body.supabaseUserId.trim() : "";

  const origin = request.headers.get("origin") || request.nextUrl.origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: supabaseUserId ? { supabase_user_id: supabaseUserId } : {},
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      ...(email ? { customer_email: email } : {}),
      metadata: supabaseUserId ? { supabase_user_id: supabaseUserId } : {},
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch {
    return NextResponse.json(
      { error: "Unable to start checkout session." },
      { status: 500 },
    );
  }
}
