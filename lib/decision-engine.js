import {
  collectFoodNoteStrings,
  detectShakeRelatedNotes,
  estimateNutritionFromNotes,
  formatNutritionInsightLine,
  joinNotesForNutrition,
} from "@/lib/nutrition-estimator";

/** @typedef {{ date: string; mg?: number; sideEffects?: string[]; notes?: string }} DoseRow */
/** @typedef {{ date: string; weightLb: number; notes?: string }} ProgressRow */
/** @typedef {{ date: string; foodNotes?: string; notes?: string }} DailyRow */

const MS_PER_DAY = 86400000;

const MSG_ROUTINE =
  "You're still getting into a routine. That's completely normal — consistency will help your body adjust.";

const MSG_CONSISTENT =
  "You've been consistent with your dosing — that's exactly what your body needs right now.";

const MSG_SIDE_EFFECTS =
  "Looks like you've had some rough days. This is common — splitting your dose may help you feel better.";

const MSG_PLATEAU =
  "Your weight hasn't changed much recently. That's normal — small adjustments or staying consistent can help.";

const MSG_PLATEAU_APPETITE =
  "Your weight hasn't changed much lately—and that's okay. Steadier appetite and fewer cravings still count as progress.";

const MSG_EARLY =
  "You're still in the early days, and that's okay. Small wins add up — notice what feels better after each dose.";

const MSG_MICRODOSING =
  "You might feel better splitting your dose into smaller amounts throughout the week.";

const MSG_NOTE_PAIN =
  "Pain and poor sleep can affect your progress. Focus on rest and consistency—your body needs recovery too.";

const MSG_NOTE_TIRED =
  "Low energy can happen during weight loss. Make sure you're eating enough and staying hydrated.";

const MSG_FOOD_PROTEIN =
  "You're doing a great job getting protein in. That helps protect muscle and keeps you full.";

const MSG_FOOD_AVOCADO =
  "Healthy fats like avocado can help with energy and satiety—nice choice.";

const MSG_FOOD_LOW_APPETITE =
  "Your appetite seems low, which is common. Focus on small, protein-rich meals so your body still gets what it needs.";

const MSG_FOOD_PROTEIN_AND_LOW_APPETITE =
  "It looks like your appetite is well controlled and you're still getting protein in—great job. Just make sure you're eating enough to support your energy.";

const MSG_AFFILIATE_POWDER =
  "For a cleaner and more flexible option, a simple protein powder can be a great foundation.";

const REC_AFFILIATE_POWDER = Object.freeze({
  label: "View clean protein powder",
  url: "https://amzn.to/3Q7zY0y",
});

const MSG_AFFILIATE_RTD =
  "A ready-to-drink shake can make it easier to get protein in when you're not feeling hungry.";

const REC_AFFILIATE_RTD = Object.freeze({
  label: "Grab a ready-to-drink option",
  url: "https://amzn.to/4elvWM1",
});

const FOOD_LOW_APPETITE_PHRASES = [
  "not eating",
  "not hungry",
  "not sure about eating",
];

/** Dose, daily, and progress notes — for affiliate RTD detection. */
const EATING_DIFFICULTY_PHRASES = [
  "hard to eat",
  "trouble eating",
  "difficulty eating",
  "difficult to eat",
  "hard time eating",
  "struggle to eat",
  "can't eat much",
  "cannot eat much",
  "hard to swallow",
  "trouble swallowing",
];

const FOOD_PROTEIN_RE =
  /\b(egg|eggs|shake|protein|ricotta|yogurt|chicken)\b/;

const FOOD_AVOCADO_RE = /\bavocado\b/;

/** Short words use word boundaries to avoid e.g. "painless" matching "pain". */
const NOTE_PAIN_RE = /\b(pain|hurting|sciatica)\b/;

const NOTE_TIRED_RE = /\b(tired|fatigue)\b/;

function sortDosesDesc(doses) {
  if (!Array.isArray(doses)) return [];
  return [...doses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

function sortProgressAsc(progress) {
  if (!Array.isArray(progress)) return [];
  return [...progress].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

function sortDailyDesc(daily) {
  if (!Array.isArray(daily)) return [];
  return [...daily].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

function sortProgressDesc(progress) {
  if (!Array.isArray(progress)) return [];
  return [...progress].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/**
 * Lowercase blob of free text from the last `limit` dose, daily, and progress
 * entries (each stream capped separately).
 */
function normalizeNoteBlob(parts) {
  return parts
    .join(" ")
    .toLowerCase()
    .replace(/\u2019/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Dose + daily notes only (food habits), last `limit` rows each.
 * @param {DoseRow[]} dosesDesc
 * @param {DailyRow[]} dailyDesc
 */
function recentFoodNotesBlob(dosesDesc, dailyDesc, limit = 5) {
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
  return normalizeNoteBlob(parts);
}

function recentNotesBlob(dosesDesc, dailyDesc, progressDesc, limit = 5) {
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
  for (const r of progressDesc.slice(0, limit)) {
    if (r?.notes && String(r.notes).trim()) parts.push(String(r.notes));
  }
  return normalizeNoteBlob(parts);
}

function hasProteinFoodMention(blob) {
  if (!blob) return false;
  if (blob.includes("cottage cheese")) return true;
  return FOOD_PROTEIN_RE.test(blob);
}

function hasLowAppetiteMention(blob) {
  if (!blob) return false;
  return FOOD_LOW_APPETITE_PHRASES.some((p) => blob.includes(p));
}

function hasEatingDifficultyMention(blob) {
  if (!blob) return false;
  return EATING_DIFFICULTY_PHRASES.some((p) => blob.includes(p));
}

function hasAffiliateRtdSignals(dosesDesc, dailyDesc, progressDesc) {
  const blob = recentNotesBlob(dosesDesc, dailyDesc, progressDesc, 5);
  return (
    hasLowAppetiteMention(blob) || hasEatingDifficultyMention(blob)
  );
}

function hasAvocadoMention(blob) {
  if (!blob) return false;
  return FOOD_AVOCADO_RE.test(blob);
}

/**
 * Simple food-pattern coaching from recent dose + daily notes.
 * @returns {string[]}
 */
function getFoodPatternGuidance(dosesDesc, dailyDesc) {
  const blob = recentFoodNotesBlob(dosesDesc, dailyDesc, 5);
  if (!blob) return [];

  const protein = hasProteinFoodMention(blob);
  const lowApp = hasLowAppetiteMention(blob);
  const avocado = hasAvocadoMention(blob);

  if (protein && lowApp) {
    const out = [MSG_FOOD_PROTEIN_AND_LOW_APPETITE];
    if (avocado) out.push(MSG_FOOD_AVOCADO);
    return out;
  }

  const out = [];
  if (lowApp) out.push(MSG_FOOD_LOW_APPETITE);
  if (protein) out.push(MSG_FOOD_PROTEIN);
  if (avocado) out.push(MSG_FOOD_AVOCADO);
  return out;
}

/**
 * Keyword-based guidance from recent user-written notes.
 * @returns {string[]}
 */
function getNoteKeywordGuidance(dosesDesc, dailyDesc, progressDesc, shakeOpts) {
  const foodMsgs = getFoodPatternGuidance(dosesDesc, dailyDesc);
  const blob = recentNotesBlob(dosesDesc, dailyDesc, progressDesc, 5);
  const out = [...foodMsgs];
  if (blob) {
    if (NOTE_PAIN_RE.test(blob)) {
      out.push(MSG_NOTE_PAIN);
    }
    if (NOTE_TIRED_RE.test(blob)) {
      out.push(MSG_NOTE_TIRED);
    }
  }

  if (out.length < 3) {
    const est = estimateNutritionFromNotes(
      collectFoodNoteStrings(dosesDesc, dailyDesc, 5),
      {
        shakePrefs: shakeOpts?.shakePrefs,
        shakeScoops: shakeOpts?.shakeScoops ?? null,
      },
    );
    if (est.foodDetected) {
      const nLine = formatNutritionInsightLine(est);
      if (nLine && !out.includes(nLine)) {
        out.push(nLine);
      }
    }
  }

  return out;
}

/**
 * Last 2–3 doses: similar mg amounts (relative spread).
 * @param {DoseRow[]} dosesDesc
 */
function lastTwoOrThreeSimilar(dosesDesc) {
  const n = Math.min(3, dosesDesc.length);
  if (n < 2) return false;
  const mgs = dosesDesc.slice(0, n).map((r) => Number(r.mg) || 0);
  if (mgs.some((m) => !(m > 0))) return false;
  const mean = mgs.reduce((a, b) => a + b, 0) / mgs.length;
  const spread = (Math.max(...mgs) - Math.min(...mgs)) / mean;
  return spread <= 0.22;
}

/**
 * Recent dosing looks uneven (last up to 5 entries).
 * @param {DoseRow[]} dosesDesc
 */
function recentDosesInconsistent(dosesDesc) {
  if (dosesDesc.length < 2) return false;
  const window = dosesDesc.slice(0, Math.min(5, dosesDesc.length));
  const mgs = window.map((r) => Number(r.mg) || 0).filter((m) => m > 0);
  if (mgs.length < 2) return true;
  const mean = mgs.reduce((a, b) => a + b, 0) / mgs.length;
  const spread = (Math.max(...mgs) - Math.min(...mgs)) / mean;
  return spread > 0.28;
}

/**
 * Any side effects logged on one of the last three doses.
 * @param {DoseRow[]} dosesDesc
 */
function hasRecentSideEffects(dosesDesc) {
  return dosesDesc.slice(0, 3).some(
    (r) => Array.isArray(r.sideEffects) && r.sideEffects.length > 0,
  );
}

/**
 * Last three weigh-ins span enough time and weight is nearly flat.
 * @param {ProgressRow[]} progressAsc
 */
function isWeightPlateau(progressAsc) {
  if (progressAsc.length < 3) return false;
  const last3 = progressAsc.slice(-3);
  const t0 = new Date(last3[0].date).getTime();
  const t2 = new Date(last3[2].date).getTime();
  if (Number.isNaN(t0) || Number.isNaN(t2) || t2 - t0 < 10 * MS_PER_DAY) {
    return false;
  }
  const ws = last3.map((p) => Number(p.weightLb)).filter((w) => Number.isFinite(w));
  if (ws.length < 3) return false;
  const lo = Math.min(...ws);
  const hi = Math.max(...ws);
  return hi - lo < 1.5;
}

/**
 * Still building history—not assuming a long stable streak yet.
 * @param {DoseRow[]} dosesDesc
 * @param {ProgressRow[]} progressAsc
 */
function isEarlyPhase(dosesDesc, progressAsc) {
  if (dosesDesc.length === 0 && progressAsc.length === 0) return false;
  if (dosesDesc.length > 0 && dosesDesc.length < 5) return true;
  if (progressAsc.length > 0 && progressAsc.length < 3) return true;
  if (dosesDesc.length >= 2) {
    const first = new Date(dosesDesc[dosesDesc.length - 1].date).getTime();
    const last = new Date(dosesDesc[0].date).getTime();
    if (!Number.isNaN(first) && !Number.isNaN(last)) {
      const spanDays = (last - first) / MS_PER_DAY;
      if (spanDays < 42) return true;
    }
  }
  return false;
}

/** One-line framing from primary goal (optional, capped with other insights). */
function getGoalPreamble(primaryGoal) {
  if (!primaryGoal || primaryGoal === "not_sure") return null;
  const lines = {
    weight_loss:
      "With weight loss as your focus, appetite shifts, steady dosing, and how your clothes feel are worth noticing alongside the scale.",
    appetite_control:
      "With appetite and cravings as your focus, steadier hunger days are a real win—even when the scale moves slowly.",
    metabolic_health:
      "For metabolic health, boringly consistent routines often beat big swings—small habits add up.",
    inflammation_wellbeing:
      "When you're aiming to feel better overall, tracking symptoms and staying consistent can matter as much as any one number.",
    maintenance:
      "In maintenance, keeping what's working matters—steady dosing still supports your plan.",
    microdosing_non_weight:
      "Your goal may be steadier energy, appetite regulation, or inflammation support rather than rapid scale changes.",
  };
  return lines[primaryGoal] ?? null;
}

function routineForGoal(primaryGoal) {
  if (primaryGoal === "inflammation_wellbeing") {
    return `${MSG_ROUTINE} Noticing how you feel over time can help you spot what helps.`;
  }
  return MSG_ROUTINE;
}

function plateauForGoal(primaryGoal) {
  if (primaryGoal === "microdosing_non_weight") return null;
  if (primaryGoal === "appetite_control") return MSG_PLATEAU_APPETITE;
  return MSG_PLATEAU;
}

function earlyForGoal(primaryGoal) {
  if (primaryGoal === "microdosing_non_weight") {
    return "You're still in the early days. Shifts in energy, appetite, or comfort sometimes show up before anything on the scale.";
  }
  return MSG_EARLY;
}

/**
 * Plain "shake" in food notes (not milkshake) — broader than detectShakeRelatedNotes.
 * @param {string[]} notesArray
 */
function foodNotesMentionShake(notesArray) {
  const t = joinNotesForNutrition(notesArray);
  if (!t) return false;
  if (/\bmilkshake\b/.test(t)) return false;
  return /\bshake\b/.test(t);
}

/**
 * General protein-affiliate context: shake / powder mentions or low protein ballpark from notes.
 * @param {DoseRow[]} dDesc
 * @param {DailyRow[]} dailyDesc
 * @param {{ shakePrefs?: object; shakeScoops?: number | null }} shakeOpts
 */
function shouldSuggestGeneralProteinAffiliate(dDesc, dailyDesc, shakeOpts) {
  const notes = collectFoodNoteStrings(dDesc, dailyDesc, 5);
  if (!joinNotesForNutrition(notes)) return false;
  const est = estimateNutritionFromNotes(notes, shakeOpts);
  const shake =
    detectShakeRelatedNotes(notes) || foodNotesMentionShake(notes);
  const lowProtein = est.foodDetected && est.proteinMax < 20;
  return shake || lowProtein;
}

/**
 * At most one affiliate line: RTD when low appetite / eating difficulty in recent notes;
 * otherwise powder when general protein context applies.
 * @param {DoseRow[]} dDesc
 * @param {DailyRow[]} dailyDesc
 * @param {ProgressRow[]} pDesc
 * @param {{ shakePrefs?: object; shakeScoops?: number | null }} shakeOpts
 * @returns {{ text: string; recommendation: { label: string; url: string } } | null}
 */
function buildProteinAffiliateLine(dDesc, dailyDesc, pDesc, shakeOpts) {
  const rtd = hasAffiliateRtdSignals(dDesc, dailyDesc, pDesc);
  const general = shouldSuggestGeneralProteinAffiliate(
    dDesc,
    dailyDesc,
    shakeOpts,
  );
  if (!rtd && !general) return null;
  if (rtd) {
    return {
      text: MSG_AFFILIATE_RTD,
      recommendation: { ...REC_AFFILIATE_RTD },
    };
  }
  return {
    text: MSG_AFFILIATE_POWDER,
    recommendation: { ...REC_AFFILIATE_POWDER },
  };
}

/**
 * @param {string | { text: string; recommendation?: { label: string; url: string } }} raw
 * @returns {{ text: string; recommendation?: { label: string; url: string } }}
 */
function asGuidanceLine(raw) {
  if (typeof raw === "string") return { text: raw };
  if (raw && typeof raw.text === "string") {
    const line = { text: raw.text };
    if (raw.recommendation?.label && raw.recommendation?.url != null) {
      line.recommendation = {
        label: String(raw.recommendation.label),
        url: String(raw.recommendation.url),
      };
    }
    return line;
  }
  return { text: "" };
}

/**
 * Supportive guidance from dose + weight patterns. No medical claims;
 * phrases are intentionally soft and realistic.
 *
 * @param {{ doses?: DoseRow[]; progress?: ProgressRow[]; daily?: DailyRow[]; shakePrefs?: { proteinPerScoop?: number; carbsPerScoop?: number }; shakeScoops?: number | null; primaryGoal?: string | null }} input
 * @returns {{ text: string; recommendation?: { label: string; url: string } }[]}
 */
export function getSupportGuidanceLines({
  doses = [],
  progress = [],
  daily = [],
  shakePrefs = { proteinPerScoop: 0, carbsPerScoop: 0 },
  shakeScoops = null,
  primaryGoal = null,
} = {}) {
  const dDesc = sortDosesDesc(doses);
  const dailyDesc = sortDailyDesc(daily);
  const pDesc = sortProgressDesc(progress);
  const pAsc = sortProgressAsc(progress);

  const shakeOpts = { shakePrefs, shakeScoops };
  const noteGuidance = getNoteKeywordGuidance(
    dDesc,
    dailyDesc,
    pDesc,
    shakeOpts,
  );

  const structured = [];
  const pushS = (msg) => {
    if (!structured.includes(msg)) structured.push(msg);
  };

  const sideFx = hasRecentSideEffects(dDesc);
  const similar = lastTwoOrThreeSimilar(dDesc);
  const inconsistent = recentDosesInconsistent(dDesc);
  const fewDoses = dDesc.length < 4;
  const showRoutine = fewDoses || inconsistent;

  let routinePushed = false;

  if (sideFx) {
    pushS(MSG_SIDE_EFFECTS);
    pushS(MSG_MICRODOSING);
  }

  if (similar) {
    pushS(MSG_CONSISTENT);
  } else if (showRoutine && dDesc.length > 0) {
    pushS(routineForGoal(primaryGoal));
    routinePushed = true;
  }

  if (!sideFx && !similar && inconsistent && dDesc.length >= 2) {
    pushS(MSG_MICRODOSING);
  }

  if (isWeightPlateau(pAsc)) {
    const plat = plateauForGoal(primaryGoal);
    if (plat) pushS(plat);
  }

  if (isEarlyPhase(dDesc, pAsc) && !routinePushed) {
    pushS(earlyForGoal(primaryGoal));
  }

  const merged = [];
  const pushMerged = (raw) => {
    if (merged.length >= 3) return;
    const line = asGuidanceLine(raw);
    if (!line.text) return;
    if (merged.some((m) => m.text === line.text)) return;
    merged.push(line);
  };

  const preamble = getGoalPreamble(primaryGoal);
  if (preamble) {
    pushMerged(preamble);
  }

  for (const msg of noteGuidance) {
    pushMerged(msg);
  }
  for (const msg of structured) {
    pushMerged(msg);
  }

  const affiliateLine = buildProteinAffiliateLine(
    dDesc,
    dailyDesc,
    pDesc,
    shakeOpts,
  );
  if (affiliateLine) {
    pushMerged(affiliateLine);
  }

  return merged;
}
