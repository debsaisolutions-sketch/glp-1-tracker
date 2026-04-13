"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { EmojiPicker } from "@/components/EmojiPicker";
import { FEELING_EMOJIS } from "@/lib/constants";
import { MOCK_PROGRESS } from "@/lib/mock-data";
import { encouragingMessage } from "@/lib/glp1-helpers";

function newId() {
  return `p-${Math.random().toString(36).slice(2, 10)}`;
}

function sortByDateAsc(items) {
  return [...items].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

function sortByDateDesc(items) {
  return [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export default function ProgressPage() {
  const [entries, setEntries] = useState(MOCK_PROGRESS);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    weightLb: "",
    inches: "",
    feeling: FEELING_EMOJIS[1],
    notes: "",
  });

  const sortedAsc = useMemo(() => sortByDateAsc(entries), [entries]);
  const sortedDesc = useMemo(() => sortByDateDesc(entries), [entries]);

  const latest = sortedDesc[0];
  const baseline = sortedAsc[0];
  const change =
    latest && baseline ? latest.weightLb - baseline.weightLb : 0;
  const message = encouragingMessage(change);

  function addEntry(e) {
    e.preventDefault();
    const w = Number.parseFloat(form.weightLb);
    if (Number.isNaN(w)) return;
    const inchesVal = form.inches.trim();
    const row = {
      id: newId(),
      date: form.date,
      weightLb: w,
      inches: inchesVal === "" ? undefined : Number.parseFloat(inchesVal),
      feeling: form.feeling,
      notes: form.notes.trim(),
    };
    setEntries((x) => [row, ...x]);
    setForm((f) => ({
      ...f,
      weightLb: "",
      inches: "",
      notes: "",
    }));
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Progress
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Weight journey
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Track the trend—not just the number.
        </p>
      </header>

      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Current weight
        </p>
        {latest ? (
          <>
            <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {latest.weightLb} lb
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Logged {latest.date}
              {typeof latest.inches === "number" ? (
                <>
                  {" "}
                  · {latest.inches}
                  {'"'} waist (optional)
                </>
              ) : null}{" "}
              · {latest.feeling}
            </p>
            <p className="mt-3 rounded-xl bg-teal-50 p-3 text-sm leading-relaxed text-teal-900 dark:bg-teal-950 dark:text-teal-100">
              {message}
            </p>
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              Change vs first entry:{" "}
              <span className="font-semibold">
                {change > 0 ? "+" : ""}
                {change.toFixed(1)} lb
              </span>
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Add your first weigh-in.</p>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Log weigh-in
        </h2>
        <form className="mt-4 space-y-4" onSubmit={addEntry}>
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
                Weight (lb)
              </label>
              <input
                required
                inputMode="decimal"
                value={form.weightLb}
                onChange={(e) =>
                  setForm((f) => ({ ...f, weightLb: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Inches (optional)
              </label>
              <input
                inputMode="decimal"
                value={form.inches}
                onChange={(e) =>
                  setForm((f) => ({ ...f, inches: e.target.value }))
                }
                placeholder="e.g. waist"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>

          <EmojiPicker
            value={form.feeling}
            onChange={(emoji) =>
              setForm((f) => ({ ...f, feeling: emoji }))
            }
            label="How did this weigh-in feel?"
          />

          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Notes
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
            className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Save entry (local only)
          </button>
        </form>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          History
        </h2>
        {sortedDesc.map((p) => (
          <Card key={p.id}>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {p.weightLb} lb{" "}
              <span className="text-base font-normal" aria-hidden>
                {p.feeling}
              </span>
            </p>
            <p className="text-xs text-zinc-500">
              {p.date}
              {typeof p.inches === "number" ? ` · ${p.inches}"` : ""}
            </p>
            {p.notes ? (
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                {p.notes}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
