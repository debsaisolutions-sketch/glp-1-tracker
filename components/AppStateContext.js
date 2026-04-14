"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { EMPTY_VIAL_SETTINGS } from "@/lib/mock-data";
import { isDataSetupComplete } from "@/lib/setup-status";
import { parseNumericAmount } from "@/lib/glp1-helpers";

function mergeVialFromStorage(raw) {
  const base = { ...EMPTY_VIAL_SETTINGS };
  if (!raw || typeof raw !== "object") return base;
  const merged = { ...base, ...raw };
  if (raw.setupMode === "advanced" || raw.setupMode === "simple") {
    merged.setupMode = raw.setupMode;
  } else {
    const hadAdvanced =
      parseNumericAmount(raw.totalMg) > 0 &&
      parseNumericAmount(raw.totalMl) > 0 &&
      parseNumericAmount(raw.unitsPerMl) > 0;
    merged.setupMode = hadAdvanced ? "advanced" : "simple";
  }
  if (merged.unitsPerMg == null || merged.unitsPerMg === "") {
    merged.unitsPerMg = 0;
  }
  const presetOk = ["10", "20", "5", "custom"].includes(
    String(merged.simpleStrengthPreset ?? ""),
  );
  if (!presetOk) {
    const upm = parseNumericAmount(merged.unitsPerMg);
    if (upm === 10) merged.simpleStrengthPreset = "10";
    else if (upm === 20) merged.simpleStrengthPreset = "20";
    else if (upm === 5) merged.simpleStrengthPreset = "5";
    else if (upm > 0) merged.simpleStrengthPreset = "custom";
    else merged.simpleStrengthPreset = null;
  }
  return merged;
}

const STORAGE_KEY = "glp1-tracker-state-v1";

function ensureEntryIds(entries, prefix) {
  if (!Array.isArray(entries)) return [];
  return entries.map((row, index) => {
    if (row && typeof row === "object" && row.id) return row;
    const base = row && typeof row === "object" ? row : {};
    return {
      ...base,
      id: `${prefix}-m${index}-${Math.random().toString(36).slice(2, 10)}`,
    };
  });
}

function readStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStorage(payload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);
  const [vial, setVialState] = useState(() => ({ ...EMPTY_VIAL_SETTINGS }));
  const [doses, setDosesState] = useState([]);
  const [progress, setProgressState] = useState([]);
  const [daily, setDailyState] = useState([]);
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);

  useEffect(() => {
    const saved = readStorage();
    if (saved && typeof saved === "object") {
      setVialState(mergeVialFromStorage(saved.vial));
      setDosesState(ensureEntryIds(saved.doses, "d"));
      setProgressState(ensureEntryIds(saved.progress, "p"));
      setDailyState(ensureEntryIds(saved.daily, "l"));
      setOnboardingCompleteState(!!saved.onboardingComplete);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage({
      vial,
      doses,
      progress,
      daily,
      onboardingComplete,
    });
  }, [hydrated, vial, doses, progress, daily, onboardingComplete]);

  useEffect(() => {
    if (!hydrated) return;
    if (isDataSetupComplete(vial, progress, doses)) {
      setOnboardingCompleteState(true);
    }
  }, [hydrated, vial, progress, doses]);

  const setVial = useCallback((next) => {
    setVialState((s) => (typeof next === "function" ? next(s) : next));
  }, []);

  const setDoses = useCallback((next) => {
    setDosesState((d) => (typeof next === "function" ? next(d) : next));
  }, []);

  const setProgress = useCallback((next) => {
    setProgressState((p) => (typeof next === "function" ? next(p) : next));
  }, []);

  const setDaily = useCallback((next) => {
    setDailyState((x) => (typeof next === "function" ? next(x) : next));
  }, []);

  const addDose = useCallback((row) => {
    setDosesState((d) => [row, ...d]);
  }, []);

  const addProgress = useCallback((row) => {
    setProgressState((p) => [row, ...p]);
  }, []);

  const addDaily = useCallback((row) => {
    setDailyState((x) => [row, ...x]);
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingCompleteState(true);
  }, []);

  const skipOnboarding = useCallback(() => {
    setOnboardingCompleteState(true);
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      vial,
      setVial,
      doses,
      setDoses,
      addDose,
      progress,
      setProgress,
      addProgress,
      daily,
      setDaily,
      addDaily,
      onboardingComplete,
      completeOnboarding,
      skipOnboarding,
    }),
    [
      hydrated,
      vial,
      setVial,
      doses,
      setDoses,
      addDose,
      progress,
      setProgress,
      addProgress,
      daily,
      setDaily,
      addDaily,
      onboardingComplete,
      completeOnboarding,
      skipOnboarding,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return ctx;
}
