/** Shared emoji scale for mood / how you feel */
export const FEELING_EMOJIS = [
  "\u{1F604}",
  "\u{1F642}",
  "\u{1F610}",
  "\u{1F615}",
  "\u{1F92E}",
];

export const DOSE_TYPES = [
  { id: "full", label: "Full" },
  { id: "split", label: "Split" },
  { id: "micro", label: "Micro" },
];

export const SIDE_EFFECT_OPTIONS = [
  { id: "nausea", label: "Nausea" },
  { id: "headache", label: "Headache" },
  { id: "fatigue", label: "Fatigue" },
  { id: "constipation", label: "Constipation" },
  { id: "injection irritation", label: "Injection irritation" },
];

export const MEDICATION_OPTIONS = [
  { id: "tirzepatide", label: "Tirzepatide" },
  { id: "semaglutide", label: "Semaglutide" },
  { id: "custom", label: "Custom" },
];

/** Primary reason for tracking — used in onboarding, settings, and guidance tone. */
export const PRIMARY_GOAL_OPTIONS = [
  { id: "weight_loss", label: "Weight loss" },
  { id: "appetite_control", label: "Appetite / cravings control" },
  { id: "metabolic_health", label: "Metabolic health" },
  {
    id: "inflammation_wellbeing",
    label: "Inflammation / feeling better overall",
  },
  { id: "maintenance", label: "Maintenance" },
  {
    id: "microdosing_non_weight",
    label: "Microdosing / non-weight benefits",
  },
  { id: "not_sure", label: "Not sure yet" },
];
