"use client";

import Link from "next/link";
import { Card } from "@/components/Card";
import { MOCK_DOSES, MOCK_PROGRESS } from "@/lib/mock-data";
import {
  computeMgPerUnit,
  weeklyDoseTotalMg,
} from "@/lib/glp1-helpers";
import { getVialSettings } from "@/lib/vial-settings";

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

export default function DashboardPage() {
  const vial = getVialSettings();
  const doses = MOCK_DOSES;
  const progressSorted = sortByDateDesc(MOCK_PROGRESS);
  const dosesSorted = sortByDateDesc(doses);
  const lastDose = dosesSorted[0];
  const latestWeight = progressSorted[0];
  const baseline = progressSorted[progressSorted.length - 1];
  const weekMg = weeklyDoseTotalMg(doses);
  const mgPerUnit = computeMgPerUnit(
    vial.totalMg,
    vial.totalMl,
    vial.unitsPerMl,
  );

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
          Here&apos;s a snapshot of your GLP-1 rhythm (mock data).
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
          Quick actions
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/app/doses"
            className="rounded-2xl bg-teal-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            Log dose
          </Link>
          <Link
            href="/app/daily"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Daily log
          </Link>
          <Link
            href="/app/progress"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Log weight
          </Link>
          <Link
            href="/app/settings"
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Vial settings
          </Link>
        </div>
      </div>
    </div>
  );
}
