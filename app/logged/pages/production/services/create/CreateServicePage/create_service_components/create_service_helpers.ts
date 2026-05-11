import type { Channel, PublicationRow } from "./create_service_types";

export function channelLabel(ch: Channel): string {
  if (ch === "dem") return "Newsletter (dem)";
  if (ch === "portal") return "Portal";
  return "Magazine";
}

/** Preview only; authoritative id comes from POST `mint_catalog_service_id`. */
export function suggestNextCatalogServiceId(
  allServices: { id_service: string }[],
  year: number = new Date().getFullYear()
): string {
  const yr = String(year);
  const re = new RegExp(`^srv_${yr}_(\\d{5})$`);
  let max = 0;
  for (const s of allServices) {
    const id = String(s?.id_service ?? "").trim();
    const m = id.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `srv_${yr}_${String(max + 1).padStart(5, "0")}`;
}

export function getPublicationEditionLabel(p: PublicationRow): string {
  return String(p.publication_edition_name ?? p.edition_name ?? p.id_publication);
}

export function publicationYearsDescending(pubs: PublicationRow[]): number[] {
  const ys = new Set<number>();
  for (const p of pubs) {
    const y = p.publication_year;
    const n = y == null ? NaN : Number(y);
    if (Number.isFinite(n)) ys.add(Math.trunc(n));
  }
  return Array.from(ys).sort((a, b) => b - a);
}
