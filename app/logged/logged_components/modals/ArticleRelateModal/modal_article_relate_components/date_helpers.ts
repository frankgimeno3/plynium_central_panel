import type { DateParts } from "./types";

export const EMPTY_DATE_PARTS: DateParts = { day: "", month: "", year: "" };

export function partsToIso(parts: DateParts, endOfDay = false): string | null {
  const day = Number(parts.day);
  const month = Number(parts.month);
  const year = Number(parts.year);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (year < 1000 || month < 1 || month > 12) return null;
  const lastDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > lastDay) return null;
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  return `${year}-${mm}-${dd}${endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z"}`;
}

export function datePartsEmpty(parts: DateParts): boolean {
  return !parts.day.trim() && !parts.month.trim() && !parts.year.trim();
}
