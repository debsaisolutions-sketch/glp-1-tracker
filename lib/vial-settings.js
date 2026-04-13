import { MOCK_SETTINGS } from "@/lib/mock-data";

let vial = { ...MOCK_SETTINGS };

export function getVialSettings() {
  return vial;
}

/** @param {typeof MOCK_SETTINGS} next */
export function replaceVialSettings(next) {
  vial = { ...next };
}
