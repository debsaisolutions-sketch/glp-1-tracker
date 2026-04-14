"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { useAppState } from "@/components/AppStateContext";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { FEELING_EMOJIS } from "@/lib/constants";
import { isDataSetupComplete, isPrimaryGoalSet } from "@/lib/setup-status";
import { isMedicationSetupComplete } from "@/lib/vial-settings";

function newId() {
  return `p-${Math.random().toString(36).slice(2, 10)}`;
}

export default function OnboardingStep3Page() {
  const router = useRouter();
  const { vial, addProgress, primaryGoal, progress, doses, hydrated } =
    useAppState();
  const [weightLb, setWeightLb] = useState("");
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  useEffect(() => {
    if (!hydrated) return;
    if (isDataSetupComplete(vial, progress, doses, primaryGoal)) {
      router.replace("/app");
      return;
    }
    if (!isPrimaryGoalSet(primaryGoal)) {
      router.replace("/app/onboarding/step-1");
      return;
    }
    if (!isMedicationSetupComplete(vial)) {
      router.replace("/app/onboarding/step-2");
      return;
    }
    if (progress.length > 0 && doses.length === 0) {
      router.replace("/app/onboarding/step-4");
    }
  }, [hydrated, primaryGoal, vial, progress, doses, router]);

  function onContinue(e) {
    e.preventDefault();
    const w = Number.parseFloat(weightLb);
    if (Number.isNaN(w) || w <= 0) return;
    addProgress({
      id: newId(),
      date,
      weightLb: w,
      feeling: FEELING_EMOJIS[1],
      notes: "Starting weight",
    });
    router.push("/app/onboarding/step-4");
  }

  if (!hydrated) {
    return (
      <div className="animate-pulse rounded-2xl bg-zinc-100 py-16 dark:bg-zinc-800" />
    );
  }

  const valid = !Number.isNaN(Number.parseFloat(weightLb)) &&
    Number.parseFloat(weightLb) > 0;

  return (
    <div className="flex flex-col gap-5">
      <OnboardingChrome step={3} />
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Step 3 · Starting weight
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Add your starting weight
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          One number is enough—we&apos;ll use it as your baseline on the
          dashboard.
        </p>
      </header>

      <Card>
        <form className="space-y-4" onSubmit={onContinue}>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Weight (lb)
            </label>
            <input
              inputMode="decimal"
              autoFocus
              value={weightLb}
              onChange={(e) => setWeightLb(e.target.value)}
              placeholder="e.g. 185"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <button
            type="submit"
            disabled={!valid}
            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </form>
      </Card>
    </div>
  );
}
