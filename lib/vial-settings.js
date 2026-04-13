import { parseNumericAmount } from "@/lib/glp1-helpers";

/** True when vial fields support accurate unit→mg conversion (UI / onboarding only). */
export function isMedicationSetupComplete(v) {
  if (!v) return false;
  if (v.medicationType === "custom" && !String(v.customName || "").trim()) {
    return false;
  }
  const mode = v.setupMode === "advanced" ? "advanced" : "simple";
  if (mode === "simple") {
    const unitsPerMg = parseNumericAmount(v.unitsPerMg);
    return unitsPerMg > 0 && !Number.isNaN(unitsPerMg);
  }
  const mg = parseNumericAmount(v.totalMg);
  const ml = parseNumericAmount(v.totalMl);
  const upm = parseNumericAmount(v.unitsPerMl);
  return mg > 0 && !Number.isNaN(mg) && ml > 0 && !Number.isNaN(ml) && upm > 0 && !Number.isNaN(upm);
}
