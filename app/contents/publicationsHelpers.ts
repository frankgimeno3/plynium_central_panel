import type { PublicationUnified, PublicationState, Flatplan, FlatplanSlot, publicationInterface } from "./interfaces";

/**
 * Publications workflow: Data is now fetched from RDS via APIs:
 * - Published: /api/v1/publications (existing)
 * - Planned: /api/v1/planned-publications
 * - Flatplans: /api/v1/flatplans
 */

/** Fetch all published publications from the API */
export async function fetchPublishedPublications(): Promise<publicationInterface[]> {
  const res = await fetch('/api/v1/publications');
  if (!res.ok) throw new Error('Failed to fetch published publications');
  const data = await res.json();
  return data.map((p: any) => ({
    state: 'published' as PublicationState,
    id_publication: p.id_publication || p.idPublication,
    redirectionLink: p.redirection_link || p.redirectionLink || '',
    date: p.date || '',
    revista: p.revista || p.magazine || '',
    número: p.número || p.numero || '',
    publication_main_image_url: p.publication_main_image_url || p.publicationMainImageUrl || ''
  }));
}

/** Fetch all planned publications from the API */
export async function fetchPlannedPublications(): Promise<PublicationUnified[]> {
  const res = await fetch('/api/v1/planned-publications');
  if (!res.ok) throw new Error('Failed to fetch planned publications');
  return res.json();
}

/** Fetch all flatplans from the API */
export async function fetchFlatplans(): Promise<PublicationUnified[]> {
  const res = await fetch('/api/v1/flatplans');
  if (!res.ok) throw new Error('Failed to fetch flatplans');
  return res.json();
}

export type CreateFlatplanPayload = {
  id_flatplan: string;
  id_magazine: string;
  year: number;
  issue_number: number;
  edition_name?: string;
  theme?: string;
  publication_date?: string | null;
  description?: string;
};

/** Create a flatplan (persisted); issue leaves forecasted list once a row exists for magazine/year/issue. */
export async function createFlatplanApi(payload: CreateFlatplanPayload): Promise<PublicationUnified> {
  const res = await fetch('/api/v1/flatplans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = 'Failed to create flatplan';
    try {
      const j = await res.json();
      if (j?.message) msg = j.message;
    } catch {
      msg = await res.text().catch(() => msg);
    }
    throw new Error(msg);
  }
  return res.json();
}

/** Fetch all publications (all states) from APIs */
export async function fetchAllPublicationsUnified(): Promise<PublicationUnified[]> {
  const [published, planned, flatplans] = await Promise.all([
    fetchPublishedPublications().catch(() => []),
    fetchPlannedPublications().catch(() => []),
    fetchFlatplans().catch(() => [])
  ]);
  
  const publishedUnified: PublicationUnified[] = published.map(p => ({
    state: 'published' as PublicationState,
    id_publication: p.id_publication,
    id_planned_publication: '',
    id_flatplan: '',
    edition_name: '',
    theme: '',
    date: p.date,
    publication_date: '',
    redirectionLink: p.redirectionLink,
    revista: p.revista,
    número: String(p.número),
    publication_main_image_url: p.publication_main_image_url,
    id_magazine: '',
    year: null,
    issue_number: null,
    cover: null,
    inside_cover: null,
    end: null,
    pages: [],
    single_available: null,
    offeredPreferentialPages: []
  }));
  
  return [...publishedUnified, ...planned, ...flatplans];
}

/** Builds a Record of slotKey -> slot from unified item (cover, inside_cover, end + pages). */
export function publicationUnifiedToSlots(p: PublicationUnified): Record<string, FlatplanSlot> {
  const r: Record<string, FlatplanSlot> = {};
  if (p.cover) r.cover = p.cover;
  if (p.inside_cover) r.inside_cover = p.inside_cover;
  (p.pages || []).forEach((slot) => {
    const key = slot.slotKey || String((Object.keys(r).length + 1));
    r[key] = slot;
  });
  if (p.end) r.end = p.end;
  return r;
}

/** Converts PublicationUnified (state "in production") to Flatplan-like object with "1", "2", ... cover, end for backward compat. */
export function unifiedToFlatplan(p: PublicationUnified): Flatplan & Record<string, FlatplanSlot | undefined> {
  const slots = publicationUnifiedToSlots(p);
  return {
    id_flatplan: p.id_flatplan,
    edition_name: p.edition_name,
    theme: p.theme,
    publication_date: p.publication_date,
    id_magazine: p.id_magazine || undefined,
    year: p.year ?? undefined,
    issue_number: p.issue_number ?? undefined,
    offeredPreferentialPages: p.offeredPreferentialPages || [],
    ...slots,
  } as Flatplan & Record<string, FlatplanSlot | undefined>;
}

export function getPublicationsByState(
  list: PublicationUnified[],
  state: PublicationState
): PublicationUnified[] {
  return list.filter((p) => p.state === state);
}

export function getPublished(list: PublicationUnified[]) {
  return getPublicationsByState(list, "published");
}

export function getPlanned(list: PublicationUnified[]) {
  return getPublicationsByState(list, "planned");
}

export function getFlatplans(list: PublicationUnified[]): (Flatplan & Record<string, FlatplanSlot | undefined>)[] {
  return getPublicationsByState(list, "in production").map(unifiedToFlatplan);
}

/** Converts unified item to object with slot keys (cover, "1", "2", ... end) for backward compat in planned views. */
export function unifiedToPlannedSlots(p: PublicationUnified): Record<string, unknown> {
  const r: Record<string, unknown> = { ...p };
  if (p.cover) r.cover = p.cover;
  if (p.inside_cover) r.inside_cover = p.inside_cover;
  if (p.end) r.end = p.end;
  (p.pages || []).forEach((s) => {
    r[s.slotKey || ""] = s;
  });
  return r;
}
