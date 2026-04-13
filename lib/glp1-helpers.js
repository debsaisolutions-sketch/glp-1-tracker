/**
 * mg per mL from total vial contents.
 * @param {number} totalMg
 * @param {number} totalMl
 */
export function computeMgPerMl(totalMg, totalMl) {
  if (!totalMl || totalMl <= 0) return 0;
  return totalMg / totalMl;
}

/**
 * mg per insulin-style unit (units per mL on pen/syringe scale).
 * @param {number} totalMg
 * @param {number} totalMl
 * @param {number} unitsPerMl
 */
export function computeMgPerUnit(totalMg, totalMl, unitsPerMl) {
  const mgPerMl = computeMgPerMl(totalMg, totalMl);
  if (!unitsPerMl || unitsPerMl <= 0) return 0;
  return mgPerMl / unitsPerMl;
}

/**
 * Convert dial units to mg using mg per unit.
 * @param {number} units
 * @param {number} mgPerUnit
 */
export function unitsToMg(units, mgPerUnit) {
  if (mgPerUnit == null || mgPerUnit <= 0) return 0;
  return units * mgPerUnit;
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

/** @param {{ date: string; mg: number }[]} doses */
export function weeklyDoseTotalMg(doses, referenceDate = new Date()) {
  const start = startOfWeekMonday(referenceDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return doses.reduce((sum, row) => {
    const t = new Date(row.date);
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
