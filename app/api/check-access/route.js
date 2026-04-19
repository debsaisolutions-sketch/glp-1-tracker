import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ACTIVE_STATUSES = ["trialing", "active"];

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ hasAccess: false, reason: "missing_token" }, { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ hasAccess: false, reason: "invalid_user" }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json({ hasAccess: false, reason: "missing_email" }, { status: 403 });
    }

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    const customer = customers.data[0];

    if (!customer) {
      return NextResponse.json({ hasAccess: false, reason: "no_customer" }, { status: 403 });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
    });

    const hasAccess = subscriptions.data.some((subscription) =>
      ACTIVE_STATUSES.includes(subscription.status)
    );

    return NextResponse.json({
      hasAccess,
      customerId: customer.id,
      subscriptionStatuses: subscriptions.data.map((subscription) => subscription.status),
    });
  } catch (error) {
    console.error("check-access error:", error);

    return NextResponse.json(
      { hasAccess: false, reason: "server_error" },
      { status: 500 }
    );
  }
}
