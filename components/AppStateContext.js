"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useState,
} from "react";
import { PRIMARY_GOAL_OPTIONS } from "@/lib/constants";
import { EMPTY_SHAKE_NUTRITION_PREFS, EMPTY_VIAL_SETTINGS } from "@/lib/mock-data";
import { isDataSetupComplete } from "@/lib/setup-status";
import { parseNumericAmount } from "@/lib/glp1-helpers";
import { supabase } from "@/lib/supabaseClient";

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

const PRIMARY_GOAL_IDS = new Set(PRIMARY_GOAL_OPTIONS.map((o) => o.id));

function normalizePrimaryGoal(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw);
  return PRIMARY_GOAL_IDS.has(s) ? s : null;
}

function normalizeGoalWeight(raw) {
  if (raw == null || raw === "") return null;
  const value = parseNumericAmount(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function readGoalWeightFromProfile(profile) {
  if (!profile || typeof profile !== "object") return null;
  const candidates = [
    profile.goal_weight_lb,
    profile.goal_weight,
    profile.target_weight_lb,
    profile.target_weight,
    profile.goalWeight,
    profile.goalWeightLb,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeGoalWeight(candidate);
    if (normalized != null) return normalized;
  }
  return null;
}

function mergeShakeNutritionPrefs(raw) {
  const base = { ...EMPTY_SHAKE_NUTRITION_PREFS };
  if (!raw || typeof raw !== "object") return base;
  return {
    proteinPerScoop: Math.max(
      0,
      parseNumericAmount(raw.proteinPerScoop) || 0,
    ),
    carbsPerScoop: Math.max(0, parseNumericAmount(raw.carbsPerScoop) || 0),
  };
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

function buildDefaultSnapshot() {
  return {
    vial: { ...EMPTY_VIAL_SETTINGS },
    doses: [],
    progress: [],
    daily: [],
    shakeNutritionPrefs: { ...EMPTY_SHAKE_NUTRITION_PREFS },
    primaryGoal: null,
    goalWeight: null,
    onboardingComplete: false,
  };
}

function buildLocalSnapshot() {
  const defaults = buildDefaultSnapshot();
  const saved = readStorage();
  if (!saved || typeof saved !== "object") return defaults;

  return {
    vial: mergeVialFromStorage(saved.vial),
    doses: ensureEntryIds(saved.doses, "d"),
    progress: ensureEntryIds(saved.progress, "p"),
    daily: ensureEntryIds(saved.daily, "l"),
    shakeNutritionPrefs: mergeShakeNutritionPrefs(saved.shakeNutritionPrefs),
    primaryGoal: normalizePrimaryGoal(saved.primaryGoal),
    goalWeight: normalizeGoalWeight(saved.goalWeight ?? saved.goalWeightLb),
    onboardingComplete: !!saved.onboardingComplete,
  };
}

function mapDoseFromDb(row) {
  return {
    id: row.entry_id,
    date: row.date,
    doseTime: row.dose_time || "",
    timezone: row.timezone || "",
    units: parseNumericAmount(row.units) || 0,
    mg: parseNumericAmount(row.mg) || 0,
    doseType: row.dose_type || "full",
    feeling: row.feeling || "",
    sideEffects: Array.isArray(row.side_effects) ? row.side_effects : [],
    notes: row.notes || "",
  };
}

function mapProgressFromDb(row) {
  const inches = parseNumericAmount(row.inches);
  return {
    id: row.entry_id,
    date: row.date,
    weightLb: parseNumericAmount(row.weight_lb) || 0,
    inches: Number.isFinite(inches) ? inches : undefined,
    feeling: row.feeling || "",
    notes: row.notes || "",
  };
}

function mapDailyFromDb(row) {
  const normalizeFoodItem = (item, index) => ({
    id:
      item && typeof item === "object" && item.id
        ? String(item.id)
        : `fi-${index}-${Math.random().toString(36).slice(2, 8)}`,
    foodType: item?.foodType || item?.food_type || "",
    amount: item?.amount || "",
    foodNotes: item?.foodNotes || item?.food_notes || "",
    estimatedProtein: parseNumericAmount(
      item?.estimatedProtein ?? item?.estimated_protein,
    ) || 0,
    estimatedCarbs: parseNumericAmount(item?.estimatedCarbs ?? item?.estimated_carbs) || 0,
    estimatedFat: parseNumericAmount(item?.estimatedFat ?? item?.estimated_fat) || 0,
    estimatedCalories:
      parseNumericAmount(item?.estimatedCalories ?? item?.estimated_calories) || 0,
    proteinGrams: parseNumericAmount(item?.proteinGrams ?? item?.protein_grams) || 0,
  });

  const hasLegacyFood =
    (row.food_type && String(row.food_type).trim() !== "") ||
    (row.amount && String(row.amount).trim() !== "") ||
    (row.food_notes && String(row.food_notes).trim() !== "") ||
    (parseNumericAmount(row.estimated_protein) || 0) > 0 ||
    (parseNumericAmount(row.estimated_carbs) || 0) > 0 ||
    (parseNumericAmount(row.estimated_fat) || 0) > 0 ||
    (parseNumericAmount(row.estimated_calories) || 0) > 0 ||
    (parseNumericAmount(row.protein_grams) || 0) > 0;

  const fromJsonb = Array.isArray(row.food_items)
    ? row.food_items.map(normalizeFoodItem).filter(Boolean)
    : [];
  const foodItems =
    fromJsonb.length > 0
      ? fromJsonb
      : hasLegacyFood
        ? [
            normalizeFoodItem(
              {
                id: `${row.entry_id}-legacy`,
                foodType: row.food_type,
                amount: row.amount,
                foodNotes: row.food_notes,
                estimatedProtein: row.estimated_protein,
                estimatedCarbs: row.estimated_carbs,
                estimatedFat: row.estimated_fat,
                estimatedCalories: row.estimated_calories,
                proteinGrams: row.protein_grams,
              },
              0,
            ),
          ]
        : [];

  return {
    id: row.entry_id,
    date: row.date,
    foodItems,
    foodNotes: row.food_notes || "",
    foodType: row.food_type || "",
    amount: row.amount || "",
    estimatedProtein: parseNumericAmount(row.estimated_protein) || 0,
    estimatedCarbs: parseNumericAmount(row.estimated_carbs) || 0,
    estimatedFat: parseNumericAmount(row.estimated_fat) || 0,
    estimatedCalories: parseNumericAmount(row.estimated_calories) || 0,
    proteinGrams: parseNumericAmount(row.protein_grams) || 0,
    waterOz: parseNumericAmount(row.water_oz) || 0,
    feeling: row.feeling || "",
    notes: row.notes || "",
  };
}

async function loadSupabaseSnapshot(userId) {
  if (!supabase || !userId) return null;

  const [
    profileResult,
    medicationResult,
    shakeResult,
    dosesResult,
    progressResult,
    dailyResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("medication_settings")
      .select(
        "medication_type,custom_name,setup_mode,units_per_mg,simple_strength_preset,total_mg,total_ml,units_per_ml",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("shake_preferences")
      .select("protein_per_scoop,carbs_per_scoop")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("dose_logs")
      .select(
        "entry_id,date,dose_time,timezone,units,mg,dose_type,feeling,side_effects,notes,created_at",
      )
      .eq("user_id", userId),
    supabase
      .from("progress_logs")
      .select("entry_id,date,weight_lb,inches,feeling,notes,created_at")
      .eq("user_id", userId),
    supabase
      .from("daily_logs")
      .select(
        "entry_id,date,food_items,food_notes,food_type,amount,estimated_protein,estimated_carbs,estimated_fat,estimated_calories,protein_grams,water_oz,feeling,notes,created_at",
      )
      .eq("user_id", userId),
  ]);

  const errors = [
    profileResult.error,
    medicationResult.error,
    shakeResult.error,
    dosesResult.error,
    progressResult.error,
    dailyResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw errors[0];
  }

  return {
    vial: mergeVialFromStorage(
      medicationResult.data
        ? {
            medicationType: medicationResult.data.medication_type,
            customName: medicationResult.data.custom_name,
            setupMode: medicationResult.data.setup_mode,
            unitsPerMg: medicationResult.data.units_per_mg,
            simpleStrengthPreset: medicationResult.data.simple_strength_preset,
            totalMg: medicationResult.data.total_mg,
            totalMl: medicationResult.data.total_ml,
            unitsPerMl: medicationResult.data.units_per_ml,
          }
        : null,
    ),
    doses: ensureEntryIds((dosesResult.data || []).map(mapDoseFromDb), "d"),
    progress: ensureEntryIds(
      (progressResult.data || []).map(mapProgressFromDb),
      "p",
    ),
    daily: ensureEntryIds((dailyResult.data || []).map(mapDailyFromDb), "l"),
    shakeNutritionPrefs: mergeShakeNutritionPrefs(
      shakeResult.data
        ? {
            proteinPerScoop: shakeResult.data.protein_per_scoop,
            carbsPerScoop: shakeResult.data.carbs_per_scoop,
          }
        : null,
    ),
    primaryGoal: normalizePrimaryGoal(profileResult.data?.primary_goal),
    goalWeight: readGoalWeightFromProfile(profileResult.data),
    onboardingComplete: !!profileResult.data?.onboarding_complete,
  };
}

async function replaceUserRows(tableName, userId, rows) {
  if (!supabase) return;

  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .eq("user_id", userId);
  if (deleteError) throw deleteError;

  if (rows.length === 0) return;

  const { error: insertError } = await supabase.from(tableName).insert(rows);
  if (insertError) throw insertError;
}

async function syncSnapshotToSupabase(userId, snapshot) {
  if (!supabase || !userId) return;

  const profileBase = {
    user_id: userId,
    primary_goal: snapshot.primaryGoal,
    onboarding_complete: !!snapshot.onboardingComplete,
  };
  const profilePayloads = [
    { ...profileBase, goal_weight_lb: snapshot.goalWeight },
    { ...profileBase, goal_weight: snapshot.goalWeight },
    profileBase,
  ];
  let profileError = null;
  for (const payload of profilePayloads) {
    const result = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" });
    if (!result.error) {
      profileError = null;
      break;
    }
    profileError = result.error;
  }
  if (profileError) throw profileError;

  const { error: medicationError } = await supabase
    .from("medication_settings")
    .upsert(
      {
        user_id: userId,
        medication_type: snapshot.vial.medicationType,
        custom_name: snapshot.vial.customName || "",
        setup_mode: snapshot.vial.setupMode || "simple",
        units_per_mg: parseNumericAmount(snapshot.vial.unitsPerMg) || 0,
        simple_strength_preset: snapshot.vial.simpleStrengthPreset || null,
        total_mg: parseNumericAmount(snapshot.vial.totalMg) || 0,
        total_ml: parseNumericAmount(snapshot.vial.totalMl) || 0,
        units_per_ml: parseNumericAmount(snapshot.vial.unitsPerMl) || 0,
      },
      { onConflict: "user_id" },
    );
  if (medicationError) throw medicationError;

  const { error: shakeError } = await supabase.from("shake_preferences").upsert(
    {
      user_id: userId,
      protein_per_scoop:
        parseNumericAmount(snapshot.shakeNutritionPrefs.proteinPerScoop) || 0,
      carbs_per_scoop:
        parseNumericAmount(snapshot.shakeNutritionPrefs.carbsPerScoop) || 0,
    },
    { onConflict: "user_id" },
  );
  if (shakeError) throw shakeError;

  await replaceUserRows(
    "dose_logs",
    userId,
    snapshot.doses.map((row) => ({
      user_id: userId,
      entry_id: row.id,
      date: row.date,
      dose_time: row.doseTime || "",
      timezone: row.timezone || "",
      units: parseNumericAmount(row.units) || 0,
      mg: parseNumericAmount(row.mg) || 0,
      dose_type: row.doseType || "full",
      feeling: row.feeling || "",
      side_effects: Array.isArray(row.sideEffects) ? row.sideEffects : [],
      notes: row.notes || "",
    })),
  );

  await replaceUserRows(
    "progress_logs",
    userId,
    snapshot.progress.map((row) => ({
      user_id: userId,
      entry_id: row.id,
      date: row.date,
      weight_lb: parseNumericAmount(row.weightLb) || 0,
      inches:
        row.inches === "" || row.inches == null
          ? null
          : parseNumericAmount(row.inches) || 0,
      feeling: row.feeling || "",
      notes: row.notes || "",
    })),
  );

  await replaceUserRows(
    "daily_logs",
    userId,
    snapshot.daily.map((row) => {
      const safeFoodItems = Array.isArray(row.foodItems)
        ? row.foodItems.map((item, index) => ({
            id:
              item && typeof item === "object" && item.id
                ? String(item.id)
                : `fi-${index}-${Math.random().toString(36).slice(2, 8)}`,
            foodType: item?.foodType || "",
            amount: item?.amount || "",
            foodNotes: item?.foodNotes || "",
            estimatedProtein: parseNumericAmount(item?.estimatedProtein) || 0,
            estimatedCarbs: parseNumericAmount(item?.estimatedCarbs) || 0,
            estimatedFat: parseNumericAmount(item?.estimatedFat) || 0,
            estimatedCalories: parseNumericAmount(item?.estimatedCalories) || 0,
            proteinGrams: parseNumericAmount(item?.proteinGrams) || 0,
          }))
        : [];
      const primaryLegacy = safeFoodItems[0] || {};

      return {
        user_id: userId,
        entry_id: row.id,
        date: row.date,
        food_items: safeFoodItems,
        // Keep legacy scalar columns populated for backward compatibility.
        food_notes: primaryLegacy.foodNotes || row.foodNotes || "",
        food_type: primaryLegacy.foodType || row.foodType || "",
        amount: primaryLegacy.amount || row.amount || "",
        estimated_protein:
          parseNumericAmount(primaryLegacy.estimatedProtein ?? row.estimatedProtein) || 0,
        estimated_carbs:
          parseNumericAmount(primaryLegacy.estimatedCarbs ?? row.estimatedCarbs) || 0,
        estimated_fat:
          parseNumericAmount(primaryLegacy.estimatedFat ?? row.estimatedFat) || 0,
        estimated_calories:
          parseNumericAmount(primaryLegacy.estimatedCalories ?? row.estimatedCalories) || 0,
        protein_grams:
          parseNumericAmount(primaryLegacy.proteinGrams ?? row.proteinGrams) || 0,
        water_oz: parseNumericAmount(row.waterOz) || 0,
        feeling: row.feeling || "",
        notes: row.notes || "",
      };
    }),
  );
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);
  const [vial, setVialState] = useState(() => ({ ...EMPTY_VIAL_SETTINGS }));
  const [doses, setDosesState] = useState([]);
  const [progress, setProgressState] = useState([]);
  const [daily, setDailyState] = useState([]);
  const [shakeNutritionPrefs, setShakeNutritionPrefsState] = useState(() => ({
    ...EMPTY_SHAKE_NUTRITION_PREFS,
  }));
  const [primaryGoal, setPrimaryGoalState] = useState(null);
  const [goalWeight, setGoalWeightState] = useState(null);
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [storageMode, setStorageMode] = useState("local");
  const [activeUserId, setActiveUserId] = useState(null);
  const skipNextSupabaseSyncRef = useRef(false);
  const syncTimerRef = useRef(null);

  const applySnapshot = useCallback((snapshot) => {
    setVialState(mergeVialFromStorage(snapshot.vial));
    setDosesState(ensureEntryIds(snapshot.doses, "d"));
    setProgressState(ensureEntryIds(snapshot.progress, "p"));
    setDailyState(ensureEntryIds(snapshot.daily, "l"));
    setShakeNutritionPrefsState(
      mergeShakeNutritionPrefs(snapshot.shakeNutritionPrefs),
    );
    setPrimaryGoalState(normalizePrimaryGoal(snapshot.primaryGoal));
    setGoalWeightState(normalizeGoalWeight(snapshot.goalWeight));
    setOnboardingCompleteState(!!snapshot.onboardingComplete);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function hydrateForCurrentSession() {
      if (!supabase) {
        applySnapshot(buildLocalSnapshot());
        setStorageMode("local");
        setActiveUserId(null);
        setHydrated(true);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session?.user) {
        applySnapshot(buildLocalSnapshot());
        setStorageMode("local");
        setActiveUserId(null);
        setHydrated(true);
        return;
      }

      try {
        const remote = await loadSupabaseSnapshot(session.user.id);
        if (!isMounted) return;
        const localFallback = buildLocalSnapshot();
        applySnapshot({
          ...(remote || buildDefaultSnapshot()),
          goalWeight:
            remote?.goalWeight != null
              ? remote.goalWeight
              : localFallback.goalWeight,
        });
        skipNextSupabaseSyncRef.current = true;
        setStorageMode("supabase");
        setActiveUserId(session.user.id);
      } catch {
        applySnapshot(buildLocalSnapshot());
        setStorageMode("local");
        setActiveUserId(null);
      } finally {
        if (isMounted) setHydrated(true);
      }
    }

    hydrateForCurrentSession();

    if (!supabase) {
      return () => {
        isMounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      if (!session?.user) {
        applySnapshot(buildLocalSnapshot());
        setStorageMode("local");
        setActiveUserId(null);
        skipNextSupabaseSyncRef.current = true;
        setHydrated(true);
        return;
      }

      setHydrated(false);
      try {
        const remote = await loadSupabaseSnapshot(session.user.id);
        if (!isMounted) return;
        const localFallback = buildLocalSnapshot();
        applySnapshot({
          ...(remote || buildDefaultSnapshot()),
          goalWeight:
            remote?.goalWeight != null
              ? remote.goalWeight
              : localFallback.goalWeight,
        });
        skipNextSupabaseSyncRef.current = true;
        setStorageMode("supabase");
        setActiveUserId(session.user.id);
      } catch {
        applySnapshot(buildLocalSnapshot());
        setStorageMode("local");
        setActiveUserId(null);
      } finally {
        if (isMounted) setHydrated(true);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applySnapshot]);

  useEffect(() => {
    if (!hydrated) return;
    const snapshot = {
      vial,
      doses,
      progress,
      daily,
      shakeNutritionPrefs,
      primaryGoal,
      goalWeight,
      onboardingComplete,
    };
    writeStorage(snapshot);

    if (storageMode !== "supabase" || !activeUserId || !supabase) return;

    if (skipNextSupabaseSyncRef.current) {
      skipNextSupabaseSyncRef.current = false;
      return;
    }

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(() => {
      void syncSnapshotToSupabase(activeUserId, snapshot).catch(() => {
        /* keep local state if network sync fails */
      });
    }, 350);

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [
    hydrated,
    storageMode,
    activeUserId,
    vial,
    doses,
    progress,
    daily,
    shakeNutritionPrefs,
    primaryGoal,
    goalWeight,
    onboardingComplete,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isDataSetupComplete(vial, progress, doses, primaryGoal)) return;
    queueMicrotask(() => {
      setOnboardingCompleteState((done) => (done ? done : true));
    });
  }, [hydrated, vial, progress, doses, primaryGoal]);

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

  const setShakeNutritionPrefs = useCallback((next) => {
    setShakeNutritionPrefsState((s) =>
      typeof next === "function" ? next(s) : { ...s, ...next },
    );
  }, []);

  const setPrimaryGoal = useCallback((next) => {
    setPrimaryGoalState((g) => {
      if (typeof next === "function") return normalizePrimaryGoal(next(g));
      return normalizePrimaryGoal(next);
    });
  }, []);

  const setGoalWeight = useCallback((next) => {
    setGoalWeightState((g) => {
      if (typeof next === "function") return normalizeGoalWeight(next(g));
      return normalizeGoalWeight(next);
    });
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
      shakeNutritionPrefs,
      setShakeNutritionPrefs,
      primaryGoal,
      setPrimaryGoal,
      goalWeight,
      setGoalWeight,
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
      shakeNutritionPrefs,
      setShakeNutritionPrefs,
      primaryGoal,
      setPrimaryGoal,
      goalWeight,
      setGoalWeight,
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
