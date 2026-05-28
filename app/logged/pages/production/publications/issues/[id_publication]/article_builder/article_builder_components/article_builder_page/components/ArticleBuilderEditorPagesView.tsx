"use client";

import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MediatecaModal from "@/app/logged/logged_components/modals/MediatecaModal";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
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
  normalizeAreaCodes,
} from "../../article_image_manager/articleAreaCodes";
import {
  ArticleBuilderDeleteOverlayImageModal,
  ArticleBuilderImageAreaMergeModal,
  ArticleBuilderImageAreaPickerModal,
  ArticleBuilderUpdateImageCaptionModal,
  type AreaImageDraft,
} from "../../ArticleBuilderImageAreaModals";
import {
  chunkFormatIncludesImage,
  readChunkImageCaption,
} from "../../articleChunkPlainTextEditing";
import { assignGridAreaCodesToOrphanTextChunks } from "../../articleChunkGridOverflow";
import { runArticleGridOverflowFlow } from "../../articleBuilderGridOverflowFlow";
import {
  requestChunkEditorDomSync,
  requestChunkEditorDomSyncForChunks,
} from "../../chunkEditorDomSync";
import { isOverlayImageChunk } from "../../article_image_manager/articleImagePlacement";
import {
  buildArticleFlowPagesFromPublicationSlots,
  normalizeChunkFormat,
} from "../../magazineArticleColumnFlow";
import type { MagazinePageLayout } from "../../magazinePageLayout";
import type { ArticleMeta, PublicationArticleChunk, PublicationArticleRow } from "../types";
import { ArticleBuilderFloatingRichTextToolbarProvider } from "./ArticleBuilderFloatingRichTextToolbar";
import {
  ArticleBuilderArticleBoxDataModal,
  type ArticleBoxSavePayload,
} from "./ArticleBuilderArticleBoxDataModal";
import { ArticleBuilderDeleteArticleBoxModal } from "./ArticleBuilderDeleteArticleBoxModal";
import {
  analyzeArticleBoxTargetSlot,
  articleBoxTargetAreaLabel,
  getLastPublicationSlotId,
  type ArticleBoxPlacementStrategy,
} from "../articleBoxPlacement";
import {
  ArticleSlotFlatplanCaptureStage,
  buildFlatplanCaptureSlotSpecs,
} from "./ArticleSlotFlatplanCaptureStage";
import {
  dedupeChunksForDisplay,
  dedupeGridTextChunksBySlotAndArea,
} from "../chunkUtils";
import {
  buildChunkHtmlSavePlan,
  collectVisibleEditorHtmlOverrides,
  reconcilePublicationArticleChunksOnSave,
} from "../../articleBuilderSaveFromDom";
import { runArticleSlotFlatplanScreenshots } from "../../articleSlotFlatplanCapture";
import { ArticleBuilderEditorPageCell } from "./ArticleBuilderEditorPageCell";
import {
  AddNewPagePlaceholder,
  EmptyPlaceholder,
  StartsOnRightPlaceholder,
} from "./ArticleBuilderEditorPagePlaceholders";
import { buildSpreadRows, type PageCell, type SpreadRow } from "./articleBuilderSpreadRows";
import { usePublicationEditionName } from "../hooks/usePublicationEditionName";
import { useArticleHeadingHtml } from "../hooks/useArticleHeadingHtml";
import { useChunkSelection } from "../hooks/useChunkSelection";
import { useArticleBuilderMediatecaTarget } from "../hooks/useArticleBuilderMediatecaTarget";
import { useImageCaptionModal } from "../hooks/useImageCaptionModal";
import { useImageOverlaysFlow } from "../hooks/useImageOverlaysFlow";

function isSlotBodyTextChunk(chunk: PublicationArticleChunk): boolean {
  const fmt = String(chunk.publication_article_chunk_format ?? "").toLowerCase();
  if (fmt === "title" || fmt === "subtitle") return false;
  if (fmt === "only_image") return false;
  return true;
}

function primaryGridAreaCode(chunk: { chunk_area_array?: unknown }): string | null {
  const areas = normalizeAreaCodes(chunk.chunk_area_array);
  return areas[0] ?? null;
}

/** Grid column areas (a1, b1, …) that still need an `only_text` chunk on this slot. */
function missingGridAreaCodesForSlot(
  textChunks: PublicationArticleChunk[],
  columnCount: number
): string[] {
  const orphans = textChunks.filter((c) => !primaryGridAreaCode(c));
  const missing: string[] = [];
  for (let col = 0; col < columnCount; col++) {
    const code = defaultColumnAreaCode(col);
    if (!code) continue;
    if (textChunks.some((c) => primaryGridAreaCode(c) === code)) continue;
    if (col < orphans.length) continue;
    missing.push(code);
  }
  return missing;
}

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

// (moved: spread-row utils + placeholder components)

type ArticleBuilderEditorPagesViewProps = {
  publicationArticle: PublicationArticleRow;
  articleMeta: ArticleMeta | null;
  chunks: PublicationArticleChunk[];
  setChunks: React.Dispatch<React.SetStateAction<PublicationArticleChunk[]>>;
  onPublicationArticleUpdate: (article: PublicationArticleRow) => void;
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
  onPublicationArticleUpdate,
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
  const {
    scheduleChunkHtmlChange,
    commitChunkHtmlNow,
    saveChunkHtmlNow,
    flushAllPendingChunkHtml,
    applyPendingHtmlToChunks,
    persistChunkHtmlBatch,
    savingChunkIds,
  } = useArticleChunkAutosave({ setChunks, onSaveMessage, onSaveError, debounceMs: 150 });

  const columnCount = magazinePageLayout === "3_col_article" ? 3 : 2;
  const chunksRef = useRef(chunks);
  chunksRef.current = chunks;
  const gridOverflowHandlingRef = useRef(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingAllChanges, setSavingAllChanges] = useState(false);
  const [articleBoxModalOpen, setArticleBoxModalOpen] = useState(false);
  const [deleteArticleBoxModalOpen, setDeleteArticleBoxModalOpen] = useState(false);
  const [savingArticleBox, setSavingArticleBox] = useState(false);
  const [articleBoxError, setArticleBoxError] = useState<string | null>(null);
  const [boxToggleYes, setBoxToggleYes] = useState(
    () => publicationArticle.has_article_box === true
  );
  const [boxPlacement, setBoxPlacement] =
    useState<ArticleBoxPlacementStrategy>("use_last_page");
  const [articleBoxCollisionKey, setArticleBoxCollisionKey] = useState(0);

  const markUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const handleEditorChunkTextChange = useCallback(
    (chunkId: string, html: string) => {
      markUnsavedChanges();
      scheduleChunkHtmlChange(chunkId, html);
    },
    [markUnsavedChanges, scheduleChunkHtmlChange]
  );

  const handleChunkHtmlCommit = useCallback(
    (chunkId: string, html: string) => {
      void commitChunkHtmlNow(chunkId, html);
    },
    [commitChunkHtmlNow]
  );

  const publicationArticleId = publicationArticle.publication_article_id;
  const slotsIdArray = publicationArticle.publication_slots_id_array;

  useEffect(() => {
    setBoxToggleYes(publicationArticle.has_article_box === true);
  }, [publicationArticle.publication_article_id, publicationArticle.has_article_box]);

  const hasArticleBoxActive = publicationArticle.has_article_box === true;
  const hasBoxData = Boolean(
    (publicationArticle.box_company_name ?? "").trim() ||
      (publicationArticle.box_company_direction ?? "").trim() ||
      (publicationArticle.box_company_city ?? "").trim() ||
      (publicationArticle.box_company_email ?? "").trim() ||
      (publicationArticle.box_company_phone ?? "").trim() ||
      (publicationArticle.box_company_web ?? "").trim()
  );

  const patchPublicationArticle = useCallback(
    async (payload: Record<string, unknown>) => {
      setArticleBoxError(null);
      const res = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update publication article");
      }
      onPublicationArticleUpdate?.(data);
      return data;
    },
    [onPublicationArticleUpdate, publicationArticleId]
  );

  const reloadPublicationArticleAndChunks = useCallback(async () => {
    const reloadRes = await fetch(
      `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}?ensure_all_magazine_slots=1`,
      { cache: "no-store", credentials: "include" }
    );
    if (!reloadRes.ok) {
      const txt = await reloadRes.text().catch(() => "");
      throw new Error(txt || "Failed to reload publication article");
    }
    const reloaded = (await reloadRes.json()) as {
      publication_article?: PublicationArticleRow;
      chunks?: PublicationArticleChunk[];
    };
    if (Array.isArray(reloaded.chunks)) {
      setChunks(reloaded.chunks);
      chunksRef.current = reloaded.chunks;
    }
    if (reloaded.publication_article) {
      onPublicationArticleUpdate?.(reloaded.publication_article);
    }
    return reloaded;
  }, [onPublicationArticleUpdate, publicationArticleId, setChunks]);

  const slotIdsOrderedEarly = useMemo(
    () =>
      (Array.isArray(slotsIdArray) ? slotsIdArray : [])
        .map(Number)
        .filter((sid) => Number.isFinite(sid) && sid > 0),
    [slotsIdArray]
  );

  const articleBoxCollisionLive = useMemo(() => {
    const lastSlotId = getLastPublicationSlotId(slotIdsOrderedEarly);
    if (!lastSlotId) {
      return {
        lastSlotId: null,
        lastPageNumber: 1,
        targetAreaLabel: articleBoxTargetAreaLabel(columnCount),
        occupied: false,
        conflictingChunkIds: [] as string[],
      };
    }
    return {
      lastSlotId,
      lastPageNumber: slotIdsOrderedEarly.length,
      ...analyzeArticleBoxTargetSlot(chunks, lastSlotId, columnCount),
    };
  }, [articleBoxCollisionKey, chunks, columnCount, slotIdsOrderedEarly]);

  const deleteChunksById = useCallback(
    async (chunkIds: string[]) => {
      for (const chunkId of chunkIds) {
        const res = await fetch(
          `/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}?delete_mediateca=true`,
          { method: "DELETE", credentials: "include" }
        );
        if (!res.ok) {
          throw new Error("Failed to remove content from the target cell");
        }
      }
      setChunks((prev) => prev.filter((c) => !chunkIds.includes(c.publication_article_chunk_id)));
      chunksRef.current = chunksRef.current.filter(
        (c) => !chunkIds.includes(c.publication_article_chunk_id)
      );
    },
    [setChunks]
  );

  const clearArticleBoxInDatabase = useCallback(async () => {
    await patchPublicationArticle({
      has_article_box: null,
      box_company_name: null,
      box_company_direction: null,
      box_company_city: null,
      box_company_email: null,
      box_company_phone: null,
      box_company_web: null,
    });
    setBoxToggleYes(false);
  }, [patchPublicationArticle]);

  const handleConfirmArticleBox = useCallback(
    async (payload: ArticleBoxSavePayload) => {
      setSavingArticleBox(true);
      setArticleBoxError(null);
      try {
        const { placement, ...boxFields } = payload;
        const lastSlotId = articleBoxCollisionLive.lastSlotId;

        if (placement === "new_page") {
          const slotIds = slotIdsOrderedEarly;
          const currentCount = Math.max(
            Number(publicationArticle.desired_page_count) || 1,
            slotIds.length
          );
          const syncRes = await fetch(
            `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/sync-pages`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ desired_page_count: currentCount + 1 }),
            }
          );
          const syncJson = await syncRes.json().catch(() => ({}));
          if (!syncRes.ok) {
            throw new Error(syncJson?.message || "Failed to add new page for box");
          }
          await reloadPublicationArticleAndChunks();
        } else if (placement === "move_to_previous_page") {
          const slotIds = slotIdsOrderedEarly;
          if (slotIds.length < 2) {
            throw new Error("Cannot move the box to a previous page — only one page exists.");
          }
          const previousSlotId = slotIds[slotIds.length - 2]!;
          const idsToRemove = analyzeArticleBoxTargetSlot(
            chunksRef.current,
            previousSlotId,
            columnCount
          ).conflictingChunkIds;
          if (idsToRemove.length) {
            await deleteChunksById(idsToRemove);
          }
          const currentCount = Math.max(
            Number(publicationArticle.desired_page_count) || 1,
            slotIds.length
          );
          const syncRes = await fetch(
            `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/sync-pages`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ desired_page_count: Math.max(1, currentCount - 1) }),
            }
          );
          const syncJson = await syncRes.json().catch(() => ({}));
          if (!syncRes.ok) {
            throw new Error(syncJson?.message || "Failed to move box to the previous page");
          }
          await reloadPublicationArticleAndChunks();
        } else if (placement === "replace_on_last_page" && lastSlotId) {
          const idsToRemove = analyzeArticleBoxTargetSlot(
            chunksRef.current,
            lastSlotId,
            columnCount
          ).conflictingChunkIds;
          if (idsToRemove.length) {
            await deleteChunksById(idsToRemove);
          }
        }

        await patchPublicationArticle(boxFields);
        setBoxToggleYes(true);
        setArticleBoxModalOpen(false);
        onSaveMessage?.("Article box saved.");
      } catch (e: unknown) {
        setArticleBoxError(e instanceof Error ? e.message : "Failed to save box data");
        throw e;
      } finally {
        setSavingArticleBox(false);
      }
    },
    [
      articleBoxCollisionLive.lastSlotId,
      columnCount,
      deleteChunksById,
      onSaveMessage,
      patchPublicationArticle,
      publicationArticle.desired_page_count,
      publicationArticleId,
      reloadPublicationArticleAndChunks,
      slotIdsOrderedEarly,
    ]
  );

  const handleConfirmDeleteArticleBox = useCallback(async () => {
    setSavingArticleBox(true);
    setArticleBoxError(null);
    try {
      await clearArticleBoxInDatabase();
      setDeleteArticleBoxModalOpen(false);
      onSaveMessage?.("Article box removed.");
    } catch (e: unknown) {
      setArticleBoxError(e instanceof Error ? e.message : "Failed to delete article box");
    } finally {
      setSavingArticleBox(false);
    }
  }, [clearArticleBoxInDatabase, onSaveMessage]);

  const handleToggleArticleBox = useCallback(
    (next: boolean) => {
      setArticleBoxError(null);
      if (next) {
        setBoxToggleYes(true);
        return;
      }
      if (hasArticleBoxActive || hasBoxData) {
        setDeleteArticleBoxModalOpen(true);
        return;
      }
      setBoxToggleYes(false);
    },
    [hasArticleBoxActive, hasBoxData]
  );

  const openArticleBoxDataModal = useCallback(() => {
    setArticleBoxCollisionKey((k) => k + 1);
    setBoxPlacement(hasBoxData ? "keep_current" : "use_last_page");
    setArticleBoxError(null);
    setArticleBoxModalOpen(true);
  }, [hasBoxData]);

  const slotIdsOrdered = useMemo(
    () =>
      (Array.isArray(slotsIdArray) ? slotsIdArray : [])
        .map(Number)
        .filter((sid) => Number.isFinite(sid) && sid > 0),
    [slotsIdArray]
  );

  const makeGridTextOverflowCheck = useCallback(
    (slotId: number) => (chunkId: string, editorEl: HTMLDivElement) => {
      if (gridOverflowHandlingRef.current) return;
      gridOverflowHandlingRef.current = true;

      void runArticleGridOverflowFlow({
        sourceSlotId: slotId,
        sourceChunkId: chunkId,
        editorEl,
        getSlotIdsOrdered: () => {
          const raw = publicationArticle.publication_slots_id_array;
          return (Array.isArray(raw) ? raw : [])
            .map(Number)
            .filter((sid) => Number.isFinite(sid) && sid > 0);
        },
        readChunks: () => chunksRef.current,
        columnCount,
        publicationArticleId,
        flushPendingChunkHtml: flushAllPendingChunkHtml,
        persistUpdates: async (updates) => {
          markUnsavedChanges();
          for (const [id, html] of updates) {
            requestChunkEditorDomSync(id);
            await commitChunkHtmlNow(id, html);
          }
        },
        onArticleReload: async (data) => {
          await flushAllPendingChunkHtml();
          const merged = dedupeGridTextChunksBySlotAndArea(
            applyPendingHtmlToChunks(data.chunks)
          );
          requestChunkEditorDomSyncForChunks(
            merged.map((c) => c.publication_article_chunk_id)
          );
          onPublicationArticleUpdate(data.publicationArticle);
          setChunks(merged);
          chunksRef.current = merged;
        },
      })
        .catch((e: unknown) => {
          onSaveError?.(
            e instanceof Error ? e.message : "Grid text overflow failed"
          );
        })
        .finally(() => {
          requestAnimationFrame(() => {
            gridOverflowHandlingRef.current = false;
          });
        });
    },
    [
      columnCount,
      onPublicationArticleUpdate,
      onSaveError,
      publicationArticle,
      publicationArticleId,
      applyPendingHtmlToChunks,
      commitChunkHtmlNow,
      flushAllPendingChunkHtml,
      markUnsavedChanges,
      setChunks,
    ]
  );

  useEffect(
    () => () => {
      void flushAllPendingChunkHtml({ keepalive: true });
    },
    [flushAllPendingChunkHtml]
  );

  const gridAreaMigrationRef = useRef<string | null>(null);
  const [flatplanCaptureReady, setFlatplanCaptureReady] = useState(false);

  useEffect(() => {
    gridAreaMigrationRef.current = null;
    setFlatplanCaptureReady(false);
  }, [publicationArticleId]);

  useEffect(() => {
    if (gridAreaMigrationRef.current === publicationArticleId) {
      setFlatplanCaptureReady(true);
      return;
    }
    const slotIds = (Array.isArray(slotsIdArray) ? slotsIdArray : [])
      .map(Number)
      .filter((sid) => Number.isFinite(sid) && sid > 0);
    if (slotIds.length === 0 || chunks.length === 0) {
      setFlatplanCaptureReady(true);
      return;
    }

    gridAreaMigrationRef.current = publicationArticleId;
    const articleIdAtStart = publicationArticleId;
    (async () => {
      let current = chunksRef.current;
      for (const slotId of slotIds) {
        if (gridAreaMigrationRef.current !== articleIdAtStart) return;
        current = await assignGridAreaCodesToOrphanTextChunks({
          slotId,
          columnCount,
          chunks: current,
        });
      }
      if (gridAreaMigrationRef.current !== articleIdAtStart) return;
      setChunks(current);
      chunksRef.current = current;
      setFlatplanCaptureReady(true);
    })().catch(() => {
      gridAreaMigrationRef.current = null;
      setFlatplanCaptureReady(true);
    });
  }, [
    chunks.length,
    columnCount,
    publicationArticleId,
    setChunks,
    slotsIdArray,
  ]);

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
      areaCodes: string[];
      baseLastPos: number;
    }[] = [];
    for (const slotId of slotIds) {
      if (ensuredSlotsRef.current.slots.has(slotId)) continue;
      const slotChunks = chunks.filter(
        (c) => chunkPublicationSlotId(c) === slotId
      );
      const textChunks = slotChunks.filter(isSlotBodyTextChunk);
      const areaCodes = missingGridAreaCodesForSlot(textChunks, columnCount);
      if (areaCodes.length === 0) {
        ensuredSlotsRef.current.slots.add(slotId);
        continue;
      }
      const baseLastPos = slotChunks.reduce(
        (acc, c) => Math.max(acc, c.chunk_position),
        -1
      );
      tasks.push({ slotId, areaCodes, baseLastPos });
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
        let pos = task.baseLastPos;
        for (const areaCode of task.areaCodes) {
          if (ensuredSlotsRef.current.articleId !== articleIdAtStart) return;
          pos += 1;
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
                  chunk_position: pos,
                  publication_slot_id: task.slotId,
                  chunk_area_array: [areaCode],
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

  const editionName = usePublicationEditionName(publicationArticle.publication_id);
  const publicationId = publicationArticle.publication_id;

  const {
    captionModalChunkId,
    setCaptionModalChunkId,
    savingCaption,
    captionModalCurrentCaption,
    handleChunkCaptionUpdate,
    handleApplyImageCaption,
  } = useImageCaptionModal({ chunks, setChunks, onSaveMessage, onSaveError });

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
  const reloadArticleChunks = useCallback(async () => {
    const listRes = await fetch(
      `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/chunks`,
      { cache: "no-store", credentials: "include" }
    );
    if (!listRes.ok) return;
    const listJson = (await listRes.json()) as { items?: PublicationArticleChunk[] };
    if (Array.isArray(listJson.items)) {
      setChunks(listJson.items);
    }
  }, [publicationArticleId, setChunks]);

  const overlays = useImageOverlaysFlow({
    magazinePageLayout,
    chunks,
    publicationArticleId,
    onSaveMessage,
    onSaveError,
    reloadArticleChunks,
  });

  const {
    addImagesSlotId,
    imageAreas,
    pendingMergePair,
    pickerDrafts,
    pickerError,
    savingOverlays,
    pendingDeleteOverlayChunkId,
    deletingOverlayImage,
    columnCountForCurrentPage,
    setPickerDrafts,
    handleAddImagesClick,
    handleCancelImageAreaSelection,
    handleImageAreaCellClick,
    handleImageAreaRemove,
    handleConfirmMerge,
    handleDeclineMerge,
    handleOverlayImageDeleteRequest,
    handleCancelDeleteOverlayImage,
    handleConfirmDeleteOverlayImage,
    handlePickerClearAreaImage,
    handlePickerClose,
    handleApplyImageOverlays,
  } = overlays;

  const {
    mediatecaTarget,
    setMediatecaTarget,
    ensureSlotMediatecaFolder,
    mediatecaInitialPath,
    handleChunkImageUpdate,
    handlePickerOpenMediateca,
    handleMediatecaSelect,
  } = useArticleBuilderMediatecaTarget({
    chunks,
    editionName,
    publicationId,
    publicationArticleId,
    publicationArticleArticleId: publicationArticle.article_id,
    addImagesSlotId,
    saveChunkHtmlNow,
    setPickerDrafts,
  });

  // Bulk chunk-deletion is article-wide: once entered, the user can pick
  // chunks across any page. The "Delete chunks" buttons on every page reflect
  // the same global state — clicking any of them with ≥1 chunk selected
  // triggers the cascade delete (chunks + referenced mediateca images).
  const {
    chunkSelectionActive,
    selectedChunkIds,
    deletingChunks,
    enterChunkSelectionMode,
    exitChunkSelectionMode,
    toggleChunkSelection,
    confirmDeleteSelectedChunks,
  } = useChunkSelection({ setChunks, onSaveMessage, onSaveError });

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

  const articleHeadingHtml = useArticleHeadingHtml({ chunks, slotIds });

  const articleBox =
    hasArticleBoxActive &&
    (publicationArticle.box_company_name ?? "").trim() !== ""
      ? {
          company_name: String(publicationArticle.box_company_name ?? "").trim(),
          company_direction: publicationArticle.box_company_direction ?? null,
          company_city: publicationArticle.box_company_city ?? null,
          company_email: publicationArticle.box_company_email ?? null,
          company_phone: publicationArticle.box_company_phone ?? null,
          company_web: publicationArticle.box_company_web ?? null,
        }
      : null;

  const flatplanCaptureSlotSpecs = useMemo(
    () => buildFlatplanCaptureSlotSpecs(slotIds, slotPublicationPageBySlotId),
    [slotIds, slotPublicationPageBySlotId]
  );

  const handleSaveChangesAndReload = useCallback(async () => {
    if (savingAllChanges) return;
    setSavingAllChanges(true);
    onSaveMessage?.(null);
    onSaveError?.(null);
    try {
      await flushAllPendingChunkHtml();

      const domInner = collectVisibleEditorHtmlOverrides();
      const savePlan = buildChunkHtmlSavePlan(chunksRef.current, domInner);

      if (savePlan.size > 0) {
        const { saved, failures } = await persistChunkHtmlBatch(savePlan);
        if (saved === 0) {
          throw new Error(
            failures[0] ?? "No chunk content could be saved. Try again."
          );
        }
      }

      const preferKeepChunkIds = [
        ...new Set([...savePlan.keys(), ...domInner.keys()]),
      ];
      const reconcileResult = await reconcilePublicationArticleChunksOnSave(
        publicationArticle.publication_article_id,
        { preferKeepChunkIds }
      );

      try {
        if (flatplanCaptureSlotSpecs.length > 0) {
          const { failures: screenshotFailures } =
            await runArticleSlotFlatplanScreenshots({
              publicationArticleId: publicationArticle.publication_article_id,
              slotSpecs: flatplanCaptureSlotSpecs.map((s) => ({
                slotId: s.slotId,
                articlePageIndex: s.articlePageIndex,
              })),
              settleMs: 800,
            });
          if (screenshotFailures.length > 0) {
            onSaveError?.(
              screenshotFailures.length === flatplanCaptureSlotSpecs.length
                ? "Chunks saved, but flatplan screenshots failed."
                : `Chunks saved; ${screenshotFailures.length} screenshot(s) failed.`
            );
          }
        }
      } catch {
        onSaveError?.("Chunks reconciled, but flatplan screenshots failed.");
      }

      const dedupeNote =
        reconcileResult.deleted > 0
          ? ` (${reconcileResult.deleted} duplicado(s) eliminado(s))`
          : "";

      const reloadRes = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(
          publicationArticle.publication_article_id
        )}?ensure_all_magazine_slots=1`,
        { cache: "no-store", credentials: "include" }
      );
      if (!reloadRes.ok) {
        const txt = await reloadRes.text().catch(() => "");
        throw new Error(txt || "Failed to reload article after save");
      }
      const reloaded = (await reloadRes.json()) as {
        publication_article?: PublicationArticleRow;
        chunks?: PublicationArticleChunk[];
      };
      const freshChunks = Array.isArray(reloaded.chunks) ? reloaded.chunks : [];
      requestChunkEditorDomSyncForChunks(
        freshChunks.map((c) => c.publication_article_chunk_id)
      );
      setChunks(freshChunks);
      chunksRef.current = freshChunks;
      if (reloaded.publication_article) {
        onPublicationArticleUpdate(reloaded.publication_article);
      }
      setHasUnsavedChanges(false);
      onSaveMessage?.(`Cambios guardados${dedupeNote}.`);
    } catch (e: unknown) {
      onSaveError?.(
        e instanceof Error ? e.message : "Failed to save article changes"
      );
      setSavingAllChanges(false);
    }
  }, [
    flatplanCaptureSlotSpecs,
    flushAllPendingChunkHtml,
    onSaveError,
    onSaveMessage,
    onPublicationArticleUpdate,
    persistChunkHtmlBatch,
    publicationArticle.publication_article_id,
    savingAllChanges,
    setChunks,
  ]);

  const handleRemoveArticleBoxFromPreview = useCallback(() => {
    setArticleBoxError(null);
    setDeleteArticleBoxModalOpen(true);
  }, []);

  const renderCell = (cell: PageCell, rowIdx: number, colIdx: number) => {
    const key = `${rowIdx}-${colIdx}`;
    if (cell.kind === "page") {
      return (
        <div key={key} className="flex flex-col gap-2">
          <ArticleBuilderEditorPageCell
            cell={cell}
            total={total}
            chunks={chunks}
            articleHeadingHtml={articleHeadingHtml}
            magazinePageLayout={magazinePageLayout}
            articleFlowPages={articleFlowPages}
            articleBox={articleBox}
            onRemoveArticleBox={
              hasArticleBoxActive ? handleRemoveArticleBoxFromPreview : undefined
            }
            savingChunkIds={savingChunkIds}
            deletingPage={deletingPage}
            deletingChunks={deletingChunks}
            chunkSelectionActive={chunkSelectionActive}
            selectedChunkIds={selectedChunkIds}
            addImagesSlotId={addImagesSlotId}
            imageAreas={imageAreas}
            savingOverlays={savingOverlays}
            onDeletePage={onDeletePage}
            onEnterChunkSelectionMode={enterChunkSelectionMode}
            onExitChunkSelectionMode={exitChunkSelectionMode}
            onConfirmDeleteSelectedChunks={() => void confirmDeleteSelectedChunks()}
            onToggleChunkSelection={toggleChunkSelection}
            onAddImagesClick={handleAddImagesClick}
            onCancelImageAreaSelection={handleCancelImageAreaSelection}
            onGridTextOverflowCheck={makeGridTextOverflowCheck(cell.slotId)}
            onChunkTextChange={handleEditorChunkTextChange}
            onChunkHtmlCommit={handleChunkHtmlCommit}
            onChunkImageUpdate={handleChunkImageUpdate}
            onChunkCaptionUpdate={handleChunkCaptionUpdate}
            onImageAreaCellClick={(gridCell) =>
              handleImageAreaCellClick(cell.slotId, gridCell)
            }
            onImageAreaRemove={handleImageAreaRemove}
            onOverlayImageDeleteRequest={handleOverlayImageDeleteRequest}
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
    <ArticleBuilderFloatingRichTextToolbarProvider
      hasUnsavedChanges={hasUnsavedChanges}
      savingChanges={savingAllChanges}
      onSaveChanges={handleSaveChangesAndReload}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 bg-white p-3">
          <div className="min-w-[240px]">
            <div className="text-xs font-medium text-gray-600">Article name</div>
            <div className="text-sm font-medium text-gray-900">{articleTitle}</div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                add box at the end?
              </span>
              <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 p-0.5">
                <button
                  type="button"
                  disabled={savingArticleBox}
                  onClick={() => handleToggleArticleBox(false)}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    !boxToggleYes
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-white",
                    savingArticleBox ? "opacity-50" : "",
                  ].join(" ")}
                >
                  No
                </button>
                <button
                  type="button"
                  disabled={savingArticleBox}
                  onClick={() => handleToggleArticleBox(true)}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    boxToggleYes
                      ? "bg-emerald-600 text-white"
                      : "text-gray-700 hover:bg-white",
                    savingArticleBox ? "opacity-50" : "",
                  ].join(" ")}
                >
                  Yes
                </button>
              </div>
            </div>

            {boxToggleYes ? (
              <button
                type="button"
                onClick={openArticleBoxDataModal}
                className="flex min-h-[36px] items-center rounded-md bg-blue-950/90 px-3 py-2 text-sm font-medium uppercase text-white transition-colors hover:bg-blue-900"
              >
                {hasBoxData ? "edit box data" : "Add Box Data"}
              </button>
            ) : null}
          </div>
          {articleBoxError ? (
            <div className="w-full text-sm text-red-600">{articleBoxError}</div>
          ) : null}
        </div>

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

        <ArticleBuilderArticleBoxDataModal
          open={articleBoxModalOpen}
          isEdit={hasBoxData}
          targetAreaLabel={articleBoxCollisionLive.targetAreaLabel}
          lastPageNumber={articleBoxCollisionLive.lastPageNumber}
          previousPageNumber={
            articleBoxCollisionLive.lastPageNumber > 1
              ? articleBoxCollisionLive.lastPageNumber - 1
              : null
          }
          canMoveToPreviousPage={articleBoxCollisionLive.lastPageNumber > 1}
          collisionOccupied={articleBoxCollisionLive.occupied}
          placement={boxPlacement}
          onPlacementChange={setBoxPlacement}
          publicationArticle={publicationArticle}
          saving={savingArticleBox}
          error={articleBoxError}
          onClose={() => {
            if (savingArticleBox) return;
            setArticleBoxModalOpen(false);
          }}
          onSave={(payload) => {
            void handleConfirmArticleBox(payload);
          }}
        />

        <ArticleBuilderDeleteArticleBoxModal
          open={deleteArticleBoxModalOpen}
          saving={savingArticleBox}
          error={articleBoxError}
          onClose={() => {
            if (savingArticleBox) return;
            setDeleteArticleBoxModalOpen(false);
            setArticleBoxError(null);
          }}
          onConfirm={() => void handleConfirmDeleteArticleBox()}
        />

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
          onUpdateDrafts={(next) => setPickerDrafts(next)}
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

        <ArticleBuilderUpdateImageCaptionModal
          open={captionModalChunkId != null}
          currentCaption={captionModalCurrentCaption}
          saving={savingCaption}
          onCancel={() => setCaptionModalChunkId(null)}
          onApply={(next) => void handleApplyImageCaption(next)}
        />

        <ArticleSlotFlatplanCaptureStage
          slotSpecs={flatplanCaptureSlotSpecs}
          chunks={chunks}
          slotIdsOrdered={slotIds}
          magazinePageLayout={magazinePageLayout}
          articleTitleHtml={articleHeadingHtml.title}
          articleSubtitleHtml={articleHeadingHtml.subtitle}
        />
      </div>
    </ArticleBuilderFloatingRichTextToolbarProvider>
  );
};
