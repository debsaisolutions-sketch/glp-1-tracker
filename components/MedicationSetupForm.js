"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/Card";
import { MEDICATION_OPTIONS } from "@/lib/constants";
import {
  computeMgPerMl,
  getMgPerUnitFromVial,
  parseNumericAmount,
} from "@/lib/glp1-helpers";
import { isMedicationSetupComplete } from "@/lib/vial-settings";

const SIMPLE_PRESETS = [
  { id: "10", unitsPerMg: 10, line1: "10 units = 1 mg", line2: "(most common)" },
  { id: "20", unitsPerMg: 20, line1: "20 units = 1 mg", line2: null },
  { id: "5", unitsPerMg: 5, line1: "5 units = 1 mg", line2: null },
];

/** Common pen assumption for guided flows (10� 1 mg). */
const DEFAULT_UNITS_PER_MG = 10;

const WIZ = {
  ASK_DOSE_KNOWLEDGE: "ASK_DOSE_KNOWLEDGE",
  YES_PRESETS: "YES_PRESETS",
  GUIDED_INTRO: "GUIDED_INTRO",
  GUIDED_WHAT_FORMAT: "GUIDED_WHAT_FORMAT",
  GUIDED_UNITS_INJECT: "GUIDED_UNITS_INJECT",
  GUIDED_MG_DOSE: "GUIDED_MG_DOSE",
  GUIDED_UNSURE_CONFIRM: "GUIDED_UNSURE_CONFIRM",
};

function btnBase(active) {
  return `rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
    active
      ? "bg-teal-600 text-white shadow-sm"
      : "border border-zinc-200 bg-white text-zinc-900 hover:border-teal-200 hover:bg-teal-50/80 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-teal-800 dark:hover:bg-teal-950/40"
  }`;
}

function secondaryBtn() {
  return "rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";
}

export function MedicationSetupForm({ settings, onFieldChange, onPatch }) {
  const mode = settings.setupMode === "advanced" ? "advanced" : "simple";
  const preset = settings.simpleStrengthPreset ?? null;

  const applyPatch =
    onPatch ??
    ((p) => {
      Object.entries(p).forEach(([k, v]) => onFieldChange(k, v));
    });

  const simpleFlowComplete =
    mode === "simple" && isMedicationSetupComplete(settings);

  const [wizardStep, setWizardStep] = useState(WIZ.ASK_DOSE_KNOWLEDGE);
  const [guidedUnitsVal, setGuidedUnitsVal] = useState("");
  const [guidedMgVal, setGuidedMgVal] = useState("");
  const [resumeSummary, setResumeSummary] = useState(null);

  const prevModeRef = useRef(mode);

  useEffect(() => {
    if (prevModeRef.current === "advanced" && mode === "simple" && !simpleFlowComplete) {
      setWizardStep(WIZ.ASK_DOSE_KNOWLEDGE);
      setResumeSummary(null);
      setGuidedUnitsVal("");
      setGuidedMgVal("");
    }
    prevModeRef.current = mode;
  }, [mode, simpleFlowComplete]);

  const mgPerMl = useMemo(
    () => computeMgPerMl(settings.totalMg, settings.totalMl),
    [settings.totalMg, settings.totalMl],
  );

  const mgPerUnit = useMemo(
    () => getMgPerUnitFromVial(settings),
    [settings],
  );

  function selectPreset(id, unitsPerMg) {
    setResumeSummary(null);
    applyPatch({ simpleStrengthPreset: id, unitsPerMg });
  }

  function restartSimpleFlow() {
    setResumeSummary(null);
    setGuidedUnitsVal("");
    setGuidedMgVal("");
    setWizardStep(WIZ.ASK_DOSE_KNOWLEDGE);
    applyPatch({ unitsPerMg: 0, simpleStrengthPreset: null });
  }

  function finishGuidedUnits() {
    const u = parseNumericAmount(guidedUnitsVal);
    if (!(u > 0)) return;
    setResumeSummary({ kind: "units", amount: u });
    applyPatch({
      simpleStrengthPreset: "10",
      unitsPerMg: DEFAULT_UNITS_PER_MG,
    });
  }

  function finishGuidedMg() {
    const m = parseNumericAmount(guidedMgVal);
    if (!(m > 0)) return;
    setResumeSummary({ kind: "mg", amount: m });
    applyPatch({
      simpleStrengthPreset: "10",
      unitsPerMg: DEFAULT_UNITS_PER_MG,
    });
  }

  function finishGuidedUnsure() {
    setResumeSummary({ kind: "unsure" });
    applyPatch({
      simpleStrengthPreset: "10",
      unitsPerMg: DEFAULT_UNITS_PER_MG,
    });
  }

  function presetSummaryLine() {
    if (preset === "custom") {
      const upm = parseNumericAmount(settings.unitsPerMg);
      return upm > 0 ? `${upm} units = 1 mg (custom)` : "Custom strength";
    }
    const p = SIMPLE_PRESETS.find((x) => x.id === preset);
    if (p) return p.line1;
    return "10 units = 1 mg";
  }

  return (
    <>
      <Card className="space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Medication type
          </label>
          <select
            value={settings.medicationType}
            onChange={(e) => onFieldChange("medicationType", e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {MEDICATION_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {settings.medicationType === "custom" ? (
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Custom name
            </label>
            <input
              value={settings.customName}
              onChange={(e) => onFieldChange("customName", e.target.value)}
              placeholder="e.g. liraglutide"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        ) : null}

        <div>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Setup style
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onFieldChange("setupMode", "simple")}
              className={`rounded-xl px-3 py-2.5 text-center text-xs font-semibold leading-snug sm:text-sm ${
                mode === "simple"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Simple (recommended)
            </button>
            <button
              type="button"
              onClick={() => onFieldChange("setupMode", "advanced")}
              className={`rounded-xl px-3 py-2.5 text-center text-xs font-semibold leading-snug sm:text-sm ${
                mode === "advanced"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Advanced
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Most people should use Simple Mode.
          </p>
        </div>

        {mode === "simple" ? (
          simpleFlowComplete ? (
            <div className="space-y-4 rounded-xl border border-teal-100 bg-teal-50/50 p-4 dark:border-teal-900/60 dark:bg-teal-950/30">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                You&apos;re all set
              </p>
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {presetSummaryLine()}
                </span>
                {" — "}
                we&apos;ll turn your unit dial into mg automatically when you log
                doses.
              </p>

              {resumeSummary?.kind === "units" ? (
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  You said you inject{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {resumeSummary.amount} units
                  </span>{" "}
                  per dose. Using the common{" "}
                  <span className="font-medium">10� 1 mg</span> rule,
                  that&apos;s about{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {(resumeSummary.amount / DEFAULT_UNITS_PER_MG).toFixed(2)} mg
                  </span>{" "}
                  each time.
                </p>
              ) : null}
              {resumeSummary?.kind === "mg" ? (
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  You said you take{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {resumeSummary.amount} mg
                  </span>{" "}
                  per dose. With{" "}
                  <span className="font-medium">10 units �� 1 mg</span>,
                  that&apos;s about{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {Math.round(resumeSummary.amount * DEFAULT_UNITS_PER_MG)}
                    {" "}
                    units
                  </span>{" "}
                  on your dial.
                </p>
              ) : null}
              {resumeSummary?.kind === "unsure" ? (
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  We&apos;re using the usual{" "}
                  <span className="font-medium">10 units = 1 mg</span> setup.
                  You can change this anytime below if your clinician gave you
                  different numbers.
                </p>
              ) : null}

              <button
                type="button"
                onClick={restartSimpleFlow}
                className={secondaryBtn()}
              >
                Change my dosing setup
              </button>

              <div className="border-t border-teal-200/80 pt-4 dark:border-teal-900/50">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  What is microdosing?
                </p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Microdosing usually means taking a{" "}
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    smaller amount more often
                  </span>{" "}
                  instead of one big shot—for example, splitting a weekly dose
                  into two injections on different days. People sometimes do
                  this with their care team to ease side effects or match their
                  schedule. This app is only for tracking; always follow your
                  prescriber&apos;s plan.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-xl border border-teal-100 bg-teal-50/50 p-4 dark:border-teal-900/60 dark:bg-teal-950/30">
              {wizardStep === WIZ.ASK_DOSE_KNOWLEDGE ? (
                <>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Do you know your dosing instructions?
                  </p>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    We&apos;ll either show quick strength options or walk you
                    through step by step.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResumeSummary(null);
                        setWizardStep(WIZ.YES_PRESETS);
                      }}
                      className={btnBase(false)}
                    >
                      Yes, I know
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResumeSummary(null);
                        setWizardStep(WIZ.GUIDED_INTRO);
                      }}
                      className={btnBase(false)}
                    >
                      Not sure
                    </button>
                  </div>
                </>
              ) : null}

              {wizardStep === WIZ.YES_PRESETS ? (
                <>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    How strong is your mix?
                  </p>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Most people use 10 units = 1 mg. Pick what matches your pen
                    or label.
                  </p>
                  <div className="flex flex-col gap-2">
                    {SIMPLE_PRESETS.map((p) => {
                      const selected = preset === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectPreset(p.id, p.unitsPerMg)}
                          className={btnBase(selected)}
                        >
                          <span className="block">{p.line1}</span>
                          {p.line2 ? (
                            <span
                              className={`mt-0.5 block text-xs font-normal ${
                                selected
                                  ? "text-teal-100"
                                  : "text-zinc-500 dark:text-zinc-400"
                              }`}
                            >
                              {p.line2}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() =>
                        applyPatch({
                          simpleStrengthPreset: "custom",
                          unitsPerMg:
                            preset === "10" || preset === "20" || preset === "5"
                              ? settings.unitsPerMg
                              : parseNumericAmount(settings.unitsPerMg) > 0
                                ? settings.unitsPerMg
                                : 0,
                        })
                      }
                      className={btnBase(preset === "custom")}
                    >
                      Custom (for advanced users)
                    </button>
                  </div>
                  {preset === "custom" ? (
                    <div className="pt-1">
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Units per 1 mg
                      </label>
                      <input
                        inputMode="decimal"
                        value={
                          parseNumericAmount(settings.unitsPerMg) > 0
                            ? settings.unitsPerMg
                            : ""
                        }
                        onChange={(e) =>
                          onFieldChange(
                            "unitsPerMg",
                            parseNumericAmount(e.target.value) || 0,
                          )
                        }
                        placeholder="e.g. 8"
                        className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                      />
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setWizardStep(WIZ.ASK_DOSE_KNOWLEDGE)}
                    className={`w-full ${secondaryBtn()}`}
                  >
                    Back
                  </button>
                </>
              ) : null}

              {wizardStep === WIZ.GUIDED_INTRO ? (
                <>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Quick basics
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    Your medication is measured in{" "}
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      units
                    </span>{" "}
                    on your syringe or pen dial, and in{" "}
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      mg
                    </span>{" "}
                    for strength. You don&apos;t need to do any math—we&apos;ll
                    handle conversions after one quick question.
                  </p>
                  <button
                    type="button"
                    onClick={() => setWizardStep(WIZ.GUIDED_WHAT_FORMAT)}
                    className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(WIZ.ASK_DOSE_KNOWLEDGE)}
                    className={`w-full ${secondaryBtn()}`}
                  >
                    Back
                  </button>
                </>
              ) : null}

              {wizardStep === WIZ.GUIDED_WHAT_FORMAT ? (
                <>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    What were you told to take?
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setWizardStep(WIZ.GUIDED_UNITS_INJECT)}
                      className={btnBase(false)}
                    >
                      Units (like 10 units)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(WIZ.GUIDED_MG_DOSE)}
                      className={btnBase(false)}
                    >
                      Mg (like 2.5 mg)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(WIZ.GUIDED_UNSURE_CONFIRM)}
                      className={btnBase(false)}
                    >
                      Not sure
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWizardStep(WIZ.GUIDED_INTRO)}
                    className={`w-full ${secondaryBtn()}`}
                  >
                    Back
                  </button>
                </>
              ) : null}

              {wizardStep === WIZ.GUIDED_UNITS_INJECT ? (
                <>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    How many units do you inject?
                  </p>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Enter a typical dose from your dial (one injection).
                  </p>
                  <input
                    inputMode="decimal"
                    value={guidedUnitsVal}
                    onChange={(e) => setGuidedUnitsVal(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    We&apos;ll use the common{" "}
                    <span className="font-medium">10 units �� 1 mg</span> rule to
                    set up your app and estimate mg for each shot.
                  </p>
                  <button
                    type="button"
                    onClick={finishGuidedUnits}
                    disabled={!(parseNumericAmount(guidedUnitsVal) > 0)}
                    className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save and continue
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(WIZ.GUIDED_WHAT_FORMAT)}
                    className={`w-full ${secondaryBtn()}`}
                  >
                    Back
                  </button>
                </>
              ) : null}

              {wizardStep === WIZ.GUIDED_MG_DOSE ? (
                <>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    What mg dose do you take?
                  </p>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Enter the milligram amount from your instructions (one
                    dose).
                  </p>
                  <input
                    inputMode="decimal"
                    value={guidedMgVal}
                    onChange={(e) => setGuidedMgVal(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    We&apos;ll assume{" "}
                    <span className="font-medium">10 units �� 1 mg</span> to
                    estimate how many units that is on your dial.
                  </p>
                  <button
                    type="button"
                    onClick={finishGuidedMg}
                    disabled={!(parseNumericAmount(guidedMgVal) > 0)}
                    className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save and continue
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(WIZ.GUIDED_WHAT_FORMAT)}
                    className={`w-full ${secondaryBtn()}`}
                  >
                    Back
                  </button>
                </>
              ) : null}

              {wizardStep === WIZ.GUIDED_UNSURE_CONFIRM ? (
                <>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    That&apos;s okay
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    Most people use{" "}
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      10 units = 1 mg
                    </span>{" "}
                    for pens like yours. You can use this as a starting point and
                    adjust later with your care team or in Medication Setup.
                  </p>
                  <button
                    type="button"
                    onClick={finishGuidedUnsure}
                    className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
                  >
                    Use 10 units = 1 mg for my app
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(WIZ.GUIDED_WHAT_FORMAT)}
                    className={`w-full ${secondaryBtn()}`}
                  >
                    Back
                  </button>
                </>
              ) : null}
            </div>
          )
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Total mg in vial
                </label>
                <input
                  inputMode="decimal"
                  value={settings.totalMg}
                  onChange={(e) =>
                    onFieldChange(
                      "totalMg",
                      parseNumericAmount(e.target.value) || 0,
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Total mL
                </label>
                <input
                  inputMode="decimal"
                  value={settings.totalMl}
                  onChange={(e) =>
                    onFieldChange(
                      "totalMl",
                      parseNumericAmount(e.target.value) || 0,
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Units per mL
              </label>
              <input
                inputMode="numeric"
                value={settings.unitsPerMl}
                onChange={(e) =>
                  onFieldChange(
                    "unitsPerMl",
                    parseNumericAmount(e.target.value) || 0,
                  )
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Pens often use 100 units per mL—confirm with your pharmacist.
              </p>
            </div>
          </>
        )}
      </Card>

      <Card>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Auto-calculated
        </p>
        {mode === "simple" ? (
          <dl className="mt-3 text-sm">
            <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
              <dt className="text-xs text-zinc-500">mg per unit</dt>
              <dd className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
                {mgPerUnit > 0 ? mgPerUnit.toFixed(4) : "—"}
              </dd>
              <dd className="mt-1 text-xs text-zinc-500">
                Same as 1 divided by your units per mg.
              </dd>
            </div>
          </dl>
        ) : (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
              <dt className="text-xs text-zinc-500">mg per mL</dt>
              <dd className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
                {mgPerMl.toFixed(3)}
              </dd>
            </div>
            <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
              <dt className="text-xs text-zinc-500">mg per unit</dt>
              <dd className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
                {mgPerUnit.toFixed(4)}
              </dd>
            </div>
          </dl>
        )}
      </Card>
    </>
  );
}
