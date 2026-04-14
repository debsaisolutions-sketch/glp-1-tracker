import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Card } from "@/components/Card";
import { StartTrialButton } from "@/components/StartTrialButton";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-teal-50/90 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-black">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-4 py-10 sm:max-w-4xl sm:py-14">
        <section className="space-y-4 text-center sm:text-left">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
            RealHealthPath
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Understand your body. Not just your dose.
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            A calmer way to track your health journey
          </h1>
          <p className="text-pretty text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Log doses with automatic mg math, capture daily notes, and watch
            weight trends—all in one friendly dashboard built for your phone.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <StartTrialButton className="inline-flex w-full items-center justify-center rounded-2xl bg-teal-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-75 sm:w-auto" />
            <span
              className="inline-flex cursor-default items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/80 px-5 py-3 text-center text-sm font-semibold text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-400"
              title="Transparent monthly pricing."
            >
              Then $9/month unless you cancel
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Cancel anytime
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            No surprise billing. You can cancel before the trial ends.
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Honest billing: 7 days free, then $9/month unless you cancel.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <Card>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Dose clarity
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Store vial strength once—units convert to mg automatically.
            </p>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Daily rhythm
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Food, protein, water, and mood in quick taps—not spreadsheets.
            </p>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Progress you feel
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Weigh-ins with encouraging context, not judgment.
            </p>
          </Card>
        </section>

        <section className="rounded-3xl border border-teal-100 bg-teal-50/60 p-6 dark:border-teal-900 dark:bg-teal-950/40">
          <p className="text-sm font-medium text-teal-900 dark:text-teal-100">
            Ready when you are
          </p>
          <p className="mt-2 text-sm leading-relaxed text-teal-800/90 dark:text-teal-200/90">
            Keep tracking simple with one subscription, one dashboard, and no
            surprise billing.
          </p>
          <div className="mt-4">
            <Link
              href="/app"
              className="text-sm font-semibold text-teal-900 underline-offset-4 hover:underline dark:text-teal-100"
            >
              Open the app preview →
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-zinc-200/80 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
        RealHealthPath · Educational mockup · Not medical advice
      </footer>
    </div>
  );
}
