"use client";

import React, {
  CSSProperties,
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MagazineChunkEditorPreview,
  type MagazineChunkFormat,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/slots/[slot_id]/article_editor/MagazineArticleEditorChunkBody";
import {
  extractFirstImgAlt,
  extractFirstImgSrc,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/slots/[slot_id]/article_editor/magazineChunkMediaHtml";
import {
  areaCodesToPlacement,
  normalizeAreaCodes,
  textChunkPlacementForPreview,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_image_manager/articleAreaCodes";
import {
  IMAGE_AREA_ROWS,
  isOverlayImageChunk,
  overlayImageSrc,
  parseOverlayPlacement,
  placementPercentStyle,
  type GridCell,
  type ImageAreaSelection,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_image_manager/articleImagePlacement";
import type { MagazinePageLayout } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazinePageLayout";
import {
  isFlowBodyChunk,
  type MagazineArticleFlowPageInput,
  normalizeChunkFormat,
  previewBodyChunksForPage,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazineArticleColumnFlow";
import { htmlToPlainText } from "@/app/logged/logged_components/RichTextEditor";
import { normalizedBodyChunkHtml } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/articleContentModel";
import {
  chunkHasImage,
  chunkSupportsTextEditing,
  readChunkEditableText,
  writeChunkEditableText,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/articleChunkPlainTextEditing";
import type { PublicationArticleChunk } from "./types";

/** 228 × 297 mm portrait (magazine page proportion). */
const PAGE_ASPECT = "228 / 297";

function previewFormatForChunk(chunk: {
  publication_article_chunk_format: string;
  chunk_html: string;
}): MagazineChunkFormat {
  const fmt = normalizeChunkFormat(chunk.publication_article_chunk_format);
  if (fmt === "title" || fmt === "subtitle" || fmt === "only_text") return fmt;
  if (fmt === "only_image") return "only_image";
  if (fmt === "text_image" || fmt === "image_text") return fmt;
  return "only_text";
}

type ArticleSubpagePagePreviewProps = {
  chunks: PublicationArticleChunk[];
  pageIndex: number;
  isLeftPage: boolean;
  publicationPage: number | null;
  pageFormat: MagazinePageLayout;
  /** Hide the "Page preview" heading (e.g. modal thumbnails). */
  hideHeading?: boolean;
  /** All article pages in spread order — enables column overflow into the next page. */
  articleFlowPages?: MagazineArticleFlowPageInput[];
  /** Which page's body slice to show when `articleFlowPages` is set. */
  currentSlotContentId?: number | null;
  /**
   * When true, body text chunks render as autosizing textareas (real-time
   * editing) and image chunks expose an "Update image" overlay button.
   */
  editable?: boolean;
  /** Called with the next plain-text value while the user types. */
  onChunkTextChange?: (chunkId: string, nextPlainText: string) => void;
  /** Called when the user requests to replace the image of a chunk. */
  onChunkImageUpdate?: (chunkId: string) => void;
  /** Chunk ids whose save request is in flight (renders a small indicator). */
  savingChunkIds?: ReadonlySet<string>;
  /**
   * Make the page card stretch to fill the parent's full width (no centering
   * + no `max-w` cap). Used by the article-builder thumbnail so the scaled
   * preview occupies the entire box.
   */
  fillContainer?: boolean;
  /**
   * Called when the user clicks a "+" insertion slot between body chunks (or
   * before the first / after the last). `afterChunkId` is the id of the chunk
   * immediately above the clicked slot, or `null` when the slot sits above
   * every chunk on the page.
   */
  onAddChunkRequest?: (params: {
    afterChunkId: string | null;
    beforeChunkId: string | null;
  }) => void;
  /**
   * Chunk-selection mode for bulk deletion. When `true`, every body chunk
   * renders a small checkbox in its top-right corner. Selecting one calls
   * `onToggleChunkSelection`; the parent owns the actual selection state.
   */
  chunkSelectionMode?: boolean;
  selectedChunkIds?: ReadonlySet<string>;
  onToggleChunkSelection?: (chunkId: string) => void;
  /**
   * Image-area selection mode for floating-image placement. When `true`, the
   * page body shows a `columnCount × IMAGE_AREA_ROWS` grid of transparent
   * red-bordered cells. Clicking a cell forwards the {col,row} coordinates to
   * the parent — the parent decides whether to add a new 1×1 area, prompt a
   * merge, etc. Currently selected areas are passed back via `imageAreas` so
   * the preview can render their filled outlines + the "X" deselect button.
   */
  imageAreaSelectionMode?: boolean;
  imageAreas?: ImageAreaSelection[];
  onImageAreaCellClick?: (cell: GridCell) => void;
  onImageAreaRemove?: (areaId: string) => void;
  /** In add/delete-images mode: delete an existing floating overlay image chunk. */
  onOverlayImageDelete?: (chunkId: string) => void;
};

/**
 * Autosizing plain `<textarea>` used inside the magazine preview body. Holds
 * its own draft so the cursor doesn't reset / trailing whitespace isn't trimmed
 * by the HTML round-trip while the user is typing. External chunk updates
 * (e.g. a reload) push back into the textarea by comparing against the last
 * locally-emitted value.
 */
const EditableChunkTextarea: FC<{
  chunkId: string;
  chunkHtml: string;
  format: string;
  saving?: boolean;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  onChunkHtmlChange: (chunkId: string, nextChunkHtml: string) => void;
  readText: (chunkHtml: string, format: string) => string;
  buildHtml: (chunkHtml: string, format: string, nextText: string) => string;
}> = ({
  chunkId,
  chunkHtml,
  format,
  saving = false,
  className,
  placeholder,
  ariaLabel,
  onChunkHtmlChange,
  readText,
  buildHtml,
}) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [draft, setDraft] = useState(() => readText(chunkHtml, format));
  const lastEmittedRef = useRef(draft);

  useEffect(() => {
    const incoming = readText(chunkHtml, format);
    if (incoming !== lastEmittedRef.current) {
      setDraft(incoming);
      lastEmittedRef.current = incoming;
    }
  }, [chunkHtml, format, readText]);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [draft, resize]);

  return (
    <textarea
      ref={ref}
      value={draft}
      onChange={(e) => {
        const next = e.target.value;
        setDraft(next);
        lastEmittedRef.current = next;
        onChunkHtmlChange(chunkId, buildHtml(chunkHtml, format, next));
      }}
      onInput={resize}
      placeholder={placeholder}
      aria-label={ariaLabel}
      rows={1}
      style={{ resize: "none", overflow: "hidden" }}
      className={`${className ?? ""}${saving ? " opacity-80" : ""}`}
    />
  );
};

/**
 * Hover-only "+" button rendered in the gap above/below each body chunk to
 * insert a new editable text chunk. One slot sits between any two consecutive
 * chunks (shared by both), one above the first chunk, and one below the last.
 */
const InsertionSlot: FC<{
  onClick: () => void;
  ariaLabel?: string;
}> = ({ onClick, ariaLabel = "Add new text chunk here" }) => (
  <div
    className="group relative my-1 flex h-6 w-full items-center justify-center break-inside-avoid"
    data-pmc-insertion-slot=""
  >
    <span
      aria-hidden
      className="pointer-events-none absolute left-2 right-2 top-1/2 -translate-y-1/2 border-t border-dashed border-blue-300 opacity-0 transition group-hover:opacity-100"
    />
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-blue-400 bg-white text-blue-500 opacity-0 shadow-sm transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 group-hover:opacity-100"
    >
      <span className="text-xl leading-none">+</span>
    </button>
  </div>
);

/**
 * Floating checkbox rendered at the top-right of every body chunk while the
 * parent component is in "Select chunks to delete" mode. The parent owns the
 * actual selection state; this component is purely controlled.
 */
const ChunkSelectionCheckbox: FC<{
  checked: boolean;
  onToggle: () => void;
  ariaLabel?: string;
}> = ({ checked, onToggle, ariaLabel = "Select this chunk for deletion" }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={ariaLabel}
    title={ariaLabel}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onToggle();
    }}
    onMouseDown={(e) => {
      // Prevent the textarea below from stealing focus.
      e.preventDefault();
    }}
    className={`pointer-events-auto absolute right-2 top-2 z-30 inline-flex h-7 w-7 items-center justify-center rounded-md border-2 shadow-md transition ${
      checked
        ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
        : "border-gray-400 bg-white text-transparent hover:border-red-400 hover:text-red-300"
    }`}
  >
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className="h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.293a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L8.5 12.086l6.79-6.793a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  </button>
);

const UpdateImageButton: FC<{
  onClick: () => void;
  className?: string;
  label?: string;
}> = ({ onClick, className = "", label = "Update image" }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className={`pointer-events-auto absolute right-2 top-2 z-30 inline-flex items-center gap-2 rounded-md border border-white/70 bg-black/60 px-3 py-1.5 text-lg font-semibold uppercase tracking-wide text-white shadow-md backdrop-blur-sm transition hover:bg-black/80 ${className}`}
  >
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className="h-5 w-5"
    >
      <path d="M4 5a2 2 0 012-2h2.586a1 1 0 01.707.293l1.414 1.414A1 1 0 0011.414 5H14a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm6 3a3 3 0 100 6 3 3 0 000-6z" />
    </svg>
    {label}
  </button>
);

/**
 * Renders the floating-image area picker over the page body: a
 * `columnCount × IMAGE_AREA_ROWS` grid of empty red-bordered cells (clickable)
 * plus the currently selected areas (filled outline + "X" to deselect). All
 * positioning is in percent so it works regardless of the wrapper's scale.
 */
const ImageAreaSelectionLayer: FC<{
  columnCount: number;
  imageAreas: ImageAreaSelection[];
  /** Grid cells covered by existing floating overlay images (clicks pass through). */
  overlayBlockedCellKeys?: ReadonlySet<string>;
  onCellClick?: (cell: GridCell) => void;
  onRemoveArea?: (areaId: string) => void;
}> = ({
  columnCount,
  imageAreas,
  overlayBlockedCellKeys,
  onCellClick,
  onRemoveArea,
}) => {
  const occupied = new Set<string>();
  for (const area of imageAreas) {
    for (const cell of area.cells) {
      occupied.add(`${cell.col}-${cell.row}`);
    }
  }
  if (overlayBlockedCellKeys) {
    for (const key of overlayBlockedCellKeys) {
      occupied.add(key);
    }
  }
  const cells: GridCell[] = [];
  for (let col = 0; col < columnCount; col++) {
    for (let row = 0; row < IMAGE_AREA_ROWS; row++) {
      cells.push({ col, row });
    }
  }
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {cells.map((cell) => {
        const key = `${cell.col}-${cell.row}`;
        const isOccupied = occupied.has(key);
        const style = placementPercentStyle(
          {
            colStart: cell.col,
            colEnd: cell.col,
            rowStart: cell.row,
            rowEnd: cell.row,
          },
          columnCount
        );
        return (
          <button
            key={`cell-${key}`}
            type="button"
            disabled={isOccupied || !onCellClick}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isOccupied) onCellClick?.(cell);
            }}
            className={`pointer-events-auto absolute block border-4 border-dashed transition ${
              isOccupied
                ? "pointer-events-none border-transparent"
                : "border-red-400/80 bg-red-400/10 hover:bg-red-400/25"
            }`}
            style={style}
            aria-label={`Image area column ${cell.col + 1}, row ${cell.row + 1}`}
          />
        );
      })}
      {imageAreas.map((area) => {
        const style = placementPercentStyle(area.placement, columnCount);
        return (
          <div
            key={`area-${area.id}`}
            className="pointer-events-auto absolute border-4 border-solid border-red-500 bg-red-500/20"
            style={style}
            aria-label="Selected image area"
          >
            {onRemoveArea ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveArea(area.id);
                }}
                aria-label="Deselect this image area"
                title="Deselect this image area"
                className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-md transition hover:bg-red-700"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export const ArticleSubpagePagePreview: FC<ArticleSubpagePagePreviewProps> = ({
  chunks,
  pageIndex,
  isLeftPage,
  publicationPage,
  pageFormat,
  hideHeading = false,
  articleFlowPages,
  currentSlotContentId,
  editable = false,
  onChunkTextChange,
  onChunkImageUpdate,
  savingChunkIds,
  fillContainer = false,
  onAddChunkRequest,
  chunkSelectionMode = false,
  selectedChunkIds,
  onToggleChunkSelection,
  imageAreaSelectionMode = false,
  imageAreas,
  onImageAreaCellClick,
  onImageAreaRemove,
  onOverlayImageDelete,
}) => {
  const sorted = useMemo(
    () =>
      [...chunks].sort(
        (a, b) =>
          a.chunk_position - b.chunk_position ||
          a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
      ),
    [chunks]
  );

  const columnCount = pageFormat === "3_col_article" ? 3 : 2;

  const bodyColumnStyle = useMemo(
    (): CSSProperties => ({
      height: "100%",
      columnCount,
      columnFill: "auto",
      columnGap: "1.5rem",
      columnRuleWidth: "2px",
      columnRuleStyle: "solid",
      columnRuleColor: "rgb(229 231 235)",
      overflowWrap: "anywhere",
      wordBreak: "break-word",
    }),
    [columnCount]
  );

  const overlayChunks = useMemo(
    () =>
      sorted.filter((c) =>
        isOverlayImageChunk(
          c.chunk_html,
          c.publication_article_chunk_format,
          (c as { chunk_area_array?: unknown }).chunk_area_array
        )
      ),
    [sorted]
  );

  const overlayBlockedCellKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const chunk of overlayChunks) {
      const areaCodes = normalizeAreaCodes(
        (chunk as { chunk_area_array?: unknown }).chunk_area_array
      );
      const placement =
        areaCodes.length > 0
          ? areaCodesToPlacement(areaCodes, columnCount)
          : parseOverlayPlacement(chunk.chunk_html);
      if (!placement) continue;
      for (let c = placement.colStart; c <= placement.colEnd; c++) {
        for (let r = placement.rowStart; r <= placement.rowEnd; r++) {
          keys.add(`${c}-${r}`);
        }
      }
    }
    return keys;
  }, [overlayChunks, columnCount]);

  const useGridBodyLayout = overlayChunks.length > 0;

  const { headline, subtitle, bodyFlowChunks } = useMemo(() => {
    const titleChunk = sorted.find((c) => normalizeChunkFormat(c.publication_article_chunk_format) === "title");
    const subtitleChunk = sorted.find(
      (c) => normalizeChunkFormat(c.publication_article_chunk_format) === "subtitle"
    );
    const headlineText = titleChunk ? htmlToPlainText(titleChunk.chunk_html) : "";
    const subtitleText = subtitleChunk ? htmlToPlainText(subtitleChunk.chunk_html) : "";

    // In editable mode we keep every body chunk (including empty ones) so the
    // user can see and continue editing the empty textareas they just created.
    // Read-only mode keeps the previous behaviour: empty body chunks are
    // hidden by `extractBodyFlowChunks`'s `shouldOmitPortalBodyChunkFromFlow`.
    const bodyChunks = editable
      ? sorted.filter((c) => isFlowBodyChunk(c))
      : previewBodyChunksForPage(
          articleFlowPages,
          columnCount,
          currentSlotContentId,
          sorted
        );

    return {
      headline: headlineText || "Feature headline",
      subtitle: subtitleText || "Subtitle",
      bodyFlowChunks: bodyChunks,
    };
  }, [sorted, columnCount, articleFlowPages, currentSlotContentId, editable]);

  const footerNumber =
    publicationPage != null && Number.isFinite(publicationPage)
      ? String(Math.round(Number(publicationPage)))
      : pageIndex > 0
        ? String(pageIndex)
        : "—";

  // Header visibility rules (magazine convention):
  //   - The first article page always shows headline + subtitle.
  //   - Subsequent left pages keep the headline as a running title.
  //   - Subsequent right pages keep an empty header band (no title nor subtitle).
  const isFirstArticlePage = pageIndex === 1;
  const showHeadline = isFirstArticlePage || isLeftPage;
  const showSubtitle = isFirstArticlePage;

  const links = (
    <div className="flex flex-col text-right text-xl leading-snug text-amber-300">
      <span>Go to contents</span>
      <span>Go to advertiser index</span>
    </div>
  );

  const numberEl = (
    <span className="text-3xl font-semibold tabular-nums text-white">{footerNumber}</span>
  );

  const pageCard = (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-sm border border-gray-300 bg-white shadow-md ${
        fillContainer ? "" : "max-w-[min(100%,28rem)]"
      }`}
      style={{ aspectRatio: PAGE_ASPECT }}
    >
      <header className="flex h-[13%] shrink-0 flex-col justify-center bg-black px-6 py-2 text-white">
        {showHeadline ? (
          <h3 className="text-4xl font-bold leading-tight tracking-tight">{headline}</h3>
        ) : null}
        {showSubtitle ? (
          <p className="mt-1 text-2xl font-semibold leading-snug text-white/95">{subtitle}</p>
        ) : null}
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
        {sorted.length === 0 && !editable ? (
          <div className="flex h-full min-h-[6rem] items-center justify-center px-4 text-center text-2xl text-gray-400">
            No chunks on this page yet.
            
          </div>
        ) : (
          <>
            <div className="relative min-h-0 flex-1 overflow-hidden border-t border-gray-200">
              {columnCount >= 2 ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-3 inset-y-2 z-10"
                >
                  {Array.from({ length: columnCount - 1 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute inset-y-0 w-px bg-gray-200"
                      style={{ left: `${((i + 1) * 100) / columnCount}%` }}
                    />
                  ))}
                </div>
              ) : null}
              <div
                className={
                  useGridBodyLayout
                    ? "absolute inset-0 px-3 py-2"
                    : "h-full overflow-hidden px-3 py-2 text-2xl leading-snug text-gray-800 [overflow-wrap:anywhere] [&_.prose]:max-w-none [&_.prose]:break-words [&_.prose]:text-2xl [&_.prose]:leading-snug [&_.prose_*]:max-w-full [&_.prose_*]:break-words [&_.prose_*]:[overflow-wrap:anywhere] [&_.prose_p]:my-0 [&_.prose_p+p]:mt-1.5"
                }
                style={useGridBodyLayout ? undefined : bodyColumnStyle}
                data-magazine-preview-body=""
                data-magazine-preview-columns={columnCount}
              >
              {editable && onAddChunkRequest ? (
                <InsertionSlot
                  key="__slot-top__"
                  onClick={() =>
                    onAddChunkRequest({
                      afterChunkId: null,
                      beforeChunkId:
                        bodyFlowChunks[0]?.publication_article_chunk_id ?? null,
                    })
                  }
                />
              ) : null}
              {bodyFlowChunks.length === 0 ? (
                editable ? null : <p className="text-2xl text-gray-400 italic">—</p>
              ) : (
                bodyFlowChunks.map((chunk, chunkIdx) => {
                  const chunkHtml = normalizedBodyChunkHtml(chunk);
                  if (!chunkHtml.trim() && !editable) return null;
                  const fmt = previewFormatForChunk({ ...chunk, chunk_html: chunkHtml });
                  const isMediaBlock =
                    fmt === "only_image" || fmt === "text_image" || fmt === "image_text";
                  const chunkId = chunk.publication_article_chunk_id;
                  const isSaving = savingChunkIds?.has(chunkId) ?? false;
                  const rawFormat = chunk.publication_article_chunk_format;
                  const canEditText = chunkSupportsTextEditing(rawFormat);
                  const hasImg = chunkHasImage(chunk.chunk_html, rawFormat);

                  // The sharing rule ("two consecutive chunks share one
                  // insertion button") only applies when chunks stack
                  // vertically in the same column. When the next chunk
                  // starts a new column (it sits side-by-side, not below),
                  // we render both this chunk's trailing slot *and* the
                  // next chunk's leading slot so each one keeps its own
                  // vertical breathing room. Always render the trailing
                  // slot in editable mode.
                  const trailingSlot =
                    editable && onAddChunkRequest ? (
                      <InsertionSlot
                        key={`${chunkId}__slot-after`}
                        onClick={() =>
                          onAddChunkRequest({
                            afterChunkId: chunkId,
                            beforeChunkId:
                              bodyFlowChunks[chunkIdx + 1]?.publication_article_chunk_id ??
                              null,
                          })
                        }
                      />
                    ) : null;

                  const textareaClass =
                    "block w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-2xl leading-snug text-gray-800 outline-none ring-0 transition focus:border-blue-300 focus:bg-blue-50/40 focus:outline-2 focus:outline-blue-300";

                  const isChunkSelected =
                    chunkSelectionMode &&
                    !!selectedChunkIds &&
                    selectedChunkIds.has(chunkId);
                  const selectionOverlay =
                    chunkSelectionMode && onToggleChunkSelection ? (
                      <ChunkSelectionCheckbox
                        checked={isChunkSelected}
                        onToggle={() => onToggleChunkSelection(chunkId)}
                      />
                    ) : null;
                  const selectionRingClass = isChunkSelected
                    ? "outline outline-2 outline-red-400"
                    : "";

                  let chunkNode: React.ReactNode;
                  if (editable && canEditText && !isMediaBlock && onChunkTextChange) {
                    chunkNode = (
                      <div
                        className={`relative mb-1.5 max-w-full break-inside-avoid rounded-sm [overflow-wrap:anywhere] ${selectionRingClass}`}
                        data-pmc-editable-text-chunk={chunkId}
                      >
                        <EditableChunkTextarea
                          chunkId={chunkId}
                          chunkHtml={chunk.chunk_html}
                          format={rawFormat}
                          saving={isSaving}
                          onChunkHtmlChange={onChunkTextChange}
                          readText={readChunkEditableText}
                          buildHtml={writeChunkEditableText}
                          placeholder="Body text…"
                          ariaLabel={`Chunk ${chunkId} text`}
                          className={textareaClass}
                        />
                        {selectionOverlay}
                      </div>
                    );
                  } else if (isMediaBlock && editable) {
                    const imgSrc = extractFirstImgSrc(chunk.chunk_html);
                    const imgAlt = extractFirstImgAlt(chunk.chunk_html);
                    const showTextarea =
                      canEditText &&
                      !!onChunkTextChange &&
                      (fmt === "text_image" || fmt === "image_text");
                    chunkNode = (
                      <div
                        className={`relative mb-3 flex max-w-full break-inside-avoid flex-col gap-2 rounded-sm [overflow-wrap:anywhere] ${selectionRingClass}`}
                      >
                        <div className="relative w-full overflow-hidden rounded-sm border border-gray-200 bg-gray-50">
                          {imgSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imgSrc}
                              alt={imgAlt || ""}
                              className="block h-auto w-full object-contain"
                            />
                          ) : (
                            <div className="flex h-32 w-full items-center justify-center text-2xl text-gray-400">
                              No image selected.
                            </div>
                          )}
                          {onChunkImageUpdate && !chunkSelectionMode ? (
                            <UpdateImageButton
                              onClick={() => onChunkImageUpdate(chunkId)}
                              label={imgSrc ? "Update image" : "Add image"}
                            />
                          ) : null}
                        </div>
                        {showTextarea ? (
                          <EditableChunkTextarea
                            chunkId={chunkId}
                            chunkHtml={chunk.chunk_html}
                            format={rawFormat}
                            saving={isSaving}
                            onChunkHtmlChange={onChunkTextChange}
                            readText={readChunkEditableText}
                            buildHtml={writeChunkEditableText}
                            placeholder="Body text…"
                            ariaLabel={`Chunk ${chunkId} text`}
                            className={textareaClass}
                          />
                        ) : null}
                        {selectionOverlay}
                      </div>
                    );
                  } else if (isMediaBlock) {
                    chunkNode = (
                      <div
                        className={`relative mb-3 max-w-full break-inside-avoid rounded-sm px-3 py-2 [overflow-wrap:anywhere] ${selectionRingClass}`}
                      >
                        <MagazineChunkEditorPreview format={fmt} chunkHtml={chunkHtml} />
                        {editable && hasImg && onChunkImageUpdate && !chunkSelectionMode ? (
                          <UpdateImageButton onClick={() => onChunkImageUpdate(chunkId)} />
                        ) : null}
                        {selectionOverlay}
                      </div>
                    );
                  } else {
                    chunkNode = (
                      <div
                        className={`relative mb-1.5 block max-w-full break-inside-avoid rounded-sm px-3 py-2 [overflow-wrap:anywhere] ${selectionRingClass}`}
                      >
                        <MagazineChunkEditorPreview format={fmt} chunkHtml={chunkHtml} />
                        {selectionOverlay}
                      </div>
                    );
                  }

                  const breakBeforeColumn = chunkIdx >= 1 && chunkIdx < columnCount;
                  const leadingSlot =
                    breakBeforeColumn && editable && onAddChunkRequest ? (
                      <InsertionSlot
                        key={`${chunkId}__slot-before`}
                        onClick={() =>
                          onAddChunkRequest({
                            afterChunkId:
                              bodyFlowChunks[chunkIdx - 1]
                                ?.publication_article_chunk_id ?? null,
                            beforeChunkId: chunkId,
                          })
                        }
                      />
                    ) : null;
                  const wrappedChunkNode = breakBeforeColumn ? (
                    <div
                      className="break-inside-avoid"
                      style={{ breakBefore: "column" } as CSSProperties}
                    >
                      {leadingSlot}
                      {chunkNode}
                    </div>
                  ) : (
                    chunkNode
                  );

                  if (useGridBodyLayout) {
                    const placement = textChunkPlacementForPreview(
                      chunk as { chunk_area_array?: unknown },
                      chunkIdx,
                      columnCount
                    );
                    if (!placement) return null;
                    const box = placementPercentStyle(placement, columnCount);
                    return (
                      <div
                        key={chunkId}
                        className="pointer-events-auto absolute flex min-h-0 flex-col overflow-visible text-2xl leading-snug text-gray-800"
                        style={box}
                      >
                        {leadingSlot}
                        <div className="min-h-0 flex-1 overflow-hidden">{chunkNode}</div>
                        {trailingSlot}
                      </div>
                    );
                  }

                  return (
                    <React.Fragment key={chunkId}>
                      {wrappedChunkNode}
                      {trailingSlot}
                    </React.Fragment>
                  );
                })
              )}
              
              </div>
            </div>

            {overlayChunks.length > 0 ? (
              <div
                className={`absolute inset-0 pointer-events-none ${
                  imageAreaSelectionMode ? "z-40" : "z-20"
                }`}
              >
                {overlayChunks.map((chunk) => {
                  const areaCodes = normalizeAreaCodes(
                    (chunk as { chunk_area_array?: unknown }).chunk_area_array
                  );
                  const placement =
                    areaCodes.length > 0
                      ? areaCodesToPlacement(areaCodes, columnCount)
                      : parseOverlayPlacement(chunk.chunk_html);
                  const src = overlayImageSrc(chunk.chunk_html);
                  if (!placement || !src) return null;
                  const box = placementPercentStyle(placement, columnCount);
                  const chunkId = chunk.publication_article_chunk_id;
                  return (
                    <div
                      key={chunkId}
                      className={`absolute overflow-hidden ${
                        imageAreaSelectionMode ? "pointer-events-auto" : ""
                      }`}
                      style={box}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      {imageAreaSelectionMode && onOverlayImageDelete ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOverlayImageDelete(chunkId);
                          }}
                          aria-label="Delete this image"
                          title="Delete this image"
                          className="pointer-events-auto absolute right-2 top-2 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-md transition hover:bg-red-700"
                        >
                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden
                            className="h-5 w-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      ) : editable && onChunkImageUpdate && !chunkSelectionMode ? (
                        <UpdateImageButton onClick={() => onChunkImageUpdate(chunkId)} />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {imageAreaSelectionMode ? (
              <ImageAreaSelectionLayer
                columnCount={columnCount}
                imageAreas={imageAreas ?? []}
                overlayBlockedCellKeys={overlayBlockedCellKeys}
                onCellClick={onImageAreaCellClick}
                onRemoveArea={onImageAreaRemove}
              />
            ) : null}
          </>
        )}
      </div>

      <footer className="flex h-[8%] shrink-0 items-center justify-between bg-black px-6 py-2 text-white">
        {isLeftPage ? (
          <>
            {numberEl}
            {links}
          </>
        ) : (
          <>
            {links}
            {numberEl}
            
          </>
        )}
      </footer>
    </div>
  );

  if (hideHeading) {
    if (fillContainer) return pageCard;
    return <div className="flex w-full flex-col items-center">{pageCard}</div>;
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <h2 className="text-sm font-semibold text-gray-800">Page preview</h2>
      {pageCard}
    </div>
  );
};
