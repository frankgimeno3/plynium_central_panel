import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadCountriesRegions() {
    try {
        const p = join(__dirname, "../../../app/contents/countries_regions.json");
        const raw = readFileSync(p, "utf8");
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export function normalizeCountryKey(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\u2019']/g, "'")
        .replace(/[^a-z0-9\s'()-]/g, "")
        .replace(/\s+/g, " ");
}

/** Title-case region label from JSON (e.g. "center & south america" → "Center & South America"). */
export function titleCaseRegion(value) {
    const v = String(value ?? "").trim();
    if (!v) return "";
    return v
        .split(" ")
        .map((w) => (w === "&" ? "&" : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(" ");
}

/**
 * Geographic region for a country name, from the same JSON as the portal directory.
 * @param {string} countryName
 * @returns {string} display region or ""
 */
export function regionFromCountry(countryName) {
    const list = Array.isArray(loadCountriesRegions()) ? loadCountriesRegions() : [];
    const key = normalizeCountryKey(countryName);
    for (const item of list) {
        const c = normalizeCountryKey(String(item?.country ?? ""));
        if (c === key) {
            const r = String(item?.region ?? "").trim();
            if (!r) return "";
            return titleCaseRegion(r);
        }
    }
    return "";
}
