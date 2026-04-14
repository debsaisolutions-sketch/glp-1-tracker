import { PublicHeader } from "@/components/PublicHeader";
import { Card } from "@/components/Card";
import { StartTrialButton } from "@/components/StartTrialButton";

const tiers = [
  {
    name: "RealHealthPath",
    price: "$9",
    period: "/mo",
    blurb: "Start your 7-day free trial",
    features: [
      "Then $9/month unless you cancel",
      "Cancel anytime",
      "No surprise billing. You can cancel before the trial ends.",
    ],
    highlight: true,
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
            Start your 7-day free trial. Then $9/month unless you cancel.
            Cancel anytime.
          </p>
          <p className="mt-1 max-w-2xl text-xs text-zinc-500 dark:text-zinc-400">
            No surprise billing. You can cancel before the trial ends.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:max-w-md">
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
              <div className="mt-6">
                <StartTrialButton className="flex w-full items-center justify-center rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-75" />
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
