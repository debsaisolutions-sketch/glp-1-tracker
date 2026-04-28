/**
 * Parse numbers from inputs or JSON where users may use comma decimals or
 * thousands separators (e.g. 1,800 → 1800, 30,5 → 30.5).
 * @param {unknown} value
 * @returns {number} finite number, or NaN if not parseable
 */
export function parseNumericAmount(value) {
  if (value == null || value === "") return NaN;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }
  let s = String(value).trim().replace(/\s/g, "");
  if (s === "") return NaN;

  if (!s.includes(".")) {
    if (/^\d+,\d{1,2}$/.test(s)) {
      s = s.replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else {
    s = s.replace(/,/g, "");
  }

  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * mg_per_ml = total_mg_in_vial / total_ml_in_vial
 * @param {number} totalMg
 * @param {number} totalMl
 */
export function computeMgPerMl(totalMg, totalMl) {
  const mg = parseNumericAmount(totalMg);
  const ml = parseNumericAmount(totalMl);
  if (!(ml > 0) || Number.isNaN(mg) || Number.isNaN(ml)) return 0;
  return mg / ml;
}

/**
 * mg_per_unit = mg_per_ml / units_per_ml
 * @param {number} totalMg
 * @param {number} totalMl
 * @param {number} unitsPerMl
 */
export function computeMgPerUnit(totalMg, totalMl, unitsPerMl) {
  const mgPerMl = computeMgPerMl(totalMg, totalMl);
  const upm = parseNumericAmount(unitsPerMl);
  if (!(upm > 0) || Number.isNaN(upm)) return 0;
  return mgPerMl / upm;
}

/**
 * Single mg_per_unit used by dose log, dashboard, and onboarding.
 * Simple: mg_per_unit = 1 / units_per_mg. Advanced: mg_per_unit = (total_mg / total_ml) / units_per_ml.
 * @param {object} vial
 */
export function getMgPerUnitFromVial(vial) {
  if (!vial || typeof vial !== "object") return 0;
  const mode = vial.setupMode === "advanced" ? "advanced" : "simple";
  if (mode === "simple") {
    const unitsPerMg = parseNumericAmount(vial.unitsPerMg);
    if (!(unitsPerMg > 0) || Number.isNaN(unitsPerMg)) return 0;
    return 1 / unitsPerMg;
  }
  return computeMgPerUnit(vial.totalMg, vial.totalMl, vial.unitsPerMl);
}

/**
 * mg_from_units = units * mg_per_unit
 * @param {number} units
 * @param {number} mgPerUnit
 */
export function unitsToMg(units, mgPerUnit) {
  const u = parseNumericAmount(units);
  const mpu = parseNumericAmount(mgPerUnit);
  if (!(u >= 0) || Number.isNaN(u) || !(mpu > 0) || Number.isNaN(mpu)) return 0;
  return u * mpu;
}

/** Monday00:00:00 local time */
export function startOfWeekMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Parse a YYYY-MM-DD string as a local date to avoid UTC shift issues.
 * Falls back to Date parsing for non-standard strings.
 * @param {string} dateText
 * @returns {Date}
 */
export function parseLocalDateOnly(dateText) {
  const raw = String(dateText || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return new Date(raw);
  const year = Number.parseInt(match[1], 10);
  const monthIndex = Number.parseInt(match[2], 10) - 1;
  const day = Number.parseInt(match[3], 10);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthIndex) ||
    !Number.isFinite(day)
  ) {
    return new Date(raw);
  }
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

/** @param {{ date: string; mg: number }[]} doses */
export function weeklyDoseTotalMg(doses, referenceDate = new Date()) {
  const start = startOfWeekMonday(referenceDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return doses.reduce((sum, row) => {
    const t = parseLocalDateOnly(row.date);
    if (t >= start && t < end) return sum + (row.mg || 0);
    return sum;
  }, 0);
}

/**
 * Short encouraging copy from weight change (lb), negative = loss.
 * @param {number} changeLb current - baseline (or previous)
 */
export function encouragingMessage(changeLb) {
  if (changeLb < -0.05) {
    return "You’re trending down—small steps add up. Keep nurturing yourself.";
  }
  if (changeLb > 0.05) {
    return "Bodies fluctuate—that’s normal. Consistency matters more than any single weigh-in.";
  }
  return "Showing up to track is already a win. Steady progress beats perfection.";
}
