"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { EmojiPicker } from "@/components/EmojiPicker";
import { useAppState } from "@/components/AppStateContext";
import { FEELING_EMOJIS } from "@/lib/constants";
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

function emptyProgressForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    weightLb: "",
    inches: "",
    feeling: FEELING_EMOJIS[1],
    notes: "",
  };
}

const btnEdit =
  "touch-manipulation rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";
const btnDelete =
  "touch-manipulation rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 active:bg-red-100 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40";

export default function ProgressPage() {
  const { progress: entries, addProgress, setProgress, hydrated } = useAppState();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyProgressForm);

  const sortedAsc = useMemo(() => sortByDateAsc(entries), [entries]);
  const sortedDesc = useMemo(() => sortByDateDesc(entries), [entries]);

  const latest = sortedDesc[0];
  const baseline = sortedAsc[0];
  const change =
    latest && baseline ? latest.weightLb - baseline.weightLb : 0;
  const message = encouragingMessage(change);

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyProgressForm());
  }

  function beginEdit(p) {
    setEditingId(p.id);
    setForm({
      date: p.date,
      weightLb: String(p.weightLb),
      inches:
        typeof p.inches === "number" && !Number.isNaN(p.inches)
          ? String(p.inches)
          : "",
      feeling: p.feeling || FEELING_EMOJIS[1],
      notes: p.notes ?? "",
    });
  }

  function confirmDeleteProgress(id) {
    if (
      !window.confirm(
        "Delete this weigh-in? This removes it from this device.",
      )
    ) {
      return;
    }
    setProgress((list) => list.filter((x) => x.id !== id));
    if (editingId === id) cancelEdit();
  }

  function submitEntry(e) {
    e.preventDefault();
    const w = Number.parseFloat(form.weightLb);
    if (Number.isNaN(w)) return;
    const inchesVal = form.inches.trim();
    const row = {
      id: editingId ?? newId(),
      date: form.date,
      weightLb: w,
      inches: inchesVal === "" ? undefined : Number.parseFloat(inchesVal),
      feeling: form.feeling,
      notes: form.notes.trim(),
    };
    if (editingId) {
      setProgress((list) => list.map((x) => (x.id === editingId ? row : x)));
      setEditingId(null);
    } else {
      addProgress(row);
    }
    setForm(emptyProgressForm());
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
          Weight Progress
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Weight journey
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Record a weigh-in (and optional inches) to see your change over time
          plus a short encouraging note.
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
          {editingId ? "Edit weigh-in" : "Log weigh-in"}
        </h2>
        {editingId ? (
          <p
            className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100"
            role="status"
          >
            <span className="font-semibold">Editing</span> — save to update this
            entry, or cancel to log a new weigh-in.
          </p>
        ) : null}
        <form className="mt-4 space-y-4" onSubmit={submitEntry}>
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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 sm:flex-1"
            >
              {editingId ? "Save changes" : "Save entry (local only)"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={cancelEdit}
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:w-auto sm:shrink-0 sm:px-5"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          History
        </h2>
        {sortedDesc.length === 0 ? (
          <p className="text-sm text-zinc-500">No weigh-ins yet.</p>
        ) : null}
        {sortedDesc.map((p) => (
          <Card
            key={p.id}
            className={
              editingId === p.id
                ? "ring-2 ring-teal-500 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950"
                : ""
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
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
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => beginEdit(p)}
                  className={btnEdit}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteProgress(p.id)}
                  className={btnDelete}
                >
                  Delete
                </button>
              </div>
            </div>
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
