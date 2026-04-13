"use client";

import { MedicationSetupForm } from "@/components/MedicationSetupForm";
import { useAppState } from "@/components/AppStateContext";

export default function SettingsPage() {
  const { vial, setVial, hydrated } = useAppState();

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
          Medication Setup
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Vial & pen math
        </h1>
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
