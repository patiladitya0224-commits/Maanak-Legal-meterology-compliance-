export type ScanPrefs = {
  location: string;
  packageWidthMm: string;
  isFood: boolean;
  isImported: boolean;
};

const KEY = "lmcs-scan-prefs";

export const defaultPrefs: ScanPrefs = {
  location: "Bengaluru, KA",
  packageWidthMm: "90",
  isFood: true,
  isImported: false,
};

export function loadPrefs(): ScanPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {
    return defaultPrefs;
  }
}

export function savePrefs(prefs: ScanPrefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}
