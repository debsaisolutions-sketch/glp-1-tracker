"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { useAppState } from "@/components/AppStateContext";
import {
  getMgPerUnitFromVial,
  weeklyDoseTotalMg,
} from "@/lib/glp1-helpers";
import {
  getCurrentSetupStep,
  showFullDashboard,
} from "@/lib/setup-status";
import { isMedicationSetupComplete } from "@/lib/vial-settings";

function sortByDateDesc(items, key = "date") {
  return [...items].sort(
    (a, b) => new Date(b[key]).getTime() - new Date(a[key]).getTime(),
  );
}

function medLabel(vial) {
  if (vial.medicationType === "custom" && vial.customName) {
    return vial.customName;
  }
  if (vial.medicationType === "semaglutide") return "Semaglutide";
  if (vial.medicationType === "tirzepatide") return "Tirzepatide";
  return "Medication";
}

const STEP_HREF = {
  1: "/app/onboarding/step-1",
  2: "/app/onboarding/step-2",
  3: "/app/onboarding/step-3",
};

export default function DashboardPage() {
  const router = useRouter();
  const {
    vial,
    doses,
    progress,
    onboardingComplete,
    skipOnboarding,
    hydrated,
  } = useAppState();

  const full = showFullDashboard(
    onboardingComplete,
    vial,
    progress,
    doses,
  );
  const medicationReady = isMedicationSetupComplete(vial);
  const step1Done = medicationReady;
  const step2Done = progress.length > 0;
  const step3Done = doses.length > 0;
  const currentStep = getCurrentSetupStep(vial, progress, doses);

  const progressSorted = sortByDateDesc(progress);
  const dosesSorted = sortByDateDesc(doses);
  const lastDose = dosesSorted[0];
  const latestWeight = progressSorted[0];
  const baseline = progressSorted[progressSorted.length - 1];
  const weekMg = weeklyDoseTotalMg(doses);
  const mgPerUnit = getMgPerUnitFromVial(vial);

  function onSkipSetup() {
    skipOnboarding();
    router.push("/app");
  }

  if (!hydrated) {
    return (
      <div className="animate-pulse rounded-2xl bg-zinc-100 py-24 dark:bg-zinc-800" />
    );
  }

  if (!full) {
    return (
      <div className="flex flex-col gap-5 pb-4">
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
            Setup mode
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Let&apos;s get you set up
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Complete these three steps once—then your full dashboard unlocks.
          </p>
        </header>

        <Card className="border-teal-200/80 dark:border-teal-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-200">
            Step {currentStep} of 3
          </p>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={3}
          >
            <div
              className="h-full rounded-full bg-teal-600 transition-[width] duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>

          <ul className="mt-5 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-5 shrink-0 text-center font-medium text-teal-600 dark:text-teal-400">
                {step1Done ? "\u2713" : currentStep === 1 ? "\u2192" : "\u25CB"}
              </span>
              <span
                className={
                  currentStep === 1 && !step1Done
                    ? "font-semibold text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-700 dark:text-zinc-300"
                }
              >
                Medication setup
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-5 shrink-0 text-center font-medium text-teal-600 dark:text-teal-400">
                {step2Done ? "\u2713" : currentStep === 2 ? "\u2192" : "\u25CB"}
              </span>
              <span
                className={
                  currentStep === 2 && !step2Done
                    ? "font-semibold text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-700 dark:text-zinc-300"
                }
              >
                Starting weight
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-5 shrink-0 text-center font-medium text-teal-600 dark:text-teal-400">
                {step3Done ? "\u2713" : currentStep === 3 ? "\u2192" : "\u25CB"}
              </span>
              <span
                className={
                  currentStep === 3 && !step3Done
                    ? "font-semibold text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-700 dark:text-zinc-300"
                }
              >
                First dose
              </span>
            </li>
          </ul>

          <Link
            href={STEP_HREF[currentStep]}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            Continue setup
          </Link>

          <button
            type="button"
            onClick={onSkipSetup}
            className="mt-3 w-full text-center text-sm font-medium text-zinc-500 underline-offset-4 hover:text-zinc-700 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Skip setup — I&apos;ll use the tabs
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Dashboard
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Hi there{" "}
          <span aria-hidden className="inline-block">
            {"\u{1F44B}"}
          </span>
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Here&apos;s a snapshot of your GLP-1 rhythm—everything saves on this
          device.
        </p>
      </header>

      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          This week&apos;s dose total
        </p>
        <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          {weekMg.toFixed(1)}{" "}
          <span className="text-lg font-normal text-zinc-500">mg</span>
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {medLabel(vial)} · {mgPerUnit.toFixed(3)} mg per unit
        </p>
      </Card>

      {!medicationReady ? (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/80 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          <p className="font-semibold">Medication setup needed</p>
          <p className="mt-1 leading-relaxed">
            Please set up your medication first so we can calculate your doses
            correctly.
          </p>
          <Link
            href="/app/settings"
            className="mt-3 inline-flex text-sm font-semibold text-amber-900 underline-offset-4 hover:underline dark:text-amber-200"
          >
            Open Medication Setup →
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-xs font-medium text-zinc-500">Last dose</p>
          {lastDose ? (
            <>
              <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {lastDose.mg} mg
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {lastDose.units} units · {lastDose.date} · {lastDose.doseType}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No doses logged yet.</p>
          )}
        </Card>
        <Card>
          <p className="text-xs font-medium text-zinc-500">Latest weight</p>
          {latestWeight ? (
            <>
              <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {latestWeight.weightLb} lb
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {latestWeight.date}
                {baseline && latestWeight.id !== baseline.id ? (
                  <>
                    {" "}
                    ·{" "}
                    {(latestWeight.weightLb - baseline.weightLb).toFixed(1)} lb
                    vs baseline
                  </>
                ) : null}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No weigh-ins yet.</p>
          )}
        </Card>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Shortcuts
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/app/doses"
            className="rounded-2xl bg-teal-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            Log Dose
          </Link>
          <Link
            href="/app/daily"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Daily Log
          </Link>
          <Link
            href="/app/progress"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Weight Progress
          </Link>
          <Link
            href="/app/settings"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Medication Setup
          </Link>
        </div>
      </div>
    </div>
  );
}
