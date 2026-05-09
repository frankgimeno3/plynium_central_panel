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

export function magazinePublicationMediaLibraryPath(editionName: string | null | undefined): string {
  const trimmed = String(editionName ?? "").trim();
  if (!trimmed) return MAGAZINES_MEDIA_LIBRARY_PATH;
  return `${MAGAZINES_MEDIA_LIBRARY_PATH}/${trimmed}`;
}
