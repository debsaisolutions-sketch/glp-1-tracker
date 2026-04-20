"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { useAppState } from "@/components/AppStateContext";
import {
  getMgPerUnitFromVial,
  parseNumericAmount,
} from "@/lib/glp1-helpers";
import {
  collectFoodNoteStrings,
  detectShakeRelatedNotes,
} from "@/lib/nutrition-estimator";
import {
  getCurrentSetupStep,
  isPrimaryGoalSet,
  showFullDashboard,
} from "@/lib/setup-status";
import { getSupportGuidanceLines } from "@/lib/decision-engine";
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

function formatWeight(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)} lb` : "\u2014";
}

function formatDose(lastDose) {
  if (!lastDose) return "\u2014";
  const mg = parseNumericAmount(lastDose.mg);
  if (Number.isFinite(mg) && mg > 0) return `${mg.toFixed(1)} mg`;
  const units = parseNumericAmount(lastDose.units);
  if (Number.isFinite(units) && units > 0) return `${units.toFixed(1)} units`;
  return "\u2014";
}

function formatEntryDate(entry) {
  const raw = entry?.created_at || entry?.createdAt || entry?.date;
  if (!raw) return null;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatCalendarDate(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return "\u2014";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatShortMonthDay(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return "\u2014";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function parseLocalDateStart(raw) {
  if (!raw) return null;
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-").map((part) => Number.parseInt(part, 10));
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function localDayNumber(date) {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
      (24 * 60 * 60 * 1000),
  );
}

const STEP_HREF = {
  1: "/app/onboarding/step-1",
  2: "/app/onboarding/step-2",
  3: "/app/onboarding/step-3",
  4: "/app/onboarding/step-4",
};

export default function DashboardPage() {
  const router = useRouter();
  const {
    vial,
    doses,
    progress,
    daily,
    shakeNutritionPrefs,
    setShakeNutritionPrefs,
    primaryGoal,
    goalWeight,
    onboardingComplete,
    skipOnboarding,
    hydrated,
  } = useAppState();

  const full = showFullDashboard(
    onboardingComplete,
    vial,
    progress,
    doses,
    primaryGoal,
  );
  const medicationReady = isMedicationSetupComplete(vial);
  const step1Done = isPrimaryGoalSet(primaryGoal);
  const step2Done = medicationReady;
  const step3Done = progress.length > 0;
  const step4Done = doses.length > 0;
  const currentStep = getCurrentSetupStep(vial, progress, doses, primaryGoal);

  const progressSorted = sortByDateDesc(progress);
  const dosesSorted = sortByDateDesc(doses);
  const lastDose = dosesSorted[0];
  const latestWeight = progressSorted[0];
  const baseline = progressSorted[progressSorted.length - 1];
  const startingWeightEntry = useMemo(() => {
    if (progressSorted.length === 0) return null;
    const oldestFirst = [...progressSorted].reverse();
    return (
      oldestFirst.find((entry) =>
        String(entry?.notes || "")
          .toLowerCase()
          .includes("starting weight"),
      ) || oldestFirst[0]
    );
  }, [progressSorted]);
  const startingWeightLb = parseNumericAmount(startingWeightEntry?.weightLb);
  const currentWeightLb = parseNumericAmount(latestWeight?.weightLb);
  const startingWeightDateLabel = formatEntryDate(startingWeightEntry);
  const currentWeightDateLabel = formatEntryDate(latestWeight);
  const totalLostLb =
    Number.isFinite(startingWeightLb) && Number.isFinite(currentWeightLb)
      ? startingWeightLb - currentWeightLb
      : null;
  const goalWeightLb = Number.isFinite(goalWeight) && goalWeight > 0 ? goalWeight : null;
  const remainingToGoalLb =
    Number.isFinite(currentWeightLb) && Number.isFinite(goalWeightLb)
      ? currentWeightLb - goalWeightLb
      : null;
  const trackedWeeks = useMemo(() => {
    const startDate = startingWeightEntry?.date;
    const currentDate = latestWeight?.date;
    if (!startDate || !currentDate) return null;
    const ms = new Date(currentDate).getTime() - new Date(startDate).getTime();
    if (!Number.isFinite(ms) || ms <= 0) return null;
    return ms / (1000 * 60 * 60 * 24 * 7);
  }, [startingWeightEntry, latestWeight]);
  const averageWeeklyChange =
    Number.isFinite(totalLostLb) &&
    Number.isFinite(trackedWeeks) &&
    trackedWeeks > 0
      ? totalLostLb / trackedWeeks
      : null;
  const projectionRemainingLb =
    Number.isFinite(currentWeightLb) && Number.isFinite(goalWeightLb)
      ? currentWeightLb - goalWeightLb
      : null;
  const projectionWeeksToGoal =
    Number.isFinite(projectionRemainingLb) &&
    Number.isFinite(averageWeeklyChange) &&
    averageWeeklyChange !== 0
      ? projectionRemainingLb / averageWeeklyChange
      : null;
  const projectionGoalDate =
    Number.isFinite(projectionWeeksToGoal) && projectionWeeksToGoal >= 0
      ? new Date(Date.now() + projectionWeeksToGoal * 7 * 24 * 60 * 60 * 1000)
      : null;
  const projectionNotEnoughData =
    !Number.isFinite(startingWeightLb) ||
    !Number.isFinite(currentWeightLb) ||
    !Number.isFinite(trackedWeeks) ||
    trackedWeeks <= 0;
  const projectionPaceLabel =
    Number.isFinite(goalWeightLb) &&
    Number.isFinite(averageWeeklyChange) &&
    averageWeeklyChange !== 0
      ? `${averageWeeklyChange.toFixed(2)} lb/week`
      : "\u2014";
  const currentWeekDose = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const validDoseDates = doses
      .map((dose) => {
        return parseLocalDateStart(dose?.date);
      })
      .filter((date) => date && Number.isFinite(date.getTime()));
    const anchorStart =
      validDoseDates.length > 0
        ? new Date(Math.min(...validDoseDates.map((date) => date.getTime())))
        : new Date(todayStart);
    const daysSinceAnchor = localDayNumber(todayStart) - localDayNumber(anchorStart);
    const cycleIndex = daysSinceAnchor >= 0 ? Math.floor(daysSinceAnchor / 7) : 0;
    const weekStart = new Date(anchorStart);
    weekStart.setDate(anchorStart.getDate() + cycleIndex * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEndForSum = new Date(weekStart);
    weekEndForSum.setDate(weekEndForSum.getDate() + 6);
    weekEndForSum.setHours(23, 59, 59, 999);
    const sumEnd =
      weekEndForSum.getTime() < todayEnd.getTime()
        ? weekEndForSum.getTime()
        : todayEnd.getTime();

    const totalMg = doses.reduce((sum, dose) => {
      const parsedDoseDate = parseLocalDateStart(dose?.date);
      const t = parsedDoseDate?.getTime();
      if (!Number.isFinite(t)) return sum;
      if (t >= weekStart.getTime() && t <= sumEnd) {
        return sum + (dose?.mg || 0);
      }
      return sum;
    }, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return { totalMg, weekStart, weekEnd };
  }, [doses]);
  const weekMg = currentWeekDose.totalMg;
  const weekRangeLabel = `${formatShortMonthDay(
    currentWeekDose.weekStart,
  )} \u2013 ${formatShortMonthDay(currentWeekDose.weekEnd)}`;
  const mgPerUnit = getMgPerUnitFromVial(vial);

  const dailySorted = useMemo(() => sortByDateDesc(daily), [daily]);
  const shakeNoteList = useMemo(
    () => collectFoodNoteStrings(dosesSorted, dailySorted, 5),
    [dosesSorted, dailySorted],
  );
  const showShakeFollowUp =
    medicationReady &&
    full &&
    detectShakeRelatedNotes(shakeNoteList);

  const [shakeScoopsInput, setShakeScoopsInput] = useState("");
  const [shakeProtInput, setShakeProtInput] = useState("");
  const [shakeCarbInput, setShakeCarbInput] = useState("");
  const [shakeSessionScoops, setShakeSessionScoops] = useState(null);

  useEffect(() => {
    setShakeProtInput(
      shakeNutritionPrefs.proteinPerScoop > 0
        ? String(shakeNutritionPrefs.proteinPerScoop)
        : "",
    );
    setShakeCarbInput(
      shakeNutritionPrefs.carbsPerScoop > 0
        ? String(shakeNutritionPrefs.carbsPerScoop)
        : "",
    );
  }, [shakeNutritionPrefs]);

  useEffect(() => {
    if (shakeSessionScoops != null) {
      setShakeScoopsInput(String(shakeSessionScoops));
    } else {
      setShakeScoopsInput("");
    }
  }, [shakeSessionScoops]);

  const guidanceLines = useMemo(
    () =>
      getSupportGuidanceLines({
        doses,
        progress,
        daily,
        shakePrefs: shakeNutritionPrefs,
        shakeScoops: shakeSessionScoops,
        primaryGoal,
      }),
    [
      doses,
      progress,
      daily,
      shakeNutritionPrefs,
      shakeSessionScoops,
      primaryGoal,
    ],
  );

  function saveShakeDetails() {
    const prot = parseNumericAmount(shakeProtInput);
    const carb = parseNumericAmount(shakeCarbInput);
    const sc = parseNumericAmount(shakeScoopsInput);
    setShakeNutritionPrefs({
      proteinPerScoop: prot > 0 ? prot : 0,
      carbsPerScoop: Number.isFinite(carb) && carb >= 0 ? carb : 0,
    });
    if (Number.isFinite(sc) && sc > 0) {
      setShakeSessionScoops(sc);
    } else if (!String(shakeScoopsInput).trim()) {
      setShakeSessionScoops(null);
    }
  }

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
            Complete these four quick steps once—then your full dashboard
            unlocks.
          </p>
        </header>

        <Card className="border-teal-200/80 dark:border-teal-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-200">
            Step {currentStep} of 4
          </p>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={4}
          >
            <div
              className="h-full rounded-full bg-teal-600 transition-[width] duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
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
                Your goal
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
                Medication setup
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
                Starting weight
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-5 shrink-0 text-center font-medium text-teal-600 dark:text-teal-400">
                {step4Done ? "\u2713" : currentStep === 4 ? "\u2192" : "\u25CB"}
              </span>
              <span
                className={
                  currentStep === 4 && !step4Done
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
          Here&apos;s a snapshot of your health rhythm—everything saves on this
          device.
        </p>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Your Progress Snapshot
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <p className="text-xs font-medium text-zinc-500">Starting Weight</p>
            <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {formatWeight(startingWeightLb)}
            </p>
            {startingWeightDateLabel ? (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {startingWeightDateLabel}
              </p>
            ) : null}
          </Card>
          <Card>
            <p className="text-xs font-medium text-zinc-500">Current Weight</p>
            <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {formatWeight(currentWeightLb)}
            </p>
            {currentWeightDateLabel ? (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {currentWeightDateLabel}
              </p>
            ) : null}
          </Card>
          <Card>
            <p className="text-xs font-medium text-zinc-500">Total Lost</p>
            <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {formatWeight(totalLostLb)}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium text-zinc-500">Remaining to Goal</p>
            <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {formatWeight(remainingToGoalLb)}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium text-zinc-500">Current Dose</p>
            <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {formatDose(lastDose)}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium text-zinc-500">
              Average Weekly Change
            </p>
            <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {Number.isFinite(averageWeeklyChange)
                ? `${averageWeeklyChange.toFixed(2)} lb/week`
                : "\u2014"}
            </p>
          </Card>
        </div>
        <Card className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Goal Projection Timeline
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-zinc-500">Estimated Goal Date</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {Number.isFinite(goalWeightLb) && Number.isFinite(averageWeeklyChange) && averageWeeklyChange !== 0
                  ? formatCalendarDate(projectionGoalDate)
                  : "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Weeks Remaining</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {Number.isFinite(goalWeightLb) && Number.isFinite(averageWeeklyChange) && averageWeeklyChange !== 0 &&
                Number.isFinite(projectionWeeksToGoal)
                  ? Math.round(projectionWeeksToGoal)
                  : "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Weekly Pace</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {projectionPaceLabel}
              </p>
            </div>
          </div>
          {projectionNotEnoughData ? (
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Not enough data
            </p>
          ) : null}
        </Card>
      </section>

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
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {weekRangeLabel}
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

      {guidanceLines.length > 0 ? (
        <Card className="border-teal-100 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/25">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-200">
            Gentle guidance
          </p>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-teal-950 dark:text-teal-100">
            {guidanceLines.map((line, i) => {
              const text = typeof line === "string" ? line : line.text;
              const rec =
                typeof line === "object" && line?.recommendation
                  ? line.recommendation
                  : null;
              return (
                <li key={`${i}-${text.slice(0, 48)}`} className="flex gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p>{text}</p>
                    {rec ? (
                      <a
                        href={rec.url}
                        onClick={(e) => {
                          if (rec.url === "#") e.preventDefault();
                        }}
                        className="mt-1.5 inline-flex text-xs font-semibold text-teal-800 underline-offset-4 hover:underline dark:text-teal-200"
                      >
                        {rec.label}
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11px] text-teal-800/70 dark:text-teal-200/70">
            Affiliate links may be included.
          </p>
          <p className="mt-3 text-xs text-teal-800/80 dark:text-teal-200/80">
            For education only—not medical advice. Always follow your
            prescriber&apos;s plan.
          </p>
        </Card>
      ) : null}

      {showShakeFollowUp ? (
        <Card className="space-y-4 border-zinc-200/90 dark:border-zinc-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              Shake details (optional)
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Your notes mention a shake or protein powder. Add scoops and label
              numbers if you like—otherwise we&apos;ll keep a rough guess. Your
              usual protein and carbs per scoop are saved on this device.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="shake-scoops"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                How many scoops did you use?
              </label>
              <input
                id="shake-scoops"
                inputMode="decimal"
                value={shakeScoopsInput}
                onChange={(e) => setShakeScoopsInput(e.target.value)}
                placeholder="e.g. 1"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label
                htmlFor="shake-protein"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                How much protein per scoop (g)?
              </label>
              <input
                id="shake-protein"
                inputMode="decimal"
                value={shakeProtInput}
                onChange={(e) => setShakeProtInput(e.target.value)}
                placeholder="e.g. 25"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label
                htmlFor="shake-carbs"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                How many carbs per scoop (g)?
              </label>
              <input
                id="shake-carbs"
                inputMode="decimal"
                value={shakeCarbInput}
                onChange={(e) => setShakeCarbInput(e.target.value)}
                placeholder="e.g. 3"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>
          {shakeSessionScoops != null ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Using {shakeSessionScoops} scoop
              {shakeSessionScoops === 1 ? "" : "s"} for this visit&apos;s
              estimate. Clear scoops above and save to go back to a rough range.
            </p>
          ) : null}
          <button
            type="button"
            onClick={saveShakeDetails}
            className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Save for better estimates
          </button>
        </Card>
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
