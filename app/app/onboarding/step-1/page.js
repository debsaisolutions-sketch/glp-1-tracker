"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { useAppState } from "@/components/AppStateContext";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { PRIMARY_GOAL_OPTIONS } from "@/lib/constants";
import { isDataSetupComplete, isPrimaryGoalSet } from "@/lib/setup-status";
import { isMedicationSetupComplete } from "@/lib/vial-settings";

function btnBase(active) {
  return `w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
    active
      ? "bg-teal-600 text-white shadow-sm"
      : "border border-zinc-200 bg-white text-zinc-900 hover:border-teal-200 hover:bg-teal-50/80 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-teal-800 dark:hover:bg-teal-950/40"
  }`;
}

export default function OnboardingStep1Page() {
  const router = useRouter();
  const {
    primaryGoal,
    setPrimaryGoal,
    vial,
    progress,
    doses,
    hydrated,
  } = useAppState();

  useEffect(() => {
    if (!hydrated) return;
    if (isDataSetupComplete(vial, progress, doses, primaryGoal)) {
      router.replace("/app");
      return;
    }
    if (!isPrimaryGoalSet(primaryGoal)) return;
    if (!isMedicationSetupComplete(vial)) {
      router.replace("/app/onboarding/step-2");
      return;
    }
    if (progress.length === 0) {
      router.replace("/app/onboarding/step-3");
      return;
    }
    if (doses.length === 0) {
      router.replace("/app/onboarding/step-4");
      return;
    }
    router.replace("/app");
  }, [hydrated, primaryGoal, vial, progress, doses, router]);

  function selectGoal(id) {
    setPrimaryGoal(id);
    router.push("/app/onboarding/step-2");
  }

  if (!hydrated) {
    return (
      <div className="animate-pulse rounded-2xl bg-zinc-100 py-16 dark:bg-zinc-800" />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <OnboardingChrome step={1} />
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Step 1 · Your goal
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          What are you mainly using this for right now?
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Pick what fits best—you can change this anytime in Settings. This
          helps us tune gentle guidance, not medical advice.
        </p>
      </header>

      <Card className="space-y-2 p-3 sm:p-4">
        <div className="flex flex-col gap-2">
          {PRIMARY_GOAL_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => selectGoal(opt.id)}
              className={btnBase(primaryGoal === opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
