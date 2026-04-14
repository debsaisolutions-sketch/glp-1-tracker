"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { EmojiPicker } from "@/components/EmojiPicker";
import { useAppState } from "@/components/AppStateContext";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { DOSE_TYPES, FEELING_EMOJIS } from "@/lib/constants";
import {
  getMgPerUnitFromVial,
  parseNumericAmount,
  unitsToMg,
} from "@/lib/glp1-helpers";
import { isPrimaryGoalSet } from "@/lib/setup-status";
import { isMedicationSetupComplete } from "@/lib/vial-settings";

function newId() {
  return `d-${Math.random().toString(36).slice(2, 10)}`;
}

export default function OnboardingStep4Page() {
  const router = useRouter();
  const {
    vial,
    addDose,
    completeOnboarding,
    primaryGoal,
    progress,
    doses,
    hydrated,
  } = useAppState();

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    units: "50",
    doseType: "full",
    feeling: FEELING_EMOJIS[1],
    notes: "",
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!isPrimaryGoalSet(primaryGoal)) {
      router.replace("/app/onboarding/step-1");
      return;
    }
    if (!isMedicationSetupComplete(vial)) {
      router.replace("/app/onboarding/step-2");
      return;
    }
    if (progress.length === 0) {
      router.replace("/app/onboarding/step-3");
      return;
    }
    if (doses.length > 0) {
      router.replace("/app");
    }
  }, [hydrated, primaryGoal, vial, progress, doses, router]);

  const mgPerUnit = useMemo(() => getMgPerUnitFromVial(vial), [vial]);

  const previewMg = unitsToMg(parseNumericAmount(form.units) || 0, mgPerUnit);

  function onFinish(e) {
    e.preventDefault();
    const units = parseNumericAmount(form.units) || 0;
    if (units <= 0) return;
    const mg = unitsToMg(units, mgPerUnit);
    addDose({
      id: newId(),
      date: form.date,
      units,
      mg: Math.round(mg * 1000) / 1000,
      doseType: form.doseType,
      feeling: form.feeling,
      sideEffects: [],
      notes: form.notes.trim() || "First dose",
    });
    completeOnboarding();
    router.push("/app");
  }

  if (!hydrated) {
    return (
      <div className="animate-pulse rounded-2xl bg-zinc-100 py-16 dark:bg-zinc-800" />
    );
  }

  const validUnits = (parseNumericAmount(form.units) || 0) > 0;

  return (
    <div className="flex flex-col gap-5">
      <OnboardingChrome step={4} />
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Step 4 · First dose
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Log your first dose
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Units and mg use the vial from step 2—adjust the defaults if needed.
        </p>
      </header>

      <Card>
        <form className="space-y-4" onSubmit={onFinish}>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Units
              </label>
              <input
                inputMode="decimal"
                value={form.units}
                onChange={(e) =>
                  setForm((f) => ({ ...f, units: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Mg (auto)
              </label>
              <div className="mt-1 flex h-[42px] items-center rounded-xl border border-dashed border-teal-200 bg-teal-50 px-3 text-sm font-medium text-teal-900 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-100">
                {previewMg.toFixed(3)} mg
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Dose type
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DOSE_TYPES.map((t) => {
                const on = form.doseType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, doseType: t.id }))
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      on
                        ? "bg-teal-600 text-white"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <EmojiPicker
            value={form.feeling}
            onChange={(emoji) =>
              setForm((f) => ({ ...f, feeling: emoji }))
            }
          />

          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>

          <button
            type="submit"
            disabled={!validUnits}
            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Finish setup
          </button>
        </form>
      </Card>
    </div>
  );
}
