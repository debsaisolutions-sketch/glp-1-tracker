import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Card } from "@/components/Card";

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/90 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-black">
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <Card className="mx-auto max-w-md">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Trial started
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Your 7-day free trial is active. You can use the tracker now.
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Your plan becomes $9/month after trial unless you cancel.
          </p>
          <Link
            href="/app"
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Open app
          </Link>
        </Card>
      </main>
    </div>
  );
}
