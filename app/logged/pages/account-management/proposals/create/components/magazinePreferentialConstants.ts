/** Preferential tariff general services (legacy UUIDs + name patterns after migration 057). */
export const MAGAZINE_COVER_PAGE_SERVICE_GROUP_ID = "ca229970-2a1d-4787-8d07-051e4ce43a78";
export const MAGAZINE_INSIDE_COVER_SERVICE_GROUP_ID = "71d8f1bf-4c7f-486b-8ebb-acef6aa6b5b8";
export const MAGAZINE_PREMIUM_PAGE_SERVICE_GROUP_ID = "ce71b075-d775-487a-9ca7-001e30ee896e";
export const MAGAZINE_END_PAGE_SERVICE_GROUP_ID = "ff45b327-2073-4354-83a5-b5a0ca6b648e";

const PREF_GROUP_IDS = new Set([
  MAGAZINE_COVER_PAGE_SERVICE_GROUP_ID.toLowerCase(),
  MAGAZINE_INSIDE_COVER_SERVICE_GROUP_ID.toLowerCase(),
  MAGAZINE_PREMIUM_PAGE_SERVICE_GROUP_ID.toLowerCase(),
  MAGAZINE_END_PAGE_SERVICE_GROUP_ID.toLowerCase(),
  "a2e21f90-c216-487f-87dc-907dece4be7a",
  "cd71b675-d775-407a-9cd7-051c50cb00b8",
]);

const PREF_NAME_RE =
  /cover[_\s-]?page|inside[_\s-]?cover|premium[_\s-]?page|end[_\s-]?page|magazine_cover|magazine_end|preferential/i;

export function isMagazinePreferentialTariffGroup(
  service_group_id?: string | null,
  serviceName?: string | null
): boolean {
  const g = String(service_group_id ?? "").trim().toLowerCase();
  if (g && PREF_GROUP_IDS.has(g)) return true;
  const name = String(serviceName ?? "").trim();
  return !!name && PREF_NAME_RE.test(name);
}

export function isMagazinePremiumPageGroup(service_group_id?: string | null, serviceName?: string | null): boolean {
  const g = String(service_group_id ?? "").trim().toLowerCase();
  if (
    g === MAGAZINE_PREMIUM_PAGE_SERVICE_GROUP_ID.toLowerCase() ||
    g === "cd71b675-d775-407a-9cd7-051c50cb00b8"
  ) {
    return true;
  }
  return /premium[_\s-]?page|preferential/i.test(String(serviceName ?? ""));
}

/** DB `position_in_magazine` for cover / inside cover rows. */
export function fixedPositionForServiceGroup(service_group_id?: string | null, serviceName?: string | null): string | null {
  const g = String(service_group_id ?? "").trim().toLowerCase();
  const name = String(serviceName ?? "").toLowerCase();
  if (g === MAGAZINE_COVER_PAGE_SERVICE_GROUP_ID.toLowerCase() || /cover[_\s-]?page/.test(name)) return "Cover page";
  if (g === MAGAZINE_INSIDE_COVER_SERVICE_GROUP_ID.toLowerCase() || /inside[_\s-]?cover/.test(name)) return "Inside Cover";
  if (g === MAGAZINE_END_PAGE_SERVICE_GROUP_ID.toLowerCase() || /end[_\s-]?page/.test(name)) return "End page";
  return null;
}

export function preferentialPagePositionLabel(oneToNine: number): string {
  const n = Math.floor(Number(oneToNine));
  if (!Number.isInteger(n) || n < 1 || n > 9) return "";
  return `Preferential page ${n}`;
}
