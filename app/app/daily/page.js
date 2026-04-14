"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import { EmojiPicker } from "@/components/EmojiPicker";
import { useAppState } from "@/components/AppStateContext";
import { FEELING_EMOJIS } from "@/lib/constants";

function newId() {
  return `l-${Math.random().toString(36).slice(2, 10)}`;
}

function sortByDateDesc(items) {
  return [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

function emptyDailyForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    foodNotes: "",
    proteinGrams: "",
    waterOz: "",
    feeling: FEELING_EMOJIS[2],
    notes: "",
  };
}

const btnEdit =
  "touch-manipulation rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";
const btnDelete =
  "touch-manipulation rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 active:bg-red-100 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40";

export default function DailyPage() {
  const { daily: logs, addDaily, setDaily, hydrated } = useAppState();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyDailyForm);

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyDailyForm());
  }

  function beginEdit(log) {
    setEditingId(log.id);
    setForm({
      date: log.date,
      foodNotes: log.foodNotes ?? "",
      proteinGrams:
        log.proteinGrams != null && log.proteinGrams !== ""
          ? String(log.proteinGrams)
          : "",
      waterOz:
        log.waterOz != null && log.waterOz !== ""
          ? String(log.waterOz)
          : "",
      feeling: log.feeling || FEELING_EMOJIS[2],
      notes: log.notes ?? "",
    });
  }

  function confirmDeleteDaily(id) {
    if (
      !window.confirm(
        "Delete this daily log? This removes it from this device.",
      )
    ) {
      return;
    }
    setDaily((list) => list.filter((x) => x.id !== id));
    if (editingId === id) cancelEdit();
  }

  function submitLog(e) {
    e.preventDefault();
    const row = {
      id: editingId ?? newId(),
      date: form.date,
      foodNotes: form.foodNotes.trim(),
      proteinGrams: Number.parseFloat(form.proteinGrams) || 0,
      waterOz: Number.parseFloat(form.waterOz) || 0,
      feeling: form.feeling,
      notes: form.notes.trim(),
    };
    if (editingId) {
      setDaily((list) => list.map((x) => (x.id === editingId ? row : x)));
      setEditingId(null);
    } else {
      addDaily(row);
    }
    setForm(emptyDailyForm());
  }

  const sorted = sortByDateDesc(logs);

  if (!hydrated) {
    return (
      <div className="animate-pulse rounded-2xl bg-zinc-100 py-24 dark:bg-zinc-800" />
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Daily Log
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Food & fluids
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Jot today&apos;s meals, protein, water, and mood so you can spot
          patterns alongside your medication.
        </p>
      </header>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {editingId ? "Edit daily log" : "Add daily log"}
        </h2>
        {editingId ? (
          <p
            className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100"
            role="status"
          >
            <span className="font-semibold">Editing</span> — save to update this
            day, or cancel to add a new log instead.
          </p>
        ) : null}
        <form className="mt-4 space-y-4" onSubmit={submitLog}>
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
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Food notes
            </label>
            <textarea
              value={form.foodNotes}
              onChange={(e) =>
                setForm((f) => ({ ...f, foodNotes: e.target.value }))
              }
              rows={3}
              placeholder="Meals, snacks, cravings…"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Protein (g)
              </label>
              <input
                inputMode="decimal"
                value={form.proteinGrams}
                onChange={(e) =>
                  setForm((f) => ({ ...f, proteinGrams: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Water (oz)
              </label>
              <input
                inputMode="decimal"
                value={form.waterOz}
                onChange={(e) =>
                  setForm((f) => ({ ...f, waterOz: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
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
              {editingId ? "Save changes" : "Save log (local only)"}
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
          Recent days
        </h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-zinc-500">No daily logs yet.</p>
        ) : null}
        {sorted.map((log) => (
          <Card
            key={log.id}
            className={
              editingId === log.id
                ? "ring-2 ring-teal-500 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950"
                : ""
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {log.date}{" "}
                  <span className="text-base" aria-hidden>
                    {log.feeling}
                  </span>
                </p>
                <p className="text-xs text-zinc-500">
                  Protein {log.proteinGrams} g · Water {log.waterOz} oz
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => beginEdit(log)}
                  className={btnEdit}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteDaily(log.id)}
                  className={btnDelete}
                >
                  Delete
                </button>
              </div>
            </div>
            {log.foodNotes ? (
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                {log.foodNotes}
              </p>
            ) : null}
            {log.notes ? (
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {log.notes}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
