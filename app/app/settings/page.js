"use client";

import { Card } from "@/components/Card";
import { MedicationSetupForm } from "@/components/MedicationSetupForm";
import { useAppState } from "@/components/AppStateContext";
import { PRIMARY_GOAL_OPTIONS } from "@/lib/constants";

function btnBase(active) {
  return `w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
    active
      ? "bg-teal-600 text-white shadow-sm"
      : "border border-zinc-200 bg-white text-zinc-900 hover:border-teal-200 hover:bg-teal-50/80 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-teal-800 dark:hover:bg-teal-950/40"
  }`;
}

export default function SettingsPage() {
  const { vial, setVial, primaryGoal, setPrimaryGoal, hydrated } = useAppState();

  function onFieldChange(key, value) {
    setVial((s) => ({ ...s, [key]: value }));
  }

  function onPatch(patch) {
    setVial((s) => ({ ...s, ...patch }));
  }

  if (!hydrated) {
    return (
      <div className="animate-pulse rounded-2xl bg-zinc-100 py-24 dark:bg-zinc-800" />
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Primary goal
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          What you are mainly tracking for
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          This shapes gentle dashboard guidance (not medical advice). You can
          change it anytime.
        </p>
      </header>

      <Card className="space-y-2 p-3 sm:p-4">
        <div className="flex flex-col gap-2">
          {PRIMARY_GOAL_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPrimaryGoal(opt.id)}
              className={btnBase(primaryGoal === opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <header className="pt-2">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Medication Setup
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Vial & pen math
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Enter your medication and vial strength here so every dose log can
          convert units to mg correctly.
        </p>
      </header>

      <MedicationSetupForm
        settings={vial}
        onFieldChange={onFieldChange}
        onPatch={onPatch}
      />
    </div>
  );
}
