import { isMedicationSetupComplete } from "@/lib/vial-settings";

export function isPrimaryGoalSet(primaryGoal) {
  return primaryGoal != null && String(primaryGoal).trim() !== "";
}

/**
 * Legacy installs may have med + weight + doses before primaryGoal existed.
 * Treat those as complete for goal purposes so the app does not re-lock the dashboard.
 */
function primaryGoalSatisfied(primaryGoal, vial, progress, doses) {
  if (isPrimaryGoalSet(primaryGoal)) return true;
  return (
    doses?.length > 0 &&
    progress?.length > 0 &&
    isMedicationSetupComplete(vial)
  );
}

/** Medication, weight, dose, and primary goal (or legacy triplet). */
export function isDataSetupComplete(vial, progress, doses, primaryGoal) {
  return (
    primaryGoalSatisfied(primaryGoal, vial, progress, doses) &&
    isMedicationSetupComplete(vial) &&
    Array.isArray(progress) &&
    progress.length > 0 &&
    Array.isArray(doses) &&
    doses.length > 0
  );
}

/**
 * @returns {1 | 2 | 3 | 4}
 */
export function getCurrentSetupStep(vial, progress, doses, primaryGoal) {
  if (!isPrimaryGoalSet(primaryGoal)) {
    const legacy =
      doses?.length > 0 &&
      progress?.length > 0 &&
      isMedicationSetupComplete(vial);
    if (!legacy) return 1;
  }
  if (!isMedicationSetupComplete(vial)) return 2;
  if (!progress || progress.length === 0) return 3;
  if (!doses || doses.length === 0) return 4;
  return 4;
}

export function showFullDashboard(
  onboardingComplete,
  vial,
  progress,
  doses,
  primaryGoal,
) {
  return (
    onboardingComplete ||
    isDataSetupComplete(vial, progress, doses, primaryGoal)
  );
}
