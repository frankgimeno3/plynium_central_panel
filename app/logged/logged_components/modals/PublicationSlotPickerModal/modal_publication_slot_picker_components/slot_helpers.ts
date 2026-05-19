import type { PublicationSlotPickerRow } from "./types";

export interface SortedSlot extends PublicationSlotPickerRow {
  flatplanOrder: number;
}

export function flatplanSortKey(slotKey: string, slotOrdinal?: number | null): number {
  if (slotOrdinal != null && Number.isFinite(Number(slotOrdinal))) {
    return Number(slotOrdinal);
  }
  const k = String(slotKey ?? "").trim().toLowerCase();
  if (k === "cover") return -1;
  if (k === "inside_cover" || k === "inside cover") return 0;
  if (k === "end" || k === "end_page" || k === "end page") return 1_000_000;
  if (k === "preferential_page") return 500_000;
  if (k === "regular_page") return 800_000;
  const n = Number(k);
  return Number.isFinite(n) ? n : 999_999;
}

export function slotDisplayName(slotKey: string, publicationPage?: number | null): string {
  const k = String(slotKey ?? "").trim().toLowerCase();
  if (k === "cover") return "Cover";
  if (k === "inside_cover" || k === "inside cover") return "Inside cover";
  if (k === "end" || k === "end_page" || k === "end page") return "End page";
  if (k === "regular_page") return "Regular page";
  if (k === "preferential_page" && publicationPage != null && Number.isFinite(Number(publicationPage))) {
    return `Preferential page ${Math.round(Number(publicationPage))}`;
  }
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

/** Pill styles for slot state on dark table rows (PublicationSlotPicker). */
export function tonesForStateOnDark(state: string): string {
  const s = String(state ?? "").trim().toLowerCase();
  if (s === "bought") return "border-emerald-500/50 bg-emerald-950/70 text-white";
  if (s === "offered") return "border-amber-500/50 bg-amber-950/70 text-white";
  if (s === "assigned") return "border-blue-500/50 bg-blue-950/70 text-white";
  if (s === "pending") return "border-slate-500 bg-slate-800 text-white";
  return "border-slate-500 bg-slate-800/90 text-white";
}
