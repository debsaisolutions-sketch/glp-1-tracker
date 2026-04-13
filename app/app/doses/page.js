"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import { EmojiPicker } from "@/components/EmojiPicker";
import {
  DOSE_TYPES,
  FEELING_EMOJIS,
  SIDE_EFFECT_OPTIONS,
} from "@/lib/constants";
import { MOCK_DOSES } from "@/lib/mock-data";
import {
  computeMgPerUnit,
  unitsToMg,
  weeklyDoseTotalMg,
} from "@/lib/glp1-helpers";
import { getVialSettings } from "@/lib/vial-settings";

function newId() {
  return `d-${Math.random().toString(36).slice(2, 10)}`;
}

function sortByDateDesc(items) {
  return [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export default function DosesPage() {
  const [doses, setDoses] = useState(MOCK_DOSES);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    units: 50,
    doseType: "full",
    feeling: FEELING_EMOJIS[1],
    sideEffects: [],
    notes: "",
  });

  const vial = getVialSettings();
  const mgPerUnit = computeMgPerUnit(
    vial.totalMg,
    vial.totalMl,
    vial.unitsPerMl,
  );

  const previewMg = unitsToMg(Number(form.units) || 0, mgPerUnit);
  const weekMg = weeklyDoseTotalMg(doses);

  function toggleEffect(id) {
    setForm((f) => {
      const has = f.sideEffects.includes(id);
      return {
        ...f,
        sideEffects: has
          ? f.sideEffects.filter((x) => x !== id)
          : [...f.sideEffects, id],
      };
    });
  }

  function addDose(e) {
    e.preventDefault();
    const units = Number(form.units) || 0;
    const mg = unitsToMg(units, mgPerUnit);
    const row = {
      id: newId(),
      date: form.date,
      units,
      mg: Math.round(mg * 1000) / 1000,
      doseType: form.doseType,
      feeling: form.feeling,
      sideEffects: form.sideEffects,
      notes: form.notes.trim(),
    };
    setDoses((d) => [row, ...d]);
    setForm((f) => ({
      ...f,
      units: 50,
      sideEffects: [],
      notes: "",
    }));
  }

  const sorted = sortByDateDesc(doses);

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Dose tracker
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Injections
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Units convert using the strength from your Settings page.
        </p>
      </header>

      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Weekly total (this week)
        </p>
        <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {weekMg.toFixed(2)} mg
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Log a dose
        </h2>
        <form className="mt-4 space-y-4" onSubmit={addDose}>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
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
            <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Side effects
            </p>
            <div className="flex flex-col gap-2">
              {SIDE_EFFECT_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200"
                >
                  <input
                    type="checkbox"
                    checked={form.sideEffects.includes(opt.id)}
                    onChange={() => toggleEffect(opt.id)}
                    className="h-4 w-4 rounded border-zinc-300 text-teal-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Add dose (local only)
          </button>
        </form>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Recent doses
        </h2>
        {sorted.map((d) => (
          <Card key={d.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {d.mg} mg · {d.units} units
                </p>
                <p className="text-xs text-zinc-500">
                  {d.date} · {d.doseType} · {d.feeling}
                </p>
              </div>
            </div>
            {d.sideEffects.length ? (
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                Side effects: {d.sideEffects.join(", ")}
              </p>
            ) : null}
            {d.notes ? (
              <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {d.notes}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
