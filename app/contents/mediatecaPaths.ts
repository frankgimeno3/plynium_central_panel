/**
 * Default folder paths for MediatecaModal `initialPath`.
 * Must match server mediateca tree (see `server/features/folder/FolderService.js` and
 * `app/logged/pages/mediateca/[[...path]]/page.tsx` protected paths).
 */
export const COMPANIES_MEDIA_LIBRARY_PATH =
  "Structural media/Network media/directory media/companies media";

export const PRODUCTS_MEDIA_LIBRARY_PATH =
  "Structural media/Network media/directory media/products media";

/**
 * Parent folder for every magazine publication. Each publication owns a
 * subfolder named after `publication_edition_name`; use
 * `magazinePublicationMediaLibraryPath(name)` to build the full path.
 */
export const MAGAZINES_MEDIA_LIBRARY_PATH =
  "Structural media/Production media/publications media/magazines media";

/** Under each magazine publication folder (matches server). */
export const PUBLICATION_ARTICLES_MEDIA_FOLDER_NAME = "articles media";

export const PUBLICATION_ADVERTS_MEDIA_FOLDER_NAME = "adverts media";

/** Stable folder for the issue cover advert, independent from the cover slot row id. */
export const PUBLICATION_COVER_ADVERT_FOLDER_NAME = "cover";

/** Full cover composite for flatplan (under each advert slot folder, e.g. cover slot). */
export const PUBLICATION_ADVERT_SLOT_FINAL_FOLDER_NAME = "final";

/** Auto-generated advert index PDF (one per publication). */
export const PUBLICATION_INDEX_FOLDER_NAME = "index";

/** Auto-generated article summary PDF (one per publication). */
export const PUBLICATION_SUMMARY_FOLDER_NAME = "summary";

export function magazinePublicationMediaLibraryPath(editionName: string | null | undefined): string {
  const trimmed = String(editionName ?? "").trim();
  if (!trimmed) return MAGAZINES_MEDIA_LIBRARY_PATH;
  return `${MAGAZINES_MEDIA_LIBRARY_PATH}/${trimmed}`;
}

/**
 * Materials for one magazine article page slot (network article id + slot id).
 */
export function articleSlotMaterialsMediatecaPath(
  editionName: string | null | undefined,
  articleId: string | null | undefined,
  slotId: number
): string {
  const base = magazinePublicationMediaLibraryPath(editionName);
  const aid = String(articleId ?? "").trim();
  const sid = Number(slotId);
  if (!aid || !Number.isFinite(sid) || sid <= 0) return base;
  return `${base}/${PUBLICATION_ARTICLES_MEDIA_FOLDER_NAME}/${aid}/slot_${sid}`;
}

/** Materials for one advert slot (cover or advert page). */
export function advertSlotMaterialsMediatecaPath(
  editionName: string | null | undefined,
  slotId: number
): string {
  const base = magazinePublicationMediaLibraryPath(editionName);
  const sid = Number(slotId);
  if (!Number.isFinite(sid) || sid <= 0) {
    return `${base}/${PUBLICATION_ADVERTS_MEDIA_FOLDER_NAME}`;
  }
  return `${base}/${PUBLICATION_ADVERTS_MEDIA_FOLDER_NAME}/slot_${sid}`;
}

/** Raw cover advert assets (`…/adverts media/cover/`). */
export function coverAdvertMaterialsMediatecaPath(
  editionName: string | null | undefined
): string {
  const base = magazinePublicationMediaLibraryPath(editionName);
  return `${base}/${PUBLICATION_ADVERTS_MEDIA_FOLDER_NAME}/${PUBLICATION_COVER_ADVERT_FOLDER_NAME}`;
}

/** Flatplan composite image for one advert slot (cover uses cover slot id). */
export function advertSlotMaterialsFinalMediatecaPath(
  editionName: string | null | undefined,
  slotId: number
): string {
  return `${advertSlotMaterialsMediatecaPath(editionName, slotId)}/${PUBLICATION_ADVERT_SLOT_FINAL_FOLDER_NAME}`;
}

/** Full cover composite (`…/adverts media/cover/final/`). */
export function coverAdvertMaterialsFinalMediatecaPath(
  editionName: string | null | undefined
): string {
  return `${coverAdvertMaterialsMediatecaPath(editionName)}/${PUBLICATION_ADVERT_SLOT_FINAL_FOLDER_NAME}`;
}

/** Auto-generated advert index PDF folder (`…/{edition}/index/`). */
export function publicationIndexMediatecaPath(
  editionName: string | null | undefined
): string {
  const base = magazinePublicationMediaLibraryPath(editionName);
  return `${base}/${PUBLICATION_INDEX_FOLDER_NAME}`;
}

/** Auto-generated article summary PDF folder (`…/{edition}/summary/`). */
export function publicationSummaryMediatecaPath(
  editionName: string | null | undefined
): string {
  const base = magazinePublicationMediaLibraryPath(editionName);
  return `${base}/${PUBLICATION_SUMMARY_FOLDER_NAME}`;
}
