"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/AppStateContext";
import { MedicationSetupForm } from "@/components/MedicationSetupForm";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { isDataSetupComplete, isPrimaryGoalSet } from "@/lib/setup-status";
import { isMedicationSetupComplete } from "@/lib/vial-settings";

export default function OnboardingStep2Page() {
  const router = useRouter();
  const { vial, setVial, primaryGoal, progress, doses, hydrated } =
    useAppState();

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
    if (
      isMedicationSetupComplete(vial) &&
      progress.length > 0 &&
      doses.length === 0
    ) {
      router.replace("/app/onboarding/step-4");
    }
  }, [hydrated, primaryGoal, vial, progress, doses, router]);

  function onFieldChange(key, value) {
    setVial((s) => ({ ...s, [key]: value }));
  }

  function onPatch(patch) {
    setVial((s) => ({ ...s, ...patch }));
  }

  function onContinue() {
    if (!isMedicationSetupComplete(vial)) return;
    router.push("/app/onboarding/step-3");
  }

  if (!hydrated) {
    return (
      <div className="animate-pulse rounded-2xl bg-zinc-100 py-16 dark:bg-zinc-800" />
    );
  }

  const canContinue = isMedicationSetupComplete(vial);

  return (
    <div className="flex flex-col gap-5">
      <OnboardingChrome step={2} />
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Step 2 · Medication setup
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Tell us about your vial
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Enter your medication strength so dose logs can convert units to mg.
        </p>
      </header>

      <MedicationSetupForm
        settings={vial}
        onFieldChange={onFieldChange}
        onPatch={onPatch}
      />

      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue to step 3
      </button>
    </div>
  );
}
