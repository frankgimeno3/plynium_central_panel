import type { PublicationSlotPickerRow } from "./types";

export interface SortedSlot extends PublicationSlotPickerRow {
  flatplanOrder: number;
}

export function flatplanSortKey(slotKey: string): number {
  const k = String(slotKey ?? "").trim().toLowerCase();
  if (k === "cover") return -1;
  if (k === "inside_cover" || k === "inside cover") return 0;
  if (k === "end" || k === "end_page" || k === "end page") return 1_000_000;
  const n = Number(k);
  return Number.isFinite(n) ? n : 999_999;
}

export function slotDisplayName(slotKey: string): string {
  const k = String(slotKey ?? "").trim().toLowerCase();
  if (k === "cover") return "Cover";
  if (k === "inside_cover" || k === "inside cover") return "Inside cover";
  if (k === "end" || k === "end_page" || k === "end page") return "End page";
  if (k === "regular_page") return "Regular page";
  const n = Number(k);
  if (Number.isFinite(n)) return `Page ${n}`;
  return slotKey;
}

export function tonesForState(state: string): string {
  const s = String(state ?? "").trim().toLowerCase();
  if (s === "bought") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (s === "offered") return "border-amber-200 bg-amber-50 text-amber-800";
  if (s === "assigned") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-gray-200 bg-gray-50 text-gray-700";
}
