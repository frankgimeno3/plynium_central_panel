"use client";

import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MediatecaModal, {
  type MediatecaContent,
} from "@/app/logged/logged_components/modals/MediatecaModal";
import {
  articleMaterialsMediatecaPath,
  articleSlotMaterialsMediatecaPath,
} from "@/app/contents/mediatecaPaths";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import { writeChunkImageSrc } from "../../articleChunkPlainTextEditing";
import { useArticleChunkAutosave } from "../../useArticleChunkAutosave";
import {
  findAreaContainingCell,
  findMergeableAreaForCell,
  mergeCells,
  placementFromCells,
  type GridCell,
  type ImageAreaSelection,
  type MergeableAreaPair,
} from "../../article_image_manager/articleImagePlacement";
import {
  areaCodesToPlacement,
  areaPairDeclineKey,
  buildSimpleImageChunkHtml,
  cellsToAreaCodes,
  defaultColumnAreaCode,
} from "../../article_image_manager/articleAreaCodes";
import {
  ArticleBuilderDeleteOverlayImageModal,
  ArticleBuilderImageAreaMergeModal,
  ArticleBuilderImageAreaPickerModal,
  type AreaImageDraft,
} from "../../ArticleBuilderImageAreaModals";
import { isOverlayImageChunk } from "../../article_image_manager/articleImagePlacement";
import { buildArticleFlowPagesFromPublicationSlots } from "../../magazineArticleColumnFlow";
import type { MagazinePageLayout } from "../../magazinePageLayout";
import { PAGE_THUMB_ASPECT } from "../constants";
import type { ArticleMeta, PublicationArticleChunk, PublicationArticleRow } from "../types";
import { ArticleBuilderPagePreviewThumbnail } from "./ArticleBuilderPagePreviewThumbnail";

/** Generates a stable-enough id without needing `crypto.randomUUID` polyfills. */
function newAreaId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      /* fall through */
    }
  }
  return `area_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function createAreaFromCell(cell: GridCell): ImageAreaSelection {
  const placement = {
    colStart: cell.col,
    colEnd: cell.col,
    rowStart: cell.row,
    rowEnd: cell.row,
  };
  return {
    id: newAreaId(),
    cells: [cell],
    placement,
    areaCodes: cellsToAreaCodes([cell]),
  };
}

type PageCell =
  | {
      kind: "page";
      slotId: number;
      articleIdx: number;
      magazinePage: number | null;
      isLeftPage: boolean;
    }
  | { kind: "starts-on-right" }
  | { kind: "add-new" }
  | { kind: "empty" };

type SpreadRow = readonly [PageCell, PageCell];

/**
 * Build the list of magazine spreads (rows of 2 cells: left + right) for the
 * Article editor tab. The first article page anchors to a left or right cell
 * depending on the parity of its magazine page; the remaining article pages
 * fill cells in reading order.
 *
 * After the last article page, an "add new page" cell is appended at the next
 * available position. When that cell lands on the left of a fresh row, an
 * empty placeholder is added on the right of the same row. When the article
 * is empty, a single row with `[add-new, empty]` is returned so the user can
 * still create the first page.
 */
function buildSpreadRows(
  slotIds: number[],
  pageBySlot: Record<number, number>
): SpreadRow[] {
  const firstSlot = slotIds[0];
  const firstMagPage = firstSlot != null ? pageBySlot[firstSlot] : undefined;
  // Magazine convention: odd publication_page = right (recto), even = left (verso).
  // Default to "left" when we don't yet know — usually the safer guess and the
  // layout snaps once the slot data arrives.
  const firstIsLeft = firstMagPage != null ? firstMagPage % 2 === 0 : true;

  const rows: SpreadRow[] = [];
  let buffer: PageCell[] = [];

  const flush = () => {
    if (buffer.length === 2) {
      rows.push([buffer[0]!, buffer[1]!] as const);
      buffer = [];
    }
  };

  if (slotIds.length > 0 && !firstIsLeft) {
    buffer.push({ kind: "starts-on-right" });
  }

  slotIds.forEach((slotId, idx) => {
    const mag = pageBySlot[slotId] ?? null;
    // Cell parity is determined by the cell's index in the buffer (0 = left,
    // 1 = right), which already accounts for the starts-on-right placeholder.
    const isLeftPage = buffer.length === 0;
    buffer.push({
      kind: "page",
      slotId,
      articleIdx: idx + 1,
      magazinePage: mag,
      isLeftPage,
    });
    flush();
  });

  if (buffer.length === 0) {
    // "+" starts a fresh row on the left → empty placeholder on the right.
    buffer.push({ kind: "add-new" });
    buffer.push({ kind: "empty" });
  } else {
    // Last article page is on the left of the current row; "+" sits next to
    // it on the right and no extra empty placeholder is needed.
    buffer.push({ kind: "add-new" });
  }
  flush();

  return rows;
}

function PageBoxFrame({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full ${className}`}
      style={{ aspectRatio: PAGE_THUMB_ASPECT }}
    >
      {children}
    </div>
  );
}

function StartsOnRightPlaceholder() {
  return (
    <PageBoxFrame className="rounded-sm border border-gray-200/70 bg-white/40 shadow-md">
      <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm font-medium text-gray-500">
        the article starts on a right page
      </div>
    </PageBoxFrame>
  );
}

function AddNewPagePlaceholder({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group block w-full text-left disabled:cursor-not-allowed disabled:opacity-60"
    >
      <PageBoxFrame className="rounded-sm border border-dashed border-gray-300 bg-white/40 shadow-md transition group-hover:border-blue-400 group-hover:bg-white/70">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <span
            aria-hidden
            className="text-5xl font-light leading-none text-gray-400 transition group-hover:text-blue-500"
          >
            +
          </span>
          <span className="text-xs font-medium text-gray-500 transition group-hover:text-blue-600">
            {disabled ? "Adding page…" : "Click to add a new page on the article"}
          </span>
        </div>
      </PageBoxFrame>
    </button>
  );
}

function EmptyPlaceholder() {
  return <PageBoxFrame className="opacity-0" />;
}

type ArticleBuilderEditorPagesViewProps = {
  publicationArticle: PublicationArticleRow;
  articleMeta: ArticleMeta | null;
  chunks: PublicationArticleChunk[];
  setChunks: React.Dispatch<React.SetStateAction<PublicationArticleChunk[]>>;
  articleFlowPages: ReturnType<typeof buildArticleFlowPagesFromPublicationSlots>;
  magazinePageLayout: MagazinePageLayout;
  slotPublicationPageBySlotId: Record<number, number>;
  addingPage: boolean;
  deletingPage: boolean;
  onAddPage: () => void;
  onDeletePage: (slotId: number) => void;
  onSaveMessage?: (message: string | null) => void;
  onSaveError?: (message: string | null) => void;
};

export const ArticleBuilderEditorPagesView: FC<ArticleBuilderEditorPagesViewProps> = ({
  publicationArticle,
  articleMeta,
  chunks,
  setChunks,
  articleFlowPages,
  magazinePageLayout,
  slotPublicationPageBySlotId,
  addingPage,
  deletingPage,
  onAddPage,
  onDeletePage,
  onSaveMessage,
  onSaveError,
}) => {
  const { scheduleChunkHtmlChange, saveChunkHtmlNow, savingChunkIds } =
    useArticleChunkAutosave({ setChunks, onSaveMessage, onSaveError });

  const publicationArticleId = publicationArticle.publication_article_id;
  const slotsIdArray = publicationArticle.publication_slots_id_array;

  // Make sure every article page has at least `columnCount` body text chunks
  // (only_text + text_image + image_text count as text-bearing). Any missing
  // ones are POSTed as empty `only_text` chunks appended at the end of the
  // page so the layout always has an editable textarea per column. The ref
  // guard ensures we don't fire the same ensure twice while chunks state
  // catches up, and it resets when the article id changes.
  const ensuredSlotsRef = useRef<{ articleId: string | null; slots: Set<number> }>(
    { articleId: null, slots: new Set() }
  );
  useEffect(() => {
    if (ensuredSlotsRef.current.articleId !== publicationArticleId) {
      ensuredSlotsRef.current = { articleId: publicationArticleId, slots: new Set() };
    }
    const slotIds = (Array.isArray(slotsIdArray) ? slotsIdArray : [])
      .map(Number)
      .filter((sid) => Number.isFinite(sid) && sid > 0);
    if (slotIds.length === 0) return;
    const columnCount = magazinePageLayout === "3_col_article" ? 3 : 2;

    const tasks: {
      slotId: number;
      toCreate: number;
      baseLastPos: number;
      startingTextCount: number;
    }[] = [];
    for (const slotId of slotIds) {
      if (ensuredSlotsRef.current.slots.has(slotId)) continue;
      const slotChunks = chunks.filter(
        (c) => chunkPublicationSlotId(c) === slotId
      );
      const textChunks = slotChunks.filter((c) => {
        const fmt = String(c.publication_article_chunk_format ?? "").toLowerCase();
        if (fmt === "title" || fmt === "subtitle") return false;
        if (fmt === "only_image") return false;
        return true;
      });
      if (textChunks.length >= columnCount) {
        ensuredSlotsRef.current.slots.add(slotId);
        continue;
      }
      const baseLastPos = slotChunks.reduce(
        (acc, c) => Math.max(acc, c.chunk_position),
        -1
      );
      tasks.push({
        slotId,
        toCreate: columnCount - textChunks.length,
        baseLastPos,
        startingTextCount: textChunks.length,
      });
    }
    if (tasks.length === 0) return;

    for (const t of tasks) ensuredSlotsRef.current.slots.add(t.slotId);

    // IMPORTANT: don't tie this async work to the effect's cleanup. Each
    // successful POST triggers `setChunks`, which re-runs the effect; an
    // effect-scoped `cancelled` flag would abort after the first chunk and
    // the remaining ones would never be created (slot is already marked as
    // ensured, so the re-run wouldn't reschedule them either). Instead we
    // guard each iteration against the article id changing under us.
    const articleIdAtStart = publicationArticleId;
    (async () => {
      for (const task of tasks) {
        for (let i = 1; i <= task.toCreate; i++) {
          if (ensuredSlotsRef.current.articleId !== articleIdAtStart) return;
          try {
            const res = await fetch(
              `/api/v1/publication-articles/${encodeURIComponent(
                articleIdAtStart
              )}/chunks`,
              {
                method: "POST",
                headers: { "content-type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  publication_article_chunk_format: "only_text",
                  chunk_html: "",
                  chunk_position: task.baseLastPos + i,
                  publication_slot_id: task.slotId,
                  chunk_area_array: (() => {
                    const code = defaultColumnAreaCode(
                      task.startingTextCount + i - 1
                    );
                    return code ? [code] : [];
                  })(),
                }),
              }
            );
            if (!res.ok) continue;
            const created = (await res.json()) as PublicationArticleChunk;
            if (ensuredSlotsRef.current.articleId !== articleIdAtStart) return;
            setChunks((prev) => [...prev, created]);
          } catch {
            /* best-effort; will be retried next time the article is loaded */
          }
        }
      }
    })();
  }, [
    chunks,
    slotsIdArray,
    magazinePageLayout,
    publicationArticleId,
    setChunks,
  ]);

  const [editionName, setEditionName] = useState<string | null>(null);
  /** `slot_article_id` from RDS — folder names use this, not always `publicationArticle.article_id`. */
  const [slotArticleIdForMediateca, setSlotArticleIdForMediateca] = useState<
    string | null
  >(null);
  const publicationId = publicationArticle.publication_id;
  useEffect(() => {
    let cancelled = false;
    if (!publicationId) {
      setEditionName(null);
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/v1/publications-db/${encodeURIComponent(publicationId)}`,
          { cache: "no-store", credentials: "include" }
        );
        if (!res.ok) {
          if (!cancelled) setEditionName(null);
          return;
        }
        const json = (await res.json()) as { publication_edition_name?: string };
        if (!cancelled) {
          setEditionName(String(json?.publication_edition_name ?? "").trim() || null);
        }
      } catch {
        if (!cancelled) setEditionName(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicationId]);

  /**
   * Mediateca selection has two possible kinds of consumer:
   *   - `chunk`: regular "Update image" on a media chunk (existing flow).
   *   - `image-area-draft`: the user is picking an image for one of the
   *     floating areas chosen via the "Add images" flow (new flow).
   * Only one is ever open at a time.
   */
  type MediatecaTarget =
    | { kind: "chunk"; chunkId: string; slotId: number | null }
    | { kind: "image-area-draft"; areaId: string };
  const [mediatecaTarget, setMediatecaTarget] = useState<MediatecaTarget | null>(
    null
  );

  const handleChunkImageUpdate = useCallback(
    (chunkId: string) => {
      const chunk = chunks.find((c) => c.publication_article_chunk_id === chunkId);
      if (!chunk) return;
      setMediatecaTarget({
        kind: "chunk",
        chunkId,
        slotId:
          typeof chunk.publication_slot_id === "number" && chunk.publication_slot_id > 0
            ? chunk.publication_slot_id
            : null,
      });
    },
    [chunks]
  );

  const mediatecaArticleId =
    slotArticleIdForMediateca ?? publicationArticle.article_id;

  const mediatecaPathForSlot = useCallback(
    (slotId: number | null | undefined) => {
      const sid = typeof slotId === "number" && slotId > 0 ? slotId : null;
      if (sid != null) {
        return articleSlotMaterialsMediatecaPath(
          editionName,
          mediatecaArticleId,
          sid
        );
      }
      return articleMaterialsMediatecaPath(editionName, mediatecaArticleId);
    },
    [editionName, mediatecaArticleId]
  );

  const [addingChunk, setAddingChunk] = useState(false);

  /* -----------------------------------------------------------------------
   * "Add images" flow — per-page floating-image area picker.
   *
   * The flow is page-scoped: the user enters add-images mode by clicking
   * "Add images" on a specific page's toolbar; only that page shows the
   * red-bordered area grid. Selected areas live in `imageAreas`. Whenever a
   * mergeable pair appears (vertically adjacent in a column, horizontally
   * adjacent across columns, or 2×2 / 2×3 / 3×2 blocks), we prompt the user
   * for confirmation. Pairs the user declines are remembered in
   * `declinedMergePairKeys` so we don't keep re-asking after every click.
   *
   * Once the user clicks "Add (y) images", we open the picker modal with one
   * `AreaImageDraft` per area. From there the user picks an image per area
   * via Mediateca; clicking "Apply" persists each area as a new `only_image`
   * overlay chunk on the page.
   * --------------------------------------------------------------------- */
  const [addImagesSlotId, setAddImagesSlotId] = useState<number | null>(null);
  const [imageAreas, setImageAreas] = useState<ImageAreaSelection[]>([]);
  const [declinedMergePairKeys, setDeclinedMergePairKeys] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const [pendingMergePair, setPendingMergePair] =
    useState<MergeableAreaPair | null>(null);
  const [pickerDrafts, setPickerDrafts] = useState<AreaImageDraft[] | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [savingOverlays, setSavingOverlays] = useState(false);
  const [pendingDeleteOverlayChunkId, setPendingDeleteOverlayChunkId] =
    useState<string | null>(null);
  const [deletingOverlayImage, setDeletingOverlayImage] = useState(false);

  const ensureSlotMediatecaFolder = useMemo(() => {
    if (!mediatecaTarget || !publicationId) return undefined;
    const slotId =
      mediatecaTarget.kind === "image-area-draft"
        ? addImagesSlotId
        : mediatecaTarget.slotId;
    if (typeof slotId === "number" && slotId > 0) {
      return { publicationId, slotId };
    }
    return undefined;
  }, [mediatecaTarget, addImagesSlotId, publicationId]);

  const mediatecaSlotIdForFetch = useMemo(() => {
    if (!mediatecaTarget) return null;
    if (mediatecaTarget.kind === "image-area-draft") return addImagesSlotId;
    return mediatecaTarget.slotId;
  }, [mediatecaTarget, addImagesSlotId]);

  useEffect(() => {
    let cancelled = false;
    const slotId = mediatecaSlotIdForFetch;
    if (slotId == null || slotId <= 0) {
      setSlotArticleIdForMediateca(null);
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/v1/publication-slots/${encodeURIComponent(String(slotId))}`,
          { cache: "no-store", credentials: "include" }
        );
        if (!res.ok) {
          if (!cancelled) setSlotArticleIdForMediateca(null);
          return;
        }
        const json = (await res.json()) as { slot_article_id?: string | null };
        const fromSlot = String(json?.slot_article_id ?? "").trim();
        if (!cancelled) {
          setSlotArticleIdForMediateca(
            fromSlot || publicationArticle.article_id || null
          );
        }
      } catch {
        if (!cancelled) setSlotArticleIdForMediateca(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mediatecaSlotIdForFetch, publicationArticle.article_id]);

  const mediatecaInitialPath = useMemo(() => {
    if (!mediatecaTarget || ensureSlotMediatecaFolder) return undefined;
    if (!editionName?.trim()) return undefined;
    if (mediatecaTarget.kind === "image-area-draft") {
      return mediatecaPathForSlot(addImagesSlotId);
    }
    return mediatecaPathForSlot(mediatecaTarget.slotId);
  }, [
    mediatecaTarget,
    ensureSlotMediatecaFolder,
    addImagesSlotId,
    mediatecaPathForSlot,
    editionName,
  ]);

  const columnCountForCurrentPage = useMemo(
    () => (magazinePageLayout === "3_col_article" ? 3 : 2),
    [magazinePageLayout]
  );

  const resetImageAreasState = useCallback(() => {
    setImageAreas([]);
    setDeclinedMergePairKeys(new Set());
    setPendingMergePair(null);
    setPickerDrafts(null);
    setPickerError(null);
  }, []);

  const handleAddImagesClick = useCallback(
    (slotId: number) => {
      if (addImagesSlotId === slotId) {
        if (imageAreas.length === 0) {
          setAddImagesSlotId(null);
          resetImageAreasState();
        } else {
          // One card per distinct footprint (merged areas = one card).
          const drafts: AreaImageDraft[] = imageAreas.map((a) => {
            const areaCodes =
              a.areaCodes?.length ? a.areaCodes : cellsToAreaCodes(a.cells);
            return {
              id: a.id,
              areaCodes,
              placement:
                a.placement ??
                areaCodesToPlacement(areaCodes, columnCountForCurrentPage)!,
              imageUrl: null,
              imageAlt: null,
              mediaName: null,
            };
          });
          setPickerDrafts(drafts);
          setPickerError(null);
        }
      } else {
        setAddImagesSlotId(slotId);
        resetImageAreasState();
      }
    },
    [addImagesSlotId, imageAreas, resetImageAreasState, columnCountForCurrentPage]
  );

  const handleCancelImageAreaSelection = useCallback(() => {
    setAddImagesSlotId(null);
    resetImageAreasState();
  }, [resetImageAreasState]);

  /**
   * A grid cell was clicked. If it touches an existing selection and both
   * footprints form a rectangle, we ask once whether to merge — we do not
   * auto-scan all pairs (that caused repeated popups and inverted behaviour).
   */
  const handleImageAreaCellClick = useCallback(
    (slotId: number, cell: GridCell) => {
      if (addImagesSlotId !== slotId) return;
      if (pendingMergePair) return;

      setImageAreas((prev) => {
        if (findAreaContainingCell(prev, cell)) return prev;

        const mergeTarget = findMergeableAreaForCell(prev, cell);
        const newArea = createAreaFromCell(cell);

        if (mergeTarget) {
          const pairKey = areaPairDeclineKey(
            mergeTarget.areaCodes ?? cellsToAreaCodes(mergeTarget.cells),
            newArea.areaCodes ?? cellsToAreaCodes(newArea.cells)
          );
          if (!declinedMergePairKeys.has(pairKey)) {
            const mergedCells = mergeCells(mergeTarget.cells, newArea.cells);
            const mergedPlacement = placementFromCells(mergedCells);
            if (mergedPlacement) {
              setPendingMergePair({
                areaIds: [mergeTarget.id, newArea.id],
                areas: [mergeTarget, newArea],
                mergedPlacement,
              });
              return prev;
            }
          }
        }

        return [...prev, newArea];
      });
    },
    [addImagesSlotId, pendingMergePair, declinedMergePairKeys]
  );

  const handleImageAreaRemove = useCallback((areaId: string) => {
    setImageAreas((prev) => prev.filter((a) => a.id !== areaId));
    // Drop any declined pair that referenced this area — its key is now
    // moot, and we want fresh prompts if a future selection re-creates the
    // same shape.
    setDeclinedMergePairKeys((prev) => {
      const next = new Set<string>();
      for (const key of prev) {
        if (!key.includes(areaId)) next.add(key);
      }
      return next;
    });
  }, []);

  const handleConfirmMerge = useCallback(() => {
    const current = pendingMergePair;
    if (!current) return;
    const [a, b] = current.areas;
    const mergedCells = mergeCells(a.cells, b.cells);
    const mergedPlacement = placementFromCells(mergedCells);
    if (!mergedPlacement) {
      setPendingMergePair(null);
      return;
    }
    setImageAreas((prev) => {
      const remaining = prev.filter((x) => x.id !== a.id);
      const merged: ImageAreaSelection = {
        id: newAreaId(),
        cells: mergedCells,
        placement: mergedPlacement,
        areaCodes: cellsToAreaCodes(mergedCells),
      };
      return [...remaining, merged];
    });
    setPendingMergePair(null);
  }, [pendingMergePair]);

  const handleDeclineMerge = useCallback(() => {
    const current = pendingMergePair;
    if (!current) return;
    const [a, b] = current.areas;
    const key = areaPairDeclineKey(
      a.areaCodes ?? cellsToAreaCodes(a.cells),
      b.areaCodes ?? cellsToAreaCodes(b.cells)
    );
    setDeclinedMergePairKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setImageAreas((prev) => {
      if (findAreaContainingCell(prev, b.cells[0]!)) return prev;
      return [...prev, b];
    });
    setPendingMergePair(null);
  }, [pendingMergePair]);

  const reloadArticleChunks = useCallback(async () => {
    const listRes = await fetch(
      `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/chunks`,
      { cache: "no-store", credentials: "include" }
    );
    if (!listRes.ok) return;
    const listJson = (await listRes.json()) as {
      items?: PublicationArticleChunk[];
    };
    if (Array.isArray(listJson.items)) {
      setChunks(listJson.items);
    }
  }, [publicationArticleId, setChunks]);

  const handleOverlayImageDeleteRequest = useCallback((chunkId: string) => {
    const chunk = chunks.find((c) => c.publication_article_chunk_id === chunkId);
    if (!chunk) return;
    if (
      !isOverlayImageChunk(
        chunk.chunk_html,
        chunk.publication_article_chunk_format,
        chunk.chunk_area_array
      )
    ) {
      return;
    }
    setPendingDeleteOverlayChunkId(chunkId);
  }, [chunks]);

  const handleCancelDeleteOverlayImage = useCallback(() => {
    if (deletingOverlayImage) return;
    setPendingDeleteOverlayChunkId(null);
  }, [deletingOverlayImage]);

  const handleConfirmDeleteOverlayImage = useCallback(
    async (alsoDeleteFromMediateca: boolean) => {
    const chunkId = pendingDeleteOverlayChunkId;
    if (!chunkId || deletingOverlayImage) return;
    setDeletingOverlayImage(true);
    try {
      const query = alsoDeleteFromMediateca ? "?delete_mediateca=true" : "";
      const res = await fetch(
        `/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}${query}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to delete image.");
      }
      await reloadArticleChunks();
      onSaveMessage?.(
        alsoDeleteFromMediateca
          ? "Image removed from the page and Mediateca."
          : "Image removed."
      );
      setPendingDeleteOverlayChunkId(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete image";
      onSaveError?.(msg);
    } finally {
      setDeletingOverlayImage(false);
    }
  },
  [
    pendingDeleteOverlayChunkId,
    deletingOverlayImage,
    reloadArticleChunks,
    onSaveMessage,
    onSaveError,
  ]
  );

  const handlePickerOpenMediateca = useCallback((areaId: string) => {
    setMediatecaTarget({ kind: "image-area-draft", areaId });
  }, []);

  const handlePickerClearAreaImage = useCallback((areaId: string) => {
    setPickerDrafts((prev) =>
      prev
        ? prev.map((d) =>
            d.id === areaId
              ? { ...d, imageUrl: null, imageAlt: null, mediaName: null }
              : d
          )
        : prev
    );
  }, []);

  const handlePickerClose = useCallback(() => {
    if (savingOverlays) return;
    setPickerDrafts(null);
    setPickerError(null);
  }, [savingOverlays]);

  const handleApplyImageOverlays = useCallback(async () => {
    if (savingOverlays) return;
    if (!pickerDrafts || pickerDrafts.length === 0) return;
    if (addImagesSlotId == null) return;
    const drafts = pickerDrafts.filter((d) => !!d.imageUrl);
    if (drafts.length === 0) {
      setPickerError("Pick at least one image before applying.");
      return;
    }
    setSavingOverlays(true);
    setPickerError(null);
    try {
      // Append new overlay chunks at the tail of this page's chunk_position
      // sequence so they don't interfere with the existing column flow.
      const pageChunks = chunks.filter(
        (c) => chunkPublicationSlotId(c) === addImagesSlotId
      );
      let nextPosition =
        pageChunks.reduce((acc, c) => Math.max(acc, c.chunk_position), -1) + 1;
      for (const draft of drafts) {
        const areaCodes = draft.areaCodes?.length
          ? draft.areaCodes
          : cellsToAreaCodes([]);
        const html = buildSimpleImageChunkHtml(
          String(draft.imageUrl),
          draft.imageAlt ?? draft.mediaName ?? ""
        );
        if (!html || areaCodes.length === 0) continue;
        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(
            publicationArticleId
          )}/chunks`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              publication_article_chunk_format: "only_image",
              chunk_html: html,
              chunk_position: nextPosition,
              publication_slot_id: addImagesSlotId,
              chunk_area_array: areaCodes,
            }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to create overlay chunk.");
        }
        nextPosition += 1;
      }

      await reloadArticleChunks();

      onSaveMessage?.(
        drafts.length === 1
          ? "Image overlay added."
          : `${drafts.length} image overlays added.`
      );
      setAddImagesSlotId(null);
      resetImageAreasState();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add image overlays";
      setPickerError(msg);
      onSaveError?.(msg);
    } finally {
      setSavingOverlays(false);
    }
  }, [
    savingOverlays,
    pickerDrafts,
    addImagesSlotId,
    chunks,
    publicationArticleId,
    reloadArticleChunks,
    onSaveMessage,
    onSaveError,
    resetImageAreasState,
  ]);

  const handleMediatecaSelect = useCallback(
    async (imageUrl: string, content?: Pick<MediatecaContent, "id" | "name">) => {
      const target = mediatecaTarget;
      setMediatecaTarget(null);
      if (!target) return;
      if (target.kind === "image-area-draft") {
        const name = content?.name?.trim() || null;
        setPickerDrafts((prev) =>
          prev
            ? prev.map((d) =>
                d.id === target.areaId
                  ? {
                      ...d,
                      imageUrl: String(imageUrl),
                      imageAlt: name,
                      mediaName: name,
                    }
                  : d
              )
            : prev
        );
        return;
      }
      const chunk = chunks.find(
        (c) => c.publication_article_chunk_id === target.chunkId
      );
      if (!chunk) return;
      const nextHtml = writeChunkImageSrc(
        chunk.chunk_html,
        chunk.publication_article_chunk_format,
        imageUrl,
        content?.name ?? null
      );
      if (nextHtml === chunk.chunk_html) return;
      await saveChunkHtmlNow(target.chunkId, nextHtml);
    },
    [chunks, mediatecaTarget, saveChunkHtmlNow]
  );

  // Bulk chunk-deletion is article-wide: once entered, the user can pick
  // chunks across any page. The "Delete chunks" buttons on every page reflect
  // the same global state — clicking any of them with ≥1 chunk selected
  // triggers the cascade delete (chunks + referenced mediateca images).
  const [chunkSelectionActive, setChunkSelectionActive] = useState(false);
  const [selectedChunkIds, setSelectedChunkIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [deletingChunks, setDeletingChunks] = useState(false);

  const enterChunkSelectionMode = useCallback(() => {
    setChunkSelectionActive(true);
    setSelectedChunkIds(new Set());
  }, []);

  const exitChunkSelectionMode = useCallback(() => {
    setChunkSelectionActive(false);
    setSelectedChunkIds(new Set());
  }, []);

  const toggleChunkSelection = useCallback((chunkId: string) => {
    setSelectedChunkIds((prev) => {
      const next = new Set(prev);
      if (next.has(chunkId)) next.delete(chunkId);
      else next.add(chunkId);
      return next;
    });
  }, []);

  const confirmDeleteSelectedChunks = useCallback(async () => {
    if (deletingChunks) return;
    if (selectedChunkIds.size === 0) return;
    setDeletingChunks(true);
    try {
      const idsToDelete = Array.from(selectedChunkIds);
      const failed: string[] = [];
      for (const chunkId of idsToDelete) {
        try {
          const res = await fetch(
            `/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}?delete_mediateca=true`,
            { method: "DELETE", credentials: "include" }
          );
          if (!res.ok) {
            failed.push(chunkId);
            continue;
          }
        } catch {
          failed.push(chunkId);
        }
      }
      const succeeded = new Set(idsToDelete.filter((id) => !failed.includes(id)));
      if (succeeded.size > 0) {
        setChunks((prev) =>
          prev.filter((c) => !succeeded.has(c.publication_article_chunk_id))
        );
        onSaveMessage?.(
          succeeded.size === 1
            ? "Chunk deleted."
            : `${succeeded.size} chunks deleted.`
        );
      }
      if (failed.length > 0) {
        onSaveError?.(
          failed.length === 1
            ? "Failed to delete 1 chunk."
            : `Failed to delete ${failed.length} chunks.`
        );
      }
      setChunkSelectionActive(false);
      setSelectedChunkIds(new Set());
    } finally {
      setDeletingChunks(false);
    }
  }, [
    deletingChunks,
    selectedChunkIds,
    setChunks,
    onSaveMessage,
    onSaveError,
  ]);

  const handleAddChunkRequest = useCallback(
    async (params: {
      slotId: number;
      afterChunkId: string | null;
      beforeChunkId: string | null;
    }) => {
      if (addingChunk) return;
      const { slotId, afterChunkId } = params;
      setAddingChunk(true);
      try {
        const pageChunks = chunks
          .filter((c) => chunkPublicationSlotId(c) === slotId)
          .sort((a, b) => a.chunk_position - b.chunk_position);

        let insertPosition: number;
        if (afterChunkId) {
          const anchor = pageChunks.find(
            (c) => c.publication_article_chunk_id === afterChunkId
          );
          if (!anchor) throw new Error("Anchor chunk not found on this page.");
          insertPosition = anchor.chunk_position + 1;
        } else if (pageChunks.length === 0) {
          insertPosition = 0;
        } else {
          insertPosition = pageChunks[0]!.chunk_position;
        }

        const toShift = pageChunks.filter((c) => c.chunk_position >= insertPosition);
        for (const c of toShift) {
          const res = await fetch(
            `/api/v1/publication-article-chunks/${encodeURIComponent(
              c.publication_article_chunk_id
            )}`,
            {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ chunk_position: c.chunk_position + 1 }),
            }
          );
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(txt || "Failed to shift chunk positions before insertion.");
          }
        }

        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(
            publicationArticleId
          )}/chunks`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              publication_article_chunk_format: "only_text",
              chunk_html: "",
              chunk_position: insertPosition,
              publication_slot_id: slotId,
            }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to create chunk.");
        }
        const created = (await res.json()) as PublicationArticleChunk;

        setChunks((prev) => {
          const shifted = prev.map((c) =>
            chunkPublicationSlotId(c) === slotId && c.chunk_position >= insertPosition
              ? { ...c, chunk_position: c.chunk_position + 1 }
              : c
          );
          return [...shifted, created];
        });
        onSaveMessage?.("New text chunk added.");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to add chunk";
        onSaveError?.(msg);
      } finally {
        setAddingChunk(false);
      }
    },
    [
      addingChunk,
      chunks,
      publicationArticleId,
      setChunks,
      onSaveMessage,
      onSaveError,
    ]
  );

  const slotIds = useMemo(
    () =>
      (Array.isArray(publicationArticle.publication_slots_id_array)
        ? publicationArticle.publication_slots_id_array
        : []
      )
        .map(Number)
        .filter((sid) => Number.isFinite(sid) && sid > 0),
    [publicationArticle.publication_slots_id_array]
  );

  const rows = useMemo(
    () => buildSpreadRows(slotIds, slotPublicationPageBySlotId),
    [slotIds, slotPublicationPageBySlotId]
  );

  const total = slotIds.length;
  const articleTitle = articleMeta?.article_title?.trim() || publicationArticle.article_id;

  const renderCell = (cell: PageCell, rowIdx: number, colIdx: number) => {
    const key = `${rowIdx}-${colIdx}`;
    if (cell.kind === "page") {
      const pageChunks = chunks.filter(
        (ch) => chunkPublicationSlotId(ch) === cell.slotId
      );
      const canDeletePage = total > 1;
      const selectedCount = chunkSelectionActive ? selectedChunkIds.size : 0;
      const deleteChunksLabel = chunkSelectionActive
        ? selectedCount === 0
          ? "Select chunks to delete"
          : selectedCount === 1
            ? "Delete chunk"
            : `Delete ${selectedCount} chunks`
        : "Delete chunks";

      // Add-images mode is page-scoped: only the page where the user clicked
      // "Add images" shows the red-bordered selection grid. Other pages stay
      // in normal editable mode.
      const isAddImagesActiveForThisPage = addImagesSlotId === cell.slotId;
      const addImagesAreaCount = isAddImagesActiveForThisPage
        ? imageAreas.length
        : 0;
      const addImagesLabel = !isAddImagesActiveForThisPage
        ? "Add/delete images"
        : addImagesAreaCount === 0
          ? "Select area to add image"
          : `Add (${addImagesAreaCount}) image${addImagesAreaCount === 1 ? "" : "s"}`;

      const handleDeleteChunksClick = () => {
        if (deletingChunks) return;
        if (!chunkSelectionActive) {
          enterChunkSelectionMode();
          return;
        }
        if (selectedCount === 0) {
          exitChunkSelectionMode();
          return;
        }
        void confirmDeleteSelectedChunks();
      };

      const handleAddImagesClickForThisPage = () => {
        if (savingOverlays) return;
        // Entering add-images mode disables chunk-selection mode so the two
        // overlays don't fight over the page surface. The toggle/open-picker
        // logic itself is delegated to `handleAddImagesClick`, which handles
        // "click again on same page", "click on a different page", and
        // "click with ≥1 area selected".
        if (chunkSelectionActive) exitChunkSelectionMode();
        handleAddImagesClick(cell.slotId);
      };

      return (
        <div key={key} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-600">
              page {cell.articleIdx}/{total}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeletePage(cell.slotId);
              }}
              disabled={
                deletingPage ||
                !canDeletePage ||
                chunkSelectionActive ||
                deletingChunks
              }
              title={
                canDeletePage
                  ? "Delete this page (and all its chunks)"
                  : "Cannot delete the last remaining page of an article"
              }
              className="inline-flex items-center rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-600 shadow-sm transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete full page
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteChunksClick();
              }}
              disabled={deletingChunks || isAddImagesActiveForThisPage}
              title={
                chunkSelectionActive
                  ? selectedCount === 0
                    ? "Click any chunk's checkbox (on this page or others) to select it. Click here again to cancel."
                    : "Delete the selected chunks (and any mediateca images they reference)."
                  : "Pick chunks across one or more pages to delete them."
              }
              className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                chunkSelectionActive && selectedCount > 0
                  ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
                  : "border-red-300 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
              }`}
            >
              {deletingChunks ? "Deleting…" : deleteChunksLabel}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddImagesClickForThisPage();
              }}
              disabled={savingOverlays || chunkSelectionActive}
              title={
                isAddImagesActiveForThisPage
                  ? addImagesAreaCount === 0
                    ? "Click any red-bordered cell on this page to select an image area. Click here again to leave this mode."
                    : "Open the image picker for the selected areas."
                  : "Add floating images, or click the × on an existing image to delete it."
              }
              className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isAddImagesActiveForThisPage && addImagesAreaCount > 0
                  ? "border-blue-500 bg-blue-500 text-white hover:bg-blue-600"
                  : "border-blue-300 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {savingOverlays && isAddImagesActiveForThisPage
                ? "Applying…"
                : addImagesLabel}
            </button>
            {chunkSelectionActive && selectedCount > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  exitChunkSelectionMode();
                }}
                disabled={deletingChunks}
                className="text-xs font-medium text-gray-500 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            ) : null}
            {isAddImagesActiveForThisPage ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelImageAreaSelection();
                }}
                disabled={savingOverlays}
                className="text-xs font-medium text-gray-500 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            ) : null}
          </div>
          <ArticleBuilderPagePreviewThumbnail
            chunks={pageChunks}
            pageIndex={cell.articleIdx}
            isLeftPage={cell.isLeftPage}
            publicationPage={cell.magazinePage}
            pageFormat={magazinePageLayout}
            articleFlowPages={articleFlowPages}
            currentSlotContentId={cell.slotId}
            editable
            onChunkTextChange={scheduleChunkHtmlChange}
            onChunkImageUpdate={handleChunkImageUpdate}
            savingChunkIds={savingChunkIds}
            onAddChunkRequest={({ afterChunkId, beforeChunkId }) => {
              void handleAddChunkRequest({
                slotId: cell.slotId,
                afterChunkId,
                beforeChunkId,
              });
            }}
            chunkSelectionMode={chunkSelectionActive}
            selectedChunkIds={
              chunkSelectionActive ? selectedChunkIds : undefined
            }
            onToggleChunkSelection={
              chunkSelectionActive ? toggleChunkSelection : undefined
            }
            imageAreaSelectionMode={isAddImagesActiveForThisPage}
            imageAreas={
              isAddImagesActiveForThisPage ? imageAreas : undefined
            }
            onImageAreaCellClick={
              isAddImagesActiveForThisPage
                ? (gridCell) =>
                    handleImageAreaCellClick(cell.slotId, gridCell)
                : undefined
            }
            onImageAreaRemove={
              isAddImagesActiveForThisPage ? handleImageAreaRemove : undefined
            }
            onOverlayImageDelete={
              isAddImagesActiveForThisPage
                ? handleOverlayImageDeleteRequest
                : undefined
            }
          />
        </div>
      );
    }
    if (cell.kind === "starts-on-right") {
      return (
        <div key={key} className="flex flex-col gap-2">
          <span aria-hidden className="invisible text-xs font-medium">
            .
          </span>
          <StartsOnRightPlaceholder />
        </div>
      );
    }
    if (cell.kind === "add-new") {
      return (
        <div key={key} className="flex flex-col gap-2">
          <span aria-hidden className="invisible text-xs font-medium">
            .
          </span>
          <AddNewPagePlaceholder onClick={onAddPage} disabled={addingPage} />
        </div>
      );
    }
    return (
      <div key={key} className="flex flex-col gap-2">
        <span aria-hidden className="invisible text-xs font-medium">
          .
        </span>
        <EmptyPlaceholder />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">{articleTitle}</h1>

      <div className="flex flex-col gap-6">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex w-full items-start gap-[2%]">
            {row.map((cell, colIdx) => (
              <div key={`${rowIdx}-${colIdx}-wrap`} className="w-[49%]">
                {renderCell(cell, rowIdx, colIdx)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <MediatecaModal
        open={mediatecaTarget != null}
        onClose={() => setMediatecaTarget(null)}
        onSelectImage={(url, content) => void handleMediatecaSelect(url, content)}
        initialPath={mediatecaInitialPath}
        ensureSlotMediatecaFolder={ensureSlotMediatecaFolder}
      />

      <ArticleBuilderImageAreaMergeModal
        open={pendingMergePair != null}
        areas={pendingMergePair?.areas ?? null}
        columnCount={columnCountForCurrentPage}
        onMerge={handleConfirmMerge}
        onKeepSeparate={handleDeclineMerge}
      />

      <ArticleBuilderImageAreaPickerModal
        open={pickerDrafts != null}
        drafts={pickerDrafts ?? []}
        columnCount={columnCountForCurrentPage}
        saving={savingOverlays}
        error={pickerError}
        onOpenMediateca={handlePickerOpenMediateca}
        onClearAreaImage={handlePickerClearAreaImage}
        onClose={handlePickerClose}
        onApply={() => void handleApplyImageOverlays()}
      />

      <ArticleBuilderDeleteOverlayImageModal
        open={pendingDeleteOverlayChunkId != null}
        saving={deletingOverlayImage}
        onCancel={handleCancelDeleteOverlayImage}
        onConfirm={(alsoDeleteFromMediateca) =>
          void handleConfirmDeleteOverlayImage(alsoDeleteFromMediateca)
        }
      />
    </div>
  );
};
