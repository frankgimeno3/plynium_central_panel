import type { ServiceEntity } from "./types";

export type MagazineCatalogKey =
  | "single_advert"
  | "sponsored_article"
  | "double_advert"
  | "cover_page"
  | "inside_cover"
  | "premium_page"
  | "end_page";

export const REGULAR_PAGE_OPTIONS: { key: MagazineCatalogKey; label: string }[] = [
  { key: "single_advert", label: "Single Advert" },
  { key: "sponsored_article", label: "Sponsored Article" },
  { key: "double_advert", label: "Double Advert" },
];

export const PREFERENTIAL_CARD_OPTIONS: { key: MagazineCatalogKey; label: string; position?: string }[] = [
  { key: "cover_page", label: "Cover", position: "Cover page" },
  { key: "inside_cover", label: "Inside Cover", position: "Inside Cover" },
  { key: "premium_page", label: "Premium Page" },
  { key: "end_page", label: "End Page", position: "End page" },
];

const CATALOG_PATTERNS: Record<MagazineCatalogKey, RegExp> = {
  single_advert: /single[_\s-]?advert/i,
  sponsored_article: /sponsored[_\s-]?article/i,
  double_advert: /double[_\s-]?advert/i,
  cover_page: /cover[_\s-]?page/i,
  inside_cover: /inside[_\s-]?cover/i,
  premium_page: /premium[_\s-]?page|magazine_premium/i,
  end_page: /end[_\s-]?page/i,
};

function matchesCatalogKey(service: ServiceEntity, key: MagazineCatalogKey): boolean {
  const blob = `${service.name ?? ""} ${service.display_name ?? ""} ${(service as { service_full_name?: string }).service_full_name ?? ""}`;
  return CATALOG_PATTERNS[key].test(blob);
}

function magazineIdInServiceName(service: ServiceEntity, magazineId: string): boolean {
  const mid = String(magazineId ?? "").trim();
  if (!mid) return false;
  const blob = `${service.name ?? ""} ${service.display_name ?? ""}`;
  return new RegExp(`\\bmagazine\\s+${mid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(blob);
}

/** Prefer magazine-specific catalog row, else general template. */
export function findMagazineCatalogService(
  services: ServiceEntity[],
  magazineId: string,
  key: MagazineCatalogKey
): ServiceEntity | null {
  const channelMagazine = services.filter((s) => {
    const ch = String(s.service_channel ?? s.service_group_channel ?? s.service_type ?? "").toLowerCase();
    return ch === "magazine";
  });

  const specific = channelMagazine.find(
    (s) =>
      String((s as { specifity?: string }).specifity ?? "") === "specific-related" &&
      magazineIdInServiceName(s, magazineId) &&
      matchesCatalogKey(s, key)
  );
  if (specific) return specific;

  const relatedMatch = channelMagazine.find((s) => {
    if (String((s as { specifity?: string }).specifity ?? "") !== "specific-related") return false;
    if (!magazineIdInServiceName(s, magazineId)) return false;
    const parentId = String(s.related_to_other_services ?? s.service_group_id ?? "").trim();
    if (!parentId) return false;
    const parent = channelMagazine.find((p) => p.id_service === parentId);
    return parent ? matchesCatalogKey(parent, key) : matchesCatalogKey(s, key);
  });
  if (relatedMatch) return relatedMatch;

  return (
    channelMagazine.find(
      (s) => String((s as { specifity?: string }).specifity ?? "general") === "general" && matchesCatalogKey(s, key)
    ) ?? null
  );
}

export function parentGeneralServiceId(service: ServiceEntity): string {
  return String(service.related_to_other_services ?? service.service_group_id ?? service.id_service ?? "").trim();
}

export function isPreferentialCatalogKey(key: MagazineCatalogKey): boolean {
  return key === "cover_page" || key === "inside_cover" || key === "premium_page" || key === "end_page";
}

/** Page type / slot key for proposal lines — inferred from phase-2 magazine picker choice. */
export function deriveMagazinePageTypeAndSlotKey(
  catalogKey: MagazineCatalogKey,
  positionInMagazine?: string
): { pageType: string; slotKey: string } | null {
  switch (catalogKey) {
    case "single_advert":
      return { pageType: "Single page", slotKey: "1" };
    case "double_advert":
      return { pageType: "Double page", slotKey: "2" };
    case "cover_page":
      return { pageType: "Cover page", slotKey: "cover" };
    case "inside_cover":
      return { pageType: "Preferential page", slotKey: "inside_cover" };
    case "end_page":
      return { pageType: "End page", slotKey: "end" };
    case "premium_page": {
      const pos = String(positionInMagazine ?? "").trim();
      const match = pos.match(/preferential page\s+(\d+)/i);
      return { pageType: "Preferential page", slotKey: match?.[1] ?? "preferential" };
    }
    default:
      return null;
  }
}
