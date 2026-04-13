/** Seed settings aligned with helpers (60 mg / 3 mL, 100 u/mL → 20 mg/mL, 0.2 mg/unit) */
export const MOCK_SETTINGS = {
  medicationType: "tirzepatide",
  customName: "",
  setupMode: "advanced",
  unitsPerMg: 0,
  simpleStrengthPreset: null,
  totalMg: 60,
  totalMl: 3,
  unitsPerMl: 100,
};

/** Fresh install / new user — incomplete until they enter vial values */
export const EMPTY_VIAL_SETTINGS = {
  medicationType: "tirzepatide",
  customName: "",
  setupMode: "simple",
  unitsPerMg: 0,
  simpleStrengthPreset: null,
  totalMg: 0,
  totalMl: 0,
  unitsPerMl: 100,
};

export const MOCK_DOSES = [
  {
    id: "d1",
    date: "2026-04-07",
    units: 50,
    mg: 10,
    doseType: "full",
    feeling: "\u{1F604}",
    sideEffects: ["fatigue"],
    notes: "First shot this vial—felt fine after lunch.",
  },
  {
    id: "d2",
    date: "2026-04-10",
    units: 55,
    mg: 11,
    doseType: "split",
    feeling: "\u{1F642}",
    sideEffects: ["nausea"],
    notes: "Split dose AM/PM.",
  },
  {
    id: "d3",
    date: "2026-04-12",
    units: 30,
    mg: 6,
    doseType: "micro",
    feeling: "\u{1F610}",
    sideEffects: [],
    notes: "Travel day—micro dose.",
  },
];

export const MOCK_DAILY = [
  {
    id: "l1",
    date: "2026-04-11",
    foodNotes: "Greek yogurt, chicken salad, berries",
    proteinGrams: 95,
    waterOz: 72,
    feeling: "\u{1F642}",
    notes: "Felt energized after a walk.",
  },
  {
    id: "l2",
    date: "2026-04-12",
    foodNotes: "Oats, tuna wrap, roasted veg",
    proteinGrams: 88,
    waterOz: 64,
    feeling: "\u{1F610}",
    notes: "Busy day—could drink more water.",
  },
];

export const MOCK_PROGRESS = [
  {
    id: "p1",
    date: "2026-03-16",
    weightLb: 242.4,
    inches: 41,
    feeling: "\u{1F610}",
    notes: "Baseline check-in.",
  },
  {
    id: "p2",
    date: "2026-03-30",
    weightLb: 239.8,
    inches: 40.5,
    feeling: "\u{1F642}",
    notes: "Less bloating this week.",
  },
  {
    id: "p3",
    date: "2026-04-13",
    weightLb: 237.2,
    inches: 40.25,
    feeling: "\u{1F604}",
    notes: "Morning weigh-in, before coffee.",
  },
];
