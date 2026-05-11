export function publicationEditionLabel(p: { publication_edition_name?: string; edition_name?: string; id_publication: string }): string {
  return String(p.publication_edition_name ?? p.edition_name ?? p.id_publication);
}

export function channelLabel(ch: string): string {
  const c = String(ch ?? "").toLowerCase();
  if (c === "dem") return "DEM";
  if (c === "portal") return "Portal";
  if (c === "magazine") return "Magazine";
  return ch || "—";
}

export function isMagazineAdvertService(serviceName: string): boolean {
  const s = String(serviceName ?? "").toLowerCase();
  return s.includes("advert");
}

export function monthsBetween(start: string, end: string): number {
  const d1 = new Date(start);
  const d2 = new Date(end);
  if (d2 < d1) return 0;
  return (
    (d2.getFullYear() - d1.getFullYear()) * 12 +
    (d2.getMonth() - d1.getMonth()) +
    Math.max(0, (d2.getDate() - d1.getDate()) / 30)
  );
}
