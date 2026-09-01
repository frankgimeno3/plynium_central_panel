import type { PreferentialSlotApiRow } from "@/app/logged/pages/production/publications/publication_components/_shared";

export type PreferentialUiStatus = "sold_out" | "offered" | "available" | "soft_hold" | "reserved" | "unknown";

export function preferentialUiStatus(slot: PreferentialSlotApiRow | null | undefined): PreferentialUiStatus {
  if (!slot) return "unknown";
  const st = String(slot.state ?? "").toLowerCase();
  if (st === "bought" || Boolean(String(slot.contract_id ?? "").trim())) return "sold_out";
  if (st === "assigned") {
    if (slot.assigned_kind === "summary" || slot.assigned_kind === "advertiser_index") return "reserved";
    if (slot.assigned_kind === "customer") return "soft_hold";
    return "reserved";
  }
  if (st === "offered") return "offered";
  if (st === "available") return "available";
  if (slot.missing) return "unknown";
  return "available";
}

export function preferentialStatusLabel(status: PreferentialUiStatus): string {
  switch (status) {
    case "sold_out":
      return "Sold out";
    case "offered":
      return "Offered";
    case "available":
      return "Available";
    case "soft_hold":
      return "Soft hold — eligible";
    case "reserved":
      return "Reserved";
    default:
      return "Unknown";
  }
}

export function isPreferentialSelectable(status: PreferentialUiStatus): boolean {
  return status === "available" || status === "offered" || status === "soft_hold";
}

export function preferentialStatusClass(status: PreferentialUiStatus, selected = false): string {
  if (status === "sold_out" || status === "reserved") {
    return "border-red-300 bg-red-50 text-red-900 cursor-not-allowed opacity-90";
  }
  if (selected) return "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-200";
  if (status === "offered") return "border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400";
  if (status === "soft_hold") return "border-amber-200 bg-amber-50/80 text-amber-900 hover:border-amber-300";
  return "border-emerald-300 bg-emerald-50 text-emerald-900 hover:border-emerald-400";
}

export function slotForPosition(
  slots: PreferentialSlotApiRow[],
  position: string
): PreferentialSlotApiRow | null {
  const pos = String(position ?? "").trim();
  return slots.find((s) => String(s.position_in_magazine ?? "").trim() === pos) ?? null;
}

export function premiumPreferentialSlots(slots: PreferentialSlotApiRow[]): PreferentialSlotApiRow[] {
  return slots
    .filter((s) => /^Preferential page \d+$/i.test(String(s.position_in_magazine ?? "").trim()))
    .sort((a, b) => {
      const na = Number(String(a.position_in_magazine).replace(/[^\d]/g, ""));
      const nb = Number(String(b.position_in_magazine).replace(/[^\d]/g, ""));
      return na - nb;
    });
}
