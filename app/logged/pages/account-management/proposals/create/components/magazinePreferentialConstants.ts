/** Keep UUIDs aligned with server `publicationPreferentialSlots.js` / RDS `service_groups`. */
export const MAGAZINE_COVER_PAGE_SERVICE_GROUP_ID = "ca229970-2a1d-4787-8d07-051e4ce43a78";
export const MAGAZINE_INSIDE_COVER_SERVICE_GROUP_ID = "71d8f1bf-4c7f-486b-8ebb-acef6aa6b5b8";
export const MAGAZINE_PREMIUM_PAGE_SERVICE_GROUP_ID = "ce71b075-d775-487a-9ca7-001e30ee896e";

const PREF_GROUPS = new Set([
  MAGAZINE_COVER_PAGE_SERVICE_GROUP_ID.toLowerCase(),
  MAGAZINE_INSIDE_COVER_SERVICE_GROUP_ID.toLowerCase(),
  MAGAZINE_PREMIUM_PAGE_SERVICE_GROUP_ID.toLowerCase(),
]);

export function isMagazinePreferentialTariffGroup(service_group_id?: string | null): boolean {
  const g = String(service_group_id ?? "").trim().toLowerCase();
  return !!g && PREF_GROUPS.has(g);
}

export function isMagazinePremiumPageGroup(service_group_id?: string | null): boolean {
  return String(service_group_id ?? "").trim().toLowerCase() === MAGAZINE_PREMIUM_PAGE_SERVICE_GROUP_ID.toLowerCase();
}

/** DB `position_in_magazine` for cover / inside cover rows. */
export function fixedPositionForServiceGroup(service_group_id?: string | null): string | null {
  const g = String(service_group_id ?? "").trim().toLowerCase();
  if (g === MAGAZINE_COVER_PAGE_SERVICE_GROUP_ID.toLowerCase()) return "Cover page";
  if (g === MAGAZINE_INSIDE_COVER_SERVICE_GROUP_ID.toLowerCase()) return "Inside Cover";
  return null;
}

export function preferentialPagePositionLabel(oneToNine: number): string {
  const n = Math.floor(Number(oneToNine));
  if (!Number.isInteger(n) || n < 1 || n > 9) return "";
  return `Preferential page ${n}`;
}
