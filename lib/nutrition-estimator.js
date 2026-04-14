/**
 * Lightweight keyword-based protein / carb ballparks from free-text food notes.
 * Optional shake scoops + saved per-scoop prefs refine the shake portion only.
 * Not a food log—rough ranges only, no calories.
 */

import { parseNumericAmount } from "@/lib/glp1-helpers";

const EGG_G = 6;
const EGG_DEFAULT_MIN = 2;
const EGG_DEFAULT_MAX = 4;

const SHAKE_PROTEIN_MIN = 20;
const SHAKE_PROTEIN_MAX = 30;

const RICOTTA_MIN = 10;
const RICOTTA_MAX = 14;

const COTTAGE_PER_CUP_MIN = 20;
const COTTAGE_PER_CUP_MAX = 25;

const CHICKEN_MIN = 20;
const CHICKEN_MAX = 30;

const FRUIT_CARB_MIN = 15;
const FRUIT_CARB_MAX = 30;

const AVOCADO_CARB_MIN = 8;
const AVOCADO_CARB_MAX = 17;

const FRUIT_RES = [
  /blueberries?/,
  /strawberries?/,
  /raspberries?/,
  /cherries|\bcherry\b/,
  /pomegranate/,
  /\bkiwi\b/,
  /\bberries\b/,
  /\bberry\b/,
];

export function joinNotesForNutrition(notesArray) {
  return (Array.isArray(notesArray) ? notesArray : [])
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/\u2019/g, "'")
    .replace(/\s+/g, " ");
}

function countFruitPortions(text) {
  let n = 0;
  for (const re of FRUIT_RES) {
    if (re.test(text)) n += 1;
  }
  return Math.min(n, 4);
}

/**
 * Recent dose + daily note strings (newest rows first in each list).
 * @param {{ date: string; notes?: string }[]} dosesDesc
 * @param {{ date: string; foodNotes?: string; notes?: string }[]} dailyDesc
 * @param {number} [limit=5]
 * @returns {string[]}
 */
export function collectFoodNoteStrings(dosesDesc, dailyDesc, limit = 5) {
  const parts = [];
  for (const r of dosesDesc.slice(0, limit)) {
    if (r?.notes && String(r.notes).trim()) parts.push(String(r.notes));
  }
  for (const r of dailyDesc.slice(0, limit)) {
    if (r?.foodNotes && String(r.foodNotes).trim()) {
      parts.push(String(r.foodNotes));
    }
    if (r?.notes && String(r.notes).trim()) parts.push(String(r.notes));
  }
  return parts;
}

/**
 * Shake / protein-powder context in recent notes (for follow-up UI + estimates).
 * Avoids lone "milkshake".
 * @param {string[]} notesArray
 */
export function detectShakeRelatedNotes(notesArray) {
  const text = joinNotesForNutrition(notesArray);
  if (!text || /\bmilkshake\b/.test(text)) return false;
  if (/protein\s*shake/.test(text)) return true;
  if (/\bprotein\s*powder\b/.test(text)) return true;
  if (/\bprotein\b/.test(text) && /\bshake\b/.test(text)) return true;
  if (/\bscoop(s)?\b/.test(text) && /\bprotein\b/.test(text)) return true;
  if (/\bshake\b/.test(text) && /\bprotein\b/.test(text)) return true;
  return false;
}

/**
 * @typedef {{
 *   proteinMin: number;
 *   proteinMax: number;
 *   carbsMin: number;
 *   carbsMax: number;
 *   confidence: "low" | "high";
 *   foodDetected: boolean;
 *   shakeRefined?: boolean;
 * }} NutritionEstimate
 */

/**
 * @typedef {{ proteinPerScoop?: number; carbsPerScoop?: number }} ShakePrefs
 */

/**
 * @param {string[]} notesArray
 * @param {{ shakePrefs?: ShakePrefs; shakeScoops?: number | null }} [options]
 * @returns {NutritionEstimate}
 */
export function estimateNutritionFromNotes(notesArray, options = {}) {
  const text = joinNotesForNutrition(notesArray);
  const shakePrefs = options.shakePrefs ?? {};
  const pPer = parseNumericAmount(shakePrefs.proteinPerScoop);
  const cPer = parseNumericAmount(shakePrefs.carbsPerScoop);
  const scoopsRaw = options.shakeScoops;
  const scoops =
    scoopsRaw == null || scoopsRaw === ""
      ? NaN
      : parseNumericAmount(scoopsRaw);
  const hasScoops = Number.isFinite(scoops) && scoops > 0;

  let proteinMin = 0;
  let proteinMax = 0;
  let carbsMin = 0;
  let carbsMax = 0;
  let explicitQty = false;
  let anyFood = false;
  let shakeRefined = false;

  if (!text) {
    return {
      proteinMin: 0,
      proteinMax: 0,
      carbsMin: 0,
      carbsMax: 0,
      confidence: "low",
      foodDetected: false,
      shakeRefined: false,
    };
  }

  if (/\begg\b|\beggs\b/.test(text)) {
    anyFood = true;
    const m = text.match(/(\d+)\s*(eggs?\b)/);
    let nLo = EGG_DEFAULT_MIN;
    let nHi = EGG_DEFAULT_MAX;
    if (m) {
      const n = Number.parseInt(m[1], 10);
      if (Number.isFinite(n) && n > 0) {
        nLo = nHi = n;
        explicitQty = true;
      }
    }
    proteinMin += nLo * EGG_G;
    proteinMax += nHi * EGG_G;
  }

  const shakeInNotes = detectShakeRelatedNotes(notesArray);
  if (shakeInNotes) {
    anyFood = true;
    const canRefineProtein = hasScoops && pPer > 0;
    if (canRefineProtein) {
      const p = scoops * pPer;
      proteinMin += p;
      proteinMax += p;
      explicitQty = true;
      shakeRefined = true;
      if (hasScoops && Number.isFinite(cPer) && cPer >= 0) {
        const c = scoops * cPer;
        carbsMin += c;
        carbsMax += c;
      }
    } else {
      proteinMin += SHAKE_PROTEIN_MIN;
      proteinMax += SHAKE_PROTEIN_MAX;
    }
  }

  if (/\bricotta\b/.test(text)) {
    anyFood = true;
    let lo = RICOTTA_MIN;
    let hi = RICOTTA_MAX;
    if (/\bhalf\b/.test(text) && /\bricotta\b/.test(text)) {
      lo = Math.round(RICOTTA_MIN / 2);
      hi = Math.round(RICOTTA_MAX / 2);
      explicitQty = true;
    }
    proteinMin += lo;
    proteinMax += hi;
  }

  if (/\bcottage cheese\b/.test(text)) {
    anyFood = true;
    const cupM = text.match(/(\d+(\.\d+)?)\s*(cup|cups)\b/);
    let cupsLo = 1;
    let cupsHi = 1;
    if (cupM) {
      const c = Number.parseFloat(cupM[1]);
      if (Number.isFinite(c) && c > 0) {
        cupsLo = cupsHi = c;
        explicitQty = true;
      }
    } else if (/\bhalf\b/.test(text)) {
      cupsLo = cupsHi = 0.5;
      explicitQty = true;
    }
    proteinMin += cupsLo * COTTAGE_PER_CUP_MIN;
    proteinMax += cupsHi * COTTAGE_PER_CUP_MAX;
  }

  if (/\bchicken\b/.test(text)) {
    anyFood = true;
    const servingM = text.match(/(\d+)\s*(serving|servings)\b/);
    let sLo = 1;
    let sHi = 1;
    if (servingM) {
      const s = Number.parseInt(servingM[1], 10);
      if (Number.isFinite(s) && s > 0) {
        sLo = sHi = s;
        explicitQty = true;
      }
    }
    proteinMin += sLo * CHICKEN_MIN;
    proteinMax += sHi * CHICKEN_MAX;
  }

  if (/\bavocado\b/.test(text)) {
    anyFood = true;
    carbsMin += AVOCADO_CARB_MIN;
    carbsMax += AVOCADO_CARB_MAX;
  }

  const fruitHits = countFruitPortions(text);
  if (fruitHits > 0) {
    anyFood = true;
    carbsMin += fruitHits * FRUIT_CARB_MIN;
    carbsMax += fruitHits * FRUIT_CARB_MAX;
  }

  const confidence = explicitQty ? "high" : "low";

  return {
    proteinMin,
    proteinMax,
    carbsMin,
    carbsMax,
    confidence,
    foodDetected: anyFood && (proteinMax > 0 || carbsMax > 0),
    shakeRefined,
  };
}

/**
 * @param {NutritionEstimate} est
 * @returns {string | null}
 */
export function formatNutritionInsightLine(est) {
  if (!est?.foodDetected) return null;

  const parts = [];

  if (est.proteinMax > 0) {
    const lo = Math.round(est.proteinMin);
    const hi = Math.round(est.proteinMax);
    parts.push(
      `Based on your notes, you may be getting around ${lo}–${hi}g of protein today.`,
    );
  }

  if (est.carbsMax > 0 && est.proteinMax === 0) {
    const clo = Math.round(est.carbsMin);
    const chi = Math.round(est.carbsMax);
    parts.push(
      `Based on your notes, fruit or avocado mentions might add roughly ${clo}–${chi}g carbs alongside your meals.`,
    );
  }

  if (parts.length === 0) return null;

  let line = parts[0];
  if (est.confidence === "low") {
    line +=
      " Adding amounts (like 3 eggs or 1 scoop) would improve accuracy.";
  }

  if (est.carbsMax > 0 && est.proteinMax > 0) {
    const clo = Math.round(est.carbsMin);
    const chi = Math.round(est.carbsMax);
    line += ` Rough carb ballpark from what you mentioned: about ${clo}–${chi}g.`;
  }

  return line;
}
