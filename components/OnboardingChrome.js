"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/AppStateContext";

/**
 * @param {{ step: 1 | 2 | 3 | 4 }} props
 */
export function OnboardingChrome({ step }) {
  const router = useRouter();
  const { skipOnboarding } = useAppState();
  const total = 4;
  const pct = (step / total) * 100;

  function onSkip() {
    skipOnboarding();
    router.push("/app");
  }

  return (
    <div className="mb-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-200">
          Setup mode · Step {step} of {total}
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="shrink-0 text-xs font-medium text-zinc-500 underline-offset-4 hover:text-zinc-700 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Skip setup
        </button>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Setup step ${step} of ${total}`}
      >
        <div
          className="h-full rounded-full bg-teal-600 transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Prefer the full app?{" "}
        <Link
          href="/app"
          className="font-medium text-teal-700 hover:underline dark:text-teal-300"
        >
          Go to dashboard
        </Link>
      </p>
    </div>
  );
}
