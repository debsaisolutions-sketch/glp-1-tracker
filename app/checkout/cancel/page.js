import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Card } from "@/components/Card";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/90 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-black">
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <Card className="mx-auto max-w-md">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Checkout canceled
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            No charge was made. You can start your 7-day free trial whenever
            you&apos;re ready.
          </p>
          <Link
            href="/pricing"
            className="mt-6 flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Back to pricing
          </Link>
        </Card>
      </main>
    </div>
  );
}
