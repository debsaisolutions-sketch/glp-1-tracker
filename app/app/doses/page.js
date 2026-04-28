"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import { EmojiPicker } from "@/components/EmojiPicker";
import { useAppState } from "@/components/AppStateContext";
import {
  DOSE_TYPES,
  FEELING_EMOJIS,
  SIDE_EFFECT_OPTIONS,
} from "@/lib/constants";
import {
  getMgPerUnitFromVial,
  parseNumericAmount,
  unitsToMg,
  weeklyDoseTotalMg,
} from "@/lib/glp1-helpers";

function newId() {
  return `d-${Math.random().toString(36).slice(2, 10)}`;
}

function sortByDateDesc(items) {
  return [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

function formatDoseTime(timeText) {
  const raw = String(timeText || "").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const hour24 = Number.parseInt(match[1], 10);
  const minute = match[2];
  if (!Number.isFinite(hour24) || hour24 < 0 || hour24 > 23) return "";
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${suffix}`;
}

function emptyDoseForm() {
  const now = new Date();
  const localTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
  return {
    date: now.toISOString().slice(0, 10),
    doseTime: localTime,
    units: 50,
    doseType: "full",
    feeling: FEELING_EMOJIS[1],
    sideEffects: [],
    notes: "",
  };
}

const btnEdit =
  "touch-manipulation rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";
const btnDelete =
  "touch-manipulation rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 active:bg-red-100 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40";

export default function DosesPage() {
  const { vial, doses, addDose, setDoses, hydrated } = useAppState();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyDoseForm);

  const mgPerUnit = getMgPerUnitFromVial(vial);

  const previewMg = unitsToMg(parseNumericAmount(form.units) || 0, mgPerUnit);
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

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyDoseForm());
  }

  function beginEdit(d) {
    setEditingId(d.id);
    setForm({
      date: d.date,
      doseTime: d.doseTime || "",
      units: d.units,
      doseType: d.doseType || "full",
      feeling: d.feeling || FEELING_EMOJIS[1],
      sideEffects: Array.isArray(d.sideEffects) ? [...d.sideEffects] : [],
      notes: d.notes ?? "",
    });
  }

  function confirmDeleteDose(id) {
    if (
      !window.confirm(
        "Delete this dose? This removes it from your log on this device.",
      )
    ) {
      return;
    }
    setDoses((list) => list.filter((x) => x.id !== id));
    if (editingId === id) cancelEdit();
  }

  function submitDose(e) {
    e.preventDefault();
    const units = parseNumericAmount(form.units) || 0;
    const mg = unitsToMg(units, mgPerUnit);
    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const row = {
      id: editingId ?? newId(),
      date: form.date,
      doseTime: String(form.doseTime || "").trim(),
      timezone,
      units,
      mg: Math.round(mg * 1000) / 1000,
      doseType: form.doseType,
      feeling: form.feeling,
      sideEffects: form.sideEffects,
      notes: form.notes.trim(),
    };
    if (editingId) {
      setDoses((list) => list.map((x) => (x.id === editingId ? row : x)));
      setEditingId(null);
    } else {
      addDose(row);
    }
    setForm(emptyDoseForm());
  }

  const sorted = sortByDateDesc(doses);

  if (!hydrated) {
    return (
      <div className="animate-pulse rounded-2xl bg-zinc-100 py-24 dark:bg-zinc-800" />
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Log Dose
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Injections
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Add each shot with units and how you felt—we&apos;ll show mg and your
          weekly total.
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
          {editingId ? "Edit dose" : "Log a dose"}
        </h2>
        {editingId ? (
          <p
            className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100"
            role="status"
          >
            <span className="font-semibold">Editing</span> — your changes
            replace this entry when you save. Or cancel to go back to a new
            entry.
          </p>
        ) : null}
        <form className="mt-4 space-y-4" onSubmit={submitDose}>
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
              Dose time
            </label>
            <input
              type="time"
              value={form.doseTime || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, doseTime: e.target.value }))
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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 sm:flex-1"
            >
              {editingId ? "Save changes" : "Add dose (local only)"}
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
          Recent doses
        </h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-zinc-500">No doses logged yet.</p>
        ) : null}
        {sorted.map((d) => (
          <Card
            key={d.id}
            className={
              editingId === d.id
                ? "ring-2 ring-teal-500 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950"
                : ""
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {d.mg} mg · {d.units} units
                </p>
                <p className="text-xs text-zinc-500">
                  {d.date}
                  {formatDoseTime(d.doseTime)
                    ? ` · ${formatDoseTime(d.doseTime)}`
                    : ""}
                  {" · "}
                  {d.doseType} · {d.feeling}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => beginEdit(d)}
                  className={btnEdit}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeleteDose(d.id)}
                  className={btnDelete}
                >
                  Delete
                </button>
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
