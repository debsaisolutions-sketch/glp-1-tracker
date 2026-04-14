import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Card } from "@/components/Card";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    blurb: "Mock tier for solo tracking.",
    features: ["Local mock data", "Core trackers", "Mobile layouts"],
  },
  {
    name: "Plus",
    price: "$8",
    period: "/mo",
    blurb: "Where sync & reminders will live.",
    features: ["Cloud sync (soon)", "Smart reminders (soon)", "Export CSV (soon)"],
    highlight: true,
  },
  {
    name: "Clinic",
    price: "Let’s talk",
    blurb: "For care teams—future roadmap.",
    features: ["Multi-user roles (soon)", "Audit logs (soon)", "HIPAA-ready path (soon)"],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/90 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-black">
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-10 sm:max-w-4xl">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Simple pricing
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Placeholder plans—Stripe checkout and accounts are not wired yet.
            Use this layout to pitch value; use Preview App to try the tracker
            locally.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={
                tier.highlight
                  ? "border-teal-200 ring-2 ring-teal-400/30 dark:border-teal-800"
                  : ""
              }
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {tier.name}
                </h2>
                {tier.highlight ? (
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-900 dark:bg-teal-950 dark:text-teal-100">
                    Popular
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {tier.blurb}
              </p>
              <p className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
                {tier.price}
                {tier.period ? (
                  <span className="text-base font-normal text-zinc-500">
                    {tier.period}
                  </span>
                ) : null}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-teal-600 dark:text-teal-400" aria-hidden>
                      {"\u2713"}
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {tier.name === "Starter" ? (
                <Link
                  href="/app"
                  className="mt-6 flex w-full items-center justify-center rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Preview App
                </Link>
              ) : tier.name === "Plus" ? (
                <span
                  className="mt-6 flex w-full cursor-default items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-2.5 text-sm font-semibold text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400"
                  title="Checkout is not wired in this preview."
                >
                  Coming soon
                </span>
              ) : (
                <span
                  className="mt-6 flex w-full cursor-default items-center justify-center rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  title="No waitlist form in this preview build."
                >
                  Join waitlist
                </span>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
