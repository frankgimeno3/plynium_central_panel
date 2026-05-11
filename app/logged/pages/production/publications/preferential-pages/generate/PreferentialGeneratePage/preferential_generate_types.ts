import type { Magazine } from "@/app/contents/interfaces";
import type { PreferentialSlotApiRow } from "../../../[id_publication]/_shared";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  1: "Select magazines",
  2: "Select publications",
  3: "Review slots",
  4: "Summary",
  5: "Creating slots",
};

export type PublicationRow = {
  id_publication: string;
  publication_edition_name: string;
  publication_status: string;
  publication_year: number | null;
  magazine_this_year_issue: number | null;
};

export type MagazinePublicationsPlan = {
  magazine: Magazine;
  publications: PublicationRow[];
  loadError: string | null;
};

export type PublicationSlotReview = {
  magazineId: string;
  magazineName: string;
  publication: PublicationRow;
  slots: PreferentialSlotApiRow[];
  loadError: string | null;
};

export type CreationQueueItem = {
  publicationId: string;
  publicationLabel: string;
  magazineName: string;
  positions: string[];
};

export function normalizeMagazines(data: unknown): Magazine[] {
  if (Array.isArray(data)) return data as Magazine[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: Magazine[] }).data;
  }
  return [];
}

export function normalizePublications(data: unknown): PublicationRow[] {
  if (!Array.isArray(data)) return [];
  return data.map((row) => {
    const item = row as Record<string, unknown>;
    return {
      id_publication: String(item.id_publication ?? ""),
      publication_edition_name: String(item.publication_edition_name ?? ""),
      publication_status: String(item.publication_status ?? ""),
      publication_year: item.publication_year != null ? Number(item.publication_year) : null,
      magazine_this_year_issue:
        item.magazine_this_year_issue != null ? Number(item.magazine_this_year_issue) : null,
    };
  });
}
