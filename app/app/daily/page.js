"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { EmojiPicker } from "@/components/EmojiPicker";
import { useAppState } from "@/components/AppStateContext";
import { FEELING_EMOJIS } from "@/lib/constants";
import { estimateFoodMacros } from "@/lib/nutrition-estimator";

function newId() {
  return `l-${Math.random().toString(36).slice(2, 10)}`;
}

function sortByDateDesc(items) {
  return [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

function emptyFoodDraft() {
  return {
    foodNotes: "",
    foodType: "",
    amountValue: "",
    amountUnit: "oz",
    amountRaw: "",
    estimatedProtein: "",
    estimatedCarbs: "",
    estimatedFat: "",
    estimatedCalories: "",
    proteinGrams: "",
  };
}

function buildAmountText(draft) {
  const value = String(draft?.amountValue || "").trim();
  const unit = String(draft?.amountUnit || "oz").trim();
  const raw = String(draft?.amountRaw || "").trim();

  if (value && unit && unit !== "half") return `${value} ${unit}`;
  if (unit === "half") return value ? `${value} half` : "half";
  return raw;
}

function parseAmountParts(amountText) {
  const raw = String(amountText || "").trim();
  if (!raw) {
    return { amountValue: "", amountUnit: "oz", amountRaw: "" };
  }

  const normalized = raw.toLowerCase().replace(/\s+/g, " ");
  if (normalized === "half") {
    return { amountValue: "", amountUnit: "half", amountRaw: raw };
  }

  const unitsPattern = "(oz|grams|eggs|strips|scoop|cup|tbsp|whole|half)";
  const match = normalized.match(
    new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*${unitsPattern}$`),
  );
  if (match) {
    return {
      amountValue: match[1],
      amountUnit: match[2],
      amountRaw: raw,
    };
  }

  return { amountValue: "", amountUnit: "oz", amountRaw: raw };
}

const btnDelete =
  "touch-manipulation rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 active:bg-red-100 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40";
const btnEdit =
  "touch-manipulation rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

export default function DailyPage() {
  const { daily: logs, addDaily, setDaily, hydrated } = useAppState();
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [foodDraft, setFoodDraft] = useState(emptyFoodDraft);
  const [editingFoodItemId, setEditingFoodItemId] = useState(null);
  const [selectedFoodItems, setSelectedFoodItems] = useState([]);
  const [waterOz, setWaterOz] = useState("");
  const [feeling, setFeeling] = useState(FEELING_EMOJIS[2]);
  const [notes, setNotes] = useState("");
  const [foodFormError, setFoodFormError] = useState("");
  const [foodEstimateMessage, setFoodEstimateMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  function normalizeFoodItem(raw, idx = 0) {
    return {
      id:
        raw && typeof raw === "object" && raw.id
          ? String(raw.id)
          : `fi-${idx}-${Math.random().toString(36).slice(2, 8)}`,
      foodType: String(raw?.foodType || "").trim(),
      amount: String(raw?.amount || "").trim(),
      foodNotes: String(raw?.foodNotes || "").trim(),
      estimatedProtein: Number.parseFloat(raw?.estimatedProtein) || 0,
      estimatedCarbs: Number.parseFloat(raw?.estimatedCarbs) || 0,
      estimatedFat: Number.parseFloat(raw?.estimatedFat) || 0,
      estimatedCalories: Number.parseFloat(raw?.estimatedCalories) || 0,
      proteinGrams: Number.parseFloat(raw?.proteinGrams) || 0,
    };
  }

  function hasFoodFields(item) {
    return (
      String(item?.foodType || "").trim() !== "" ||
      String(item?.amount || "").trim() !== "" ||
      String(item?.foodNotes || "").trim() !== "" ||
      (Number.parseFloat(item?.estimatedProtein) || 0) > 0 ||
      (Number.parseFloat(item?.estimatedCarbs) || 0) > 0 ||
      (Number.parseFloat(item?.estimatedFat) || 0) > 0 ||
      (Number.parseFloat(item?.estimatedCalories) || 0) > 0 ||
      (Number.parseFloat(item?.proteinGrams) || 0) > 0
    );
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
  }

  const selectedDateRows = useMemo(
    () => sortByDateDesc(logs.filter((log) => log.date === selectedDate)),
    [logs, selectedDate],
  );

  useEffect(() => {
    const mergedItems = selectedDateRows.flatMap((row, rowIndex) => {
      if (Array.isArray(row.foodItems) && row.foodItems.length > 0) {
        return row.foodItems.map((item, itemIndex) =>
          normalizeFoodItem(
            item,
            rowIndex * 1000 + itemIndex,
          ),
        );
      }
      const legacyItem = normalizeFoodItem(
        {
          id: `${row.id}-legacy`,
          foodType: row.foodType,
          amount: row.amount,
          foodNotes: row.foodNotes,
          estimatedProtein: row.estimatedProtein,
          estimatedCarbs: row.estimatedCarbs,
          estimatedFat: row.estimatedFat,
          estimatedCalories: row.estimatedCalories,
          proteinGrams: row.proteinGrams,
        },
        rowIndex,
      );
      return hasFoodFields(legacyItem) ? [legacyItem] : [];
    });

    setSelectedFoodItems(mergedItems);
    setWaterOz(String(selectedDateRows[0]?.waterOz ?? ""));
    setFeeling(selectedDateRows[0]?.feeling || FEELING_EMOJIS[2]);
    setNotes(selectedDateRows[0]?.notes || "");
    setFoodDraft(emptyFoodDraft());
    setEditingFoodItemId(null);
    setFoodFormError("");
    setFoodEstimateMessage("");
  }, [selectedDateRows]);

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timer = setTimeout(() => {
      setSaveStatus("");
    }, 2500);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  function submitFoodItem(e) {
    e.preventDefault();
    setFoodFormError("");
    setFoodEstimateMessage("");
    setSaveStatus("");
    const amount = buildAmountText(foodDraft);
    const nextItem = normalizeFoodItem(
      { ...foodDraft, amount },
      selectedFoodItems.length,
    );
    if (!hasFoodFields(nextItem)) {
      setFoodFormError("Add a food, amount, note, or nutrition estimate first.");
      return;
    }
    if (editingFoodItemId) {
      setSelectedFoodItems((items) =>
        items.map((item) => (item.id === editingFoodItemId ? nextItem : item)),
      );
      setEditingFoodItemId(null);
    } else {
      setSelectedFoodItems((items) => [...items, nextItem]);
    }
    setFoodDraft(emptyFoodDraft());
  }

  function startEditFoodItem(item) {
    setSaveStatus("");
    setFoodFormError("");
    setFoodEstimateMessage("");
    setEditingFoodItemId(item.id);
    setFoodDraft({
      foodType: item.foodType || "",
      ...parseAmountParts(item.amount),
      foodNotes: item.foodNotes || "",
      estimatedProtein:
        item.estimatedProtein != null && item.estimatedProtein !== ""
          ? String(item.estimatedProtein)
          : "",
      estimatedCarbs:
        item.estimatedCarbs != null && item.estimatedCarbs !== ""
          ? String(item.estimatedCarbs)
          : "",
      estimatedFat:
        item.estimatedFat != null && item.estimatedFat !== ""
          ? String(item.estimatedFat)
          : "",
      estimatedCalories:
        item.estimatedCalories != null && item.estimatedCalories !== ""
          ? String(item.estimatedCalories)
          : "",
      proteinGrams:
        item.proteinGrams != null && item.proteinGrams !== ""
          ? String(item.proteinGrams)
          : "",
    });
  }

  function cancelEditFoodItem() {
    setEditingFoodItemId(null);
    setFoodFormError("");
    setFoodEstimateMessage("");
    setFoodDraft(emptyFoodDraft());
  }

  function onEstimateMacros() {
    setFoodFormError("");
    setSaveStatus("");
    const foodType = String(foodDraft.foodType || "").trim();
    const amount = buildAmountText(foodDraft);
    if (!foodType || !amount) {
      setFoodEstimateMessage("Enter a food and amount first.");
      return;
    }

    const estimate = estimateFoodMacros(foodType, amount);
    if (!estimate) {
      setFoodEstimateMessage(
        "Could not estimate that food yet. Enter macros manually.",
      );
      return;
    }

    setFoodDraft((f) => ({
      ...f,
      estimatedProtein: String(estimate.protein),
      estimatedCarbs: String(estimate.carbs),
      estimatedFat: String(estimate.fat),
      estimatedCalories: String(estimate.calories),
    }));
    setFoodEstimateMessage("Estimated macros added (approximate).");
  }

  function removeFoodItem(id) {
    setSaveStatus("");
    setSelectedFoodItems((items) => items.filter((item) => item.id !== id));
    if (editingFoodItemId === id) {
      cancelEditFoodItem();
    }
  }

  function submitDailyLog() {
    setFoodFormError("");
    const firstItem = selectedFoodItems[0] || null;
    const primaryId = selectedDateRows[0]?.id || newId();

    const row = {
      id: primaryId,
      date: selectedDate,
      foodItems: selectedFoodItems.map((item, index) => normalizeFoodItem(item, index)),
      // Legacy scalar fields remain populated from first item for compatibility.
      foodType: firstItem?.foodType || "",
      amount: firstItem?.amount || "",
      foodNotes: firstItem?.foodNotes || "",
      estimatedProtein: firstItem?.estimatedProtein || 0,
      estimatedCarbs: firstItem?.estimatedCarbs || 0,
      estimatedFat: firstItem?.estimatedFat || 0,
      estimatedCalories: firstItem?.estimatedCalories || 0,
      proteinGrams: firstItem?.proteinGrams || 0,
      waterOz: Number.parseFloat(waterOz) || 0,
      feeling,
      notes: notes.trim(),
    };
    setDaily((list) => [row, ...list.filter((entry) => entry.date !== selectedDate)]);
    setSaveStatus("saved");
  }

  const sorted = sortByDateDesc(logs);
  const nonSelectedLogs = sorted.filter((log) => log.date !== selectedDate);
  const waterToday = Math.max(0, Number.parseFloat(waterOz) || 0);
  const selectedTotals = selectedFoodItems.reduce(
    (totals, item) => ({
      protein:
        totals.protein +
        ((Number.parseFloat(item.estimatedProtein) || 0) > 0
          ? Number.parseFloat(item.estimatedProtein) || 0
          : Number.parseFloat(item.proteinGrams) || 0),
      carbs: totals.carbs + (Number.parseFloat(item.estimatedCarbs) || 0),
      fat: totals.fat + (Number.parseFloat(item.estimatedFat) || 0),
      calories: totals.calories + (Number.parseFloat(item.estimatedCalories) || 0),
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 },
  );

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
          Selected date
        </h2>
        <div className="mt-3">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSaveStatus("");
              setSelectedDate(e.target.value);
            }}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Selected day totals
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {selectedDate || "No date selected"}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
            <p className="text-xs text-zinc-500">Protein</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {selectedTotals.protein.toFixed(1)} g
            </p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
            <p className="text-xs text-zinc-500">Carbs</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {selectedTotals.carbs.toFixed(1)} g
            </p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
            <p className="text-xs text-zinc-500">Fat</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {selectedTotals.fat.toFixed(1)} g
            </p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
            <p className="text-xs text-zinc-500">Calories</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {selectedTotals.calories.toFixed(0)}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Add food item
        </h2>
        <form className="mt-4 space-y-4" onSubmit={submitFoodItem}>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Food notes
            </label>
            <textarea
              value={foodDraft.foodNotes}
              onChange={(e) =>
                setFoodDraft((f) => {
                  setSaveStatus("");
                  setFoodEstimateMessage("");
                  return { ...f, foodNotes: e.target.value };
                })
              }
              rows={3}
              placeholder="Meals, snacks, cravings…"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Food type
              </label>
              <input
                value={foodDraft.foodType}
                onChange={(e) =>
                  setFoodDraft((f) => {
                    setSaveStatus("");
                    setFoodEstimateMessage("");
                    return { ...f, foodType: e.target.value };
                  })
                }
                placeholder="e.g. Chicken breast"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Amount
              </label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <input
                  inputMode="decimal"
                  value={foodDraft.amountValue}
                  onChange={(e) =>
                    setFoodDraft((f) => {
                      setSaveStatus("");
                      setFoodEstimateMessage("");
                      return { ...f, amountValue: e.target.value };
                    })
                  }
                  placeholder="e.g. 4.4"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
                <select
                  value={foodDraft.amountUnit}
                  onChange={(e) =>
                    setFoodDraft((f) => {
                      setSaveStatus("");
                      setFoodEstimateMessage("");
                      return { ...f, amountUnit: e.target.value };
                    })
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="oz">oz</option>
                  <option value="grams">grams</option>
                  <option value="eggs">eggs</option>
                  <option value="strips">strips</option>
                  <option value="scoop">scoop</option>
                  <option value="cup">cup</option>
                  <option value="tbsp">tbsp</option>
                  <option value="whole">whole</option>
                  <option value="half">half</option>
                </select>
              </div>
              <input
                value={foodDraft.amountRaw}
                onChange={(e) =>
                  setFoodDraft((f) => {
                    setSaveStatus("");
                    setFoodEstimateMessage("");
                    return { ...f, amountRaw: e.target.value };
                  })
                }
                placeholder="Amount text fallback (optional)"
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Est. protein (g)
              </label>
              <input
                inputMode="decimal"
                value={foodDraft.estimatedProtein}
                onChange={(e) =>
                  setFoodDraft((f) => {
                    setSaveStatus("");
                    setFoodEstimateMessage("");
                    return { ...f, estimatedProtein: e.target.value };
                  })
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Est. carbs (g)
              </label>
              <input
                inputMode="decimal"
                value={foodDraft.estimatedCarbs}
                onChange={(e) =>
                  setFoodDraft((f) => {
                    setSaveStatus("");
                    setFoodEstimateMessage("");
                    return { ...f, estimatedCarbs: e.target.value };
                  })
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Est. fat (g)
              </label>
              <input
                inputMode="decimal"
                value={foodDraft.estimatedFat}
                onChange={(e) =>
                  setFoodDraft((f) => {
                    setSaveStatus("");
                    setFoodEstimateMessage("");
                    return { ...f, estimatedFat: e.target.value };
                  })
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Est. calories
              </label>
              <input
                inputMode="decimal"
                value={foodDraft.estimatedCalories}
                onChange={(e) =>
                  setFoodDraft((f) => {
                    setSaveStatus("");
                    setFoodEstimateMessage("");
                    return { ...f, estimatedCalories: e.target.value };
                  })
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Protein (g)
              </label>
              <input
                inputMode="decimal"
                value={foodDraft.proteinGrams}
                onChange={(e) =>
                  setFoodDraft((f) => {
                    setSaveStatus("");
                    setFoodEstimateMessage("");
                    return { ...f, proteinGrams: e.target.value };
                  })
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onEstimateMacros}
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:w-auto sm:shrink-0 sm:px-5"
            >
              Estimate macros
            </button>
            <button
              type="submit"
              className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 sm:flex-1"
            >
              {editingFoodItemId ? "Save food item changes" : "Add food item"}
            </button>
            {editingFoodItemId ? (
              <button
                type="button"
                onClick={cancelEditFoodItem}
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:w-auto sm:shrink-0 sm:px-5"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
          {foodFormError ? (
            <p className="text-xs text-rose-700 dark:text-rose-300" role="alert">
              {foodFormError}
            </p>
          ) : null}
          {foodEstimateMessage ? (
            <p className="text-xs text-zinc-600 dark:text-zinc-300" role="status">
              {foodEstimateMessage}
            </p>
          ) : null}
        </form>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Daily check-in
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Save hydration, mood, and optional notes for the selected day.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Water (oz)
            </label>
            <input
              inputMode="decimal"
              value={waterOz}
              onChange={(e) => {
                setSaveStatus("");
                setWaterOz(e.target.value);
              }}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Water today: {waterToday} oz
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <button
                type="button"
                onClick={() =>
                  setWaterOz((x) => {
                    setSaveStatus("");
                    return String((Number.parseFloat(x) || 0) + 8);
                  })
                }
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                +8 oz
              </button>
              <button
                type="button"
                onClick={() =>
                  setWaterOz((x) => {
                    setSaveStatus("");
                    return String((Number.parseFloat(x) || 0) + 16);
                  })
                }
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                +16 oz
              </button>
              <button
                type="button"
                onClick={() =>
                  setWaterOz((x) => {
                    setSaveStatus("");
                    return String((Number.parseFloat(x) || 0) + 24);
                  })
                }
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                +24 oz
              </button>
              <button
                type="button"
                onClick={() =>
                  setWaterOz((x) => {
                    setSaveStatus("");
                    return String((Number.parseFloat(x) || 0) + 32);
                  })
                }
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                +32 oz
              </button>
              <button
                type="button"
                onClick={() =>
                  setWaterOz((x) => {
                    setSaveStatus("");
                    return String(Math.max(0, (Number.parseFloat(x) || 0) - 8));
                  })
                }
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                -8 oz
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setSaveStatus("");
                setWaterOz("0");
              }}
              className="mt-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Reset water
            </button>
          </div>

          <EmojiPicker
            value={feeling}
            onChange={(emoji) => {
              setSaveStatus("");
              setFeeling(emoji);
            }}
          />

          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                setSaveStatus("");
                setNotes(e.target.value);
              }}
              rows={2}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Food entries for selected day
        </h2>
        {selectedFoodItems.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No food entries saved for {selectedDate}.
          </p>
        ) : null}
        {selectedFoodItems.map((item) => (
          <Card
            key={item.id}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {item.foodType || "Food item"}
                </p>
                {item.amount ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    {item.amount}
                  </p>
                ) : null}
                {(Number.parseFloat(item.estimatedProtein) > 0 ||
                  Number.parseFloat(item.estimatedCarbs) > 0 ||
                  Number.parseFloat(item.estimatedFat) > 0 ||
                  Number.parseFloat(item.estimatedCalories) > 0) ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    Est. P {Number.parseFloat(item.estimatedProtein) || 0}g · C{" "}
                    {Number.parseFloat(item.estimatedCarbs) || 0}g · F{" "}
                    {Number.parseFloat(item.estimatedFat) || 0}g ·{" "}
                    {Number.parseFloat(item.estimatedCalories) || 0} cal
                  </p>
                ) : null}
                {(Number.parseFloat(item.proteinGrams) || 0) > 0 ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    Protein {Number.parseFloat(item.proteinGrams) || 0} g
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => startEditFoodItem(item)}
                  className={btnEdit}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeFoodItem(item.id)}
                  className={btnDelete}
                >
                  Remove
                </button>
              </div>
            </div>
            {item.foodNotes ? (
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                {item.foodNotes}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Daily check-in for selected day
        </h2>
        <div className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              Water:
            </span>{" "}
            {waterToday} oz
          </p>
          <p>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              Feeling:
            </span>{" "}
            <span aria-label="selected feeling">{feeling}</span>
          </p>
          {notes.trim() ? (
            <p className="leading-relaxed">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                Notes:
              </span>{" "}
              {notes.trim()}
            </p>
          ) : null}
        </div>
      </Card>
      <button
        type="button"
        onClick={submitDailyLog}
        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700"
      >
        Save / update daily log
      </button>
      {saveStatus === "saved" ? (
        <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
          Daily log saved.
        </p>
      ) : null}
      <div className="space-y-2 pt-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Other recent days
        </h2>
        {nonSelectedLogs.length === 0 ? (
          <p className="text-xs text-zinc-500">
            All visible entries are for the selected date.
          </p>
        ) : (
          <p className="text-xs text-zinc-500">
            {nonSelectedLogs.length} item
            {nonSelectedLogs.length === 1 ? "" : "s"} saved outside{" "}
            {selectedDate}.
          </p>
        )}
      </div>
    </div>
  );
}
