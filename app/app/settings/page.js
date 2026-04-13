"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { MEDICATION_OPTIONS } from "@/lib/constants";
import { MOCK_SETTINGS } from "@/lib/mock-data";
import {
  computeMgPerMl,
  computeMgPerUnit,
} from "@/lib/glp1-helpers";
import { replaceVialSettings } from "@/lib/vial-settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState(MOCK_SETTINGS);

  useEffect(() => {
    replaceVialSettings(settings);
  }, [settings]);

  const mgPerMl = useMemo(
    () => computeMgPerMl(settings.totalMg, settings.totalMl),
    [settings.totalMg, settings.totalMl],
  );

  const mgPerUnit = useMemo(
    () =>
      computeMgPerUnit(
        settings.totalMg,
        settings.totalMl,
        settings.unitsPerMl,
      ),
    [settings.totalMg, settings.totalMl, settings.unitsPerMl],
  );

  function update(key, value) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Settings
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Vial & pen math
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Tune once—dose logging will convert units → mg automatically.
        </p>
      </header>

      <Card className="space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Medication type
          </label>
          <select
            value={settings.medicationType}
            onChange={(e) => update("medicationType", e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {MEDICATION_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {settings.medicationType === "custom" ? (
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Custom name
            </label>
            <input
              value={settings.customName}
              onChange={(e) => update("customName", e.target.value)}
              placeholder="e.g. liraglutide"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Total mg in vial
            </label>
            <input
              inputMode="decimal"
              value={settings.totalMg}
              onChange={(e) =>
                update("totalMg", Number.parseFloat(e.target.value) || 0)
              }
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Total mL
            </label>
            <input
              inputMode="decimal"
              value={settings.totalMl}
              onChange={(e) =>
                update("totalMl", Number.parseFloat(e.target.value) || 0)
              }
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Units per mL
          </label>
          <input
            inputMode="numeric"
            value={settings.unitsPerMl}
            onChange={(e) =>
              update("unitsPerMl", Number.parseFloat(e.target.value) || 0)
            }
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Pens often use 100 units per mL—confirm with your pharmacist.
          </p>
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Auto-calculated
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
            <dt className="text-xs text-zinc-500">mg per mL</dt>
            <dd className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
              {mgPerMl.toFixed(3)}
            </dd>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
            <dt className="text-xs text-zinc-500">mg per unit</dt>
            <dd className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
              {mgPerUnit.toFixed(4)}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
