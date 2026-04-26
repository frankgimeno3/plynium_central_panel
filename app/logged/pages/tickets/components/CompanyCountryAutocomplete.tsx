"use client";

import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
/** Same data as portals/glassinformer/app/general_components/countries_regions.json — keep in sync with that file. */
import countriesRegions from "@/app/contents/countries_regions.json";

export function normalizePanelCountryKey(value: string): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2019']/g, "'")
    .replace(/[^a-z0-9\s'()-]/g, "")
    .replace(/\s+/g, " ");
}

const AVAILABLE_COUNTRIES: string[] = (() => {
  const list = Array.isArray(countriesRegions)
    ? (countriesRegions as { country?: string }[])
    : [];
  const names = list.map((x) => String(x?.country ?? "").trim()).filter(Boolean);
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
})();

const COUNTRY_KEY_SET = new Set(AVAILABLE_COUNTRIES.map((c) => normalizePanelCountryKey(c)));

export function isValidPanelCountryName(value: string): boolean {
  return COUNTRY_KEY_SET.has(normalizePanelCountryKey(value));
}

function filterCountries(query: string): string[] {
  const raw = query.trim();
  if (!raw) return AVAILABLE_COUNTRIES;
  const key = normalizePanelCountryKey(raw);
  if (!key) return AVAILABLE_COUNTRIES;
  return AVAILABLE_COUNTRIES.filter((c) => normalizePanelCountryKey(c).includes(key));
}

type Props = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
};

const CompanyCountryAutocomplete: FC<Props> = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const blurCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(() => filterCountries(value), [value]);

  const clearBlurTimer = useCallback(() => {
    if (blurCloseTimer.current) {
      clearTimeout(blurCloseTimer.current);
      blurCloseTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el || el.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (country: string) => {
    clearBlurTimer();
    onChange(country);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        autoComplete="off"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurCloseTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 disabled:bg-gray-100"
        placeholder="Type to filter, then pick a country"
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && !disabled && suggestions.length > 0 && (
        <ul
          className="absolute z-20 mt-0.5 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg"
          role="listbox"
        >
          {suggestions.map((c) => (
            <li key={c} role="option">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-gray-900 hover:bg-slate-100"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(c)}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CompanyCountryAutocomplete;
