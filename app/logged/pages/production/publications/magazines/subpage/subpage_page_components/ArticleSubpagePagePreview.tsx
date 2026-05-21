"use client";

import React, {
  CSSProperties,
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  dedupeGridBodyChunksByCell,
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
import {
  isRichTextEmpty,
  RichTextContent,
} from "@/app/logged/logged_components/RichTextEditor";
import { normalizedBodyChunkHtml } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/articleContentModel";
import {
  chunkFormatIncludesImage,
  chunkHasImage,
  chunkSupportsTextEditing,
  readChunkEditableHtml,
  readChunkImageCaption,
  writeChunkEditableHtml,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/articleChunkPlainTextEditing";
import { useArticleBuilderRichTextToolbar } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_builder_page/components/ArticleBuilderFloatingRichTextToolbar";
import type { PublicationArticleChunk } from "./types";

/** 228 × 297 mm portrait (magazine page proportion). */
const PAGE_ASPECT = "228 / 297";

/** Title/subtitle band — extra horizontal and vertical breathing room. */
const MAGAZINE_HEADER_PAD_CLASS = "px-10 py-5";

/**
 * Body content inset: matches chunk text `px-4 py-2`, with `pt-12` below the
 * black header. Grid overlays and add/delete-image cells share this box.
 */
const MAGAZINE_BODY_INSET_CLASS = "px-4 pt-12 pb-2";

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
   * Title/subtitle HTML from page 1 (passed when this preview's `chunks` omit
   * heading chunks, e.g. page 2+ in the article builder).
   */
  articleTitleHtml?: string | null;
  articleSubtitleHtml?: string | null;
  /**
   * When true, body text chunks render as autosizing textareas (real-time
   * editing) and image chunks expose an "Update image" overlay button.
   */
  editable?: boolean;
  /** Called while the user types (debounced save on the parent). */
  onChunkTextChange?: (chunkId: string, nextChunkHtml: string) => void;
  /** Called on blur to persist immediately (before navigation / refresh). */
  onChunkHtmlCommit?: (chunkId: string, nextChunkHtml: string) => void;
  /**
   * Grid layout only: when body text exceeds the cell height, redistribute overflow
   * into the next chunk (column-major order). Parent updates chunk HTML.
   */
  onGridTextOverflowCheck?: (chunkId: string, editorEl: HTMLDivElement) => void;
  /** Called when the user requests to replace the image of a chunk. */
  onChunkImageUpdate?: (chunkId: string) => void;
  /** Opens the caption editor for an image chunk. */
  onChunkCaptionUpdate?: (chunkId: string) => void;
  /** Chunk ids whose save request is in flight (renders a small indicator). */
  savingChunkIds?: ReadonlySet<string>;
  /**
   * Make the page card stretch to fill the parent's full width (no centering
   * + no `max-w` cap). Used by the article-builder thumbnail so the scaled
   * preview occupies the entire box.
   */
  fillContainer?: boolean;
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
 * Rich-text body field (`contentEditable`) for the magazine preview. Formatting
 * is applied via the floating {@link RichTextToolbar}; HTML is stored on the chunk.
 */
const EditableChunkRichBody: FC<{
  chunkId: string;
  chunkHtml: string;
  format: string;
  isLeftPage: boolean;
  saving?: boolean;
  className?: string;
  fillContainer?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  onChunkHtmlChange: (chunkId: string, nextChunkHtml: string) => void;
  onChunkHtmlCommit?: (chunkId: string, nextChunkHtml: string) => void;
  onGridTextOverflowCheck?: (chunkId: string, editorEl: HTMLDivElement) => void;
}> = ({
  chunkId,
  chunkHtml,
  format,
  isLeftPage,
  saving = false,
  className,
  fillContainer = false,
  placeholder,
  ariaLabel,
  onChunkHtmlChange,
  onChunkHtmlCommit,
  onGridTextOverflowCheck,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const chunkHtmlRef = useRef(chunkHtml);
  const isInternalChange = useRef(false);
  const syncingFromProps = useRef(false);
  const lastEmittedHtmlRef = useRef(readChunkEditableHtml(chunkHtml, format));
  const { registerActiveChunkEditor, clearActiveChunkEditor } =
    useArticleBuilderRichTextToolbar();

  chunkHtmlRef.current = chunkHtml;

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el || syncingFromProps.current) return;
    const nextHtml = el.innerHTML;
    lastEmittedHtmlRef.current = nextHtml;
    isInternalChange.current = true;
    onChunkHtmlChange(
      chunkId,
      writeChunkEditableHtml(chunkHtmlRef.current, format, nextHtml)
    );
  }, [chunkId, format, onChunkHtmlChange]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const incoming = readChunkEditableHtml(chunkHtml, format);
    if (incoming !== lastEmittedHtmlRef.current && el.innerHTML !== incoming) {
      syncingFromProps.current = true;
      el.innerHTML = incoming || "";
      lastEmittedHtmlRef.current = incoming;
      requestAnimationFrame(() => {
        syncingFromProps.current = false;
      });
    }
  }, [chunkHtml, format]);

  const resize = useCallback(() => {
    const el = editorRef.current;
    if (!el || fillContainer) return;
    el.style.height = "auto";
    el.style.minHeight = "1.5em";
    el.style.height = `${Math.max(el.scrollHeight, 24)}px`;
  }, [fillContainer]);

  useEffect(() => {
    resize();
  }, [chunkHtml, resize]);

  const handleFocus = useCallback(() => {
    registerActiveChunkEditor({
      chunkId,
      editorRef,
      isLeftPage,
      onAfterCommand: emitChange,
    });
  }, [chunkId, emitChange, isLeftPage, registerActiveChunkEditor]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const focused =
      document.activeElement === el || el.contains(document.activeElement);
    if (!focused) return;
    registerActiveChunkEditor({
      chunkId,
      editorRef,
      isLeftPage,
      onAfterCommand: emitChange,
    });
  }, [
    chunkId,
    emitChange,
    isLeftPage,
    registerActiveChunkEditor,
    chunkHtml,
  ]);

  const commitEditorHtml = useCallback(() => {
    const el = editorRef.current;
    if (!el || syncingFromProps.current) return;
    const nextInner = el.innerHTML;
    const fullHtml = writeChunkEditableHtml(
      chunkHtmlRef.current,
      format,
      nextInner
    );
    lastEmittedHtmlRef.current = nextInner;
    isInternalChange.current = true;
    onChunkHtmlChange(chunkId, fullHtml);
    onChunkHtmlCommit?.(chunkId, fullHtml);
  }, [chunkId, format, onChunkHtmlChange, onChunkHtmlCommit]);

  const handleBlur = useCallback(() => {
    window.setTimeout(() => {
      const active = document.activeElement;
      const toolbar = document.querySelector("[data-pmc-floating-rich-toolbar]");
      if (toolbar?.contains(active)) return;
      if (editorRef.current?.contains(active)) return;
      commitEditorHtml();
      clearActiveChunkEditor(chunkId);
    }, 0);
  }, [chunkId, clearActiveChunkEditor, commitEditorHtml]);

  const overflowRafRef = useRef<number | null>(null);
  const scheduleGridOverflowCheck = useCallback(() => {
    if (!fillContainer || !onGridTextOverflowCheck) return;
    if (overflowRafRef.current != null) {
      cancelAnimationFrame(overflowRafRef.current);
    }
    overflowRafRef.current = requestAnimationFrame(() => {
      overflowRafRef.current = null;
      const el = editorRef.current;
      if (!el || syncingFromProps.current) return;
      if (el.scrollHeight <= el.clientHeight + 1) return;
      onGridTextOverflowCheck(chunkId, el);
    });
  }, [chunkId, fillContainer, onGridTextOverflowCheck]);

  useEffect(
    () => () => {
      if (overflowRafRef.current != null) {
        cancelAnimationFrame(overflowRafRef.current);
      }
    },
    []
  );

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const plain = e.clipboardData.getData("text/plain");
    const escaped = plain
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const insertHtml = escaped.replace(/\r\n?|\n/g, "<br>");
    document.execCommand("insertHTML", false, insertHtml);
    emitChange();
    resize();
    scheduleGridOverflowCheck();
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline
      aria-label={ariaLabel}
      data-placeholder={placeholder}
      data-pmc-chunk-rich-editor={chunkId}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onInput={() => {
        emitChange();
        resize();
        scheduleGridOverflowCheck();
      }}
      onPaste={handlePaste}
      className={`rich-text-editor-body outline-none ${className ?? ""}${
        saving ? " opacity-80" : ""
      }${fillContainer ? " h-full min-h-0 overflow-hidden" : " min-h-[1.5em]"}`}
      style={fillContainer ? { height: "100%" } : undefined}
    />
  );
};

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

const imageChunkOverlayButtonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/70 bg-black/60 px-3 py-1.5 text-lg font-semibold uppercase tracking-wide text-white shadow-md backdrop-blur-sm transition hover:bg-black/80";

const UpdateImageButton: FC<{
  onClick: () => void;
  className?: string;
  label?: string;
  stacked?: boolean;
}> = ({ onClick, className = "", label = "Update image", stacked = false }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className={`pointer-events-auto z-30 ${imageChunkOverlayButtonClass} ${
      stacked ? "" : "absolute right-2 top-2"
    } ${className}`}
  >
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className="h-5 w-5 shrink-0"
    >
      <path d="M4 5a2 2 0 012-2h2.586a1 1 0 01.707.293l1.414 1.414A1 1 0 0011.414 5H14a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm6 3a3 3 0 100 6 3 3 0 000-6z" />
    </svg>
    {label}
  </button>
);

const UpdateCaptionButton: FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className={`pointer-events-auto z-30 ${imageChunkOverlayButtonClass}`}
  >
    Update caption
  </button>
);

const ImageCaptionOverlay: FC<{ caption: string }> = ({ caption }) => {
  const text = caption.trim();
  if (!text) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-black/80 px-2 py-1.5">
      <p className="text-left text-sm italic text-white">{text}</p>
    </div>
  );
};

const ImageChunkActionButtons: FC<{
  onUpdateImage: () => void;
  onUpdateCaption: () => void;
  imageLabel?: string;
}> = ({ onUpdateImage, onUpdateCaption, imageLabel }) => (
  <div className="pointer-events-auto absolute right-2 top-2 z-30 flex w-[min(100%,12rem)] flex-col items-stretch gap-1">
    <UpdateImageButton stacked onClick={onUpdateImage} label={imageLabel} />
    <UpdateCaptionButton onClick={onUpdateCaption} />
  </div>
);

const EditableImageChunkFrame: FC<{
  imgSrc: string | null;
  imgAlt: string;
  caption: string;
  showImageActions: boolean;
  onUpdateImage: () => void;
  onUpdateCaption: () => void;
  imageButtonLabel?: string;
  objectFitClass?: string;
  children?: React.ReactNode;
}> = ({
  imgSrc,
  imgAlt,
  caption,
  showImageActions,
  onUpdateImage,
  onUpdateCaption,
  imageButtonLabel,
  objectFitClass = "object-contain",
  children,
}) => (
  <div className="relative w-full overflow-hidden rounded-sm border border-gray-200 bg-gray-50">
    {imgSrc ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imgSrc} alt={imgAlt || ""} className={`block h-auto w-full ${objectFitClass}`} />
    ) : (
      <div className="flex h-32 w-full items-center justify-center text-2xl text-gray-400">
        No image selected.
      </div>
    )}
    <ImageCaptionOverlay caption={caption} />
    {showImageActions ? (
      <ImageChunkActionButtons
        onUpdateImage={onUpdateImage}
        onUpdateCaption={onUpdateCaption}
        imageLabel={imageButtonLabel}
      />
    ) : null}
    {children}
  </div>
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
  articleTitleHtml: articleTitleHtmlProp,
  articleSubtitleHtml: articleSubtitleHtmlProp,
  editable = false,
  onChunkTextChange,
  onChunkHtmlCommit,
  onGridTextOverflowCheck,
  onChunkImageUpdate,
  onChunkCaptionUpdate,
  savingChunkIds,
  fillContainer = false,
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
      columnGap: 0,
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

  const useGridBodyLayout = useMemo(() => {
    if (overlayChunks.length > 0) return true;
    return sorted.some((c) => {
      if (!isFlowBodyChunk(c)) return false;
      const codes = normalizeAreaCodes(
        (c as { chunk_area_array?: unknown }).chunk_area_array
      );
      if (!codes.length) return false;
      return areaCodesToPlacement(codes, columnCount) != null;
    });
  }, [sorted, overlayChunks, columnCount]);

  /** Lateral margin between chunk edge and text — applied inside the textarea only. */
  const chunkTextareaXPad = "px-4";
  const chunkBottomBorderClass = "border-b border-dashed border-gray-200";
  const gridTextShellClass = `relative flex min-h-0 flex-1 flex-col bg-white [overflow-wrap:anywhere] ${chunkBottomBorderClass}`;
  const gridTextareaClass = `block h-full min-h-0 w-full flex-1 border-0 bg-white ${chunkTextareaXPad} py-2 text-2xl leading-snug text-gray-500 outline-none ring-0 transition placeholder:text-gray-400 focus:bg-white focus:outline-2 focus:outline-blue-300`;
  const gridTextPreviewClass = `min-h-0 flex-1 overflow-hidden bg-white ${chunkTextareaXPad} py-2 text-2xl leading-snug text-gray-500 [&_.prose]:text-gray-500 [&_.prose_*]:text-gray-500`;
  const flowTextareaClass = `block w-full border-0 bg-white ${chunkTextareaXPad} py-2 text-2xl leading-snug text-gray-800 outline-none ring-0 transition focus:bg-blue-50/40 focus:outline-2 focus:outline-blue-300`;
  const flowTextShellClass = `relative max-w-full break-inside-avoid bg-white [overflow-wrap:anywhere] ${chunkBottomBorderClass}`;
  const flowMediaShellClass = `relative flex max-w-full break-inside-avoid flex-col [overflow-wrap:anywhere] ${chunkBottomBorderClass}`;
  const flowTextPreviewPadClass = `${chunkTextareaXPad} py-2`;

  /** 40% larger than `text-4xl` (2.25rem → 3.15rem). */
  const headerTitleClass =
    "text-[3.15rem] leading-tight tracking-tight text-white [&_*]:max-w-full [&_b]:font-bold [&_strong]:font-bold [&_em]:italic [&_i]:italic [&_p]:my-0 [&_p+p]:mt-1 [&_p]:text-[3.15rem]";
  const headerSubtitleClass =
    "mt-1 text-2xl leading-snug text-white/95 [&_*]:max-w-full [&_b]:font-bold [&_strong]:font-bold [&_em]:italic [&_i]:italic [&_p]:my-0 [&_p+p]:mt-1";

  const { headlineHtml, subtitleHtml, bodyFlowChunks } = useMemo(() => {
    const titleChunk = sorted.find(
      (c) => normalizeChunkFormat(c.publication_article_chunk_format) === "title"
    );
    const subtitleChunk = sorted.find(
      (c) => normalizeChunkFormat(c.publication_article_chunk_format) === "subtitle"
    );
    const titleHtml =
      (articleTitleHtmlProp != null && String(articleTitleHtmlProp).trim() !== ""
        ? String(articleTitleHtmlProp)
        : titleChunk?.chunk_html) ?? "";
    const subHtml =
      (articleSubtitleHtmlProp != null && String(articleSubtitleHtmlProp).trim() !== ""
        ? String(articleSubtitleHtmlProp)
        : subtitleChunk?.chunk_html) ?? "";

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

    const bodyFlowChunks =
      editable && useGridBodyLayout
        ? dedupeGridBodyChunksByCell(bodyChunks, columnCount)
        : bodyChunks;

    return {
      headlineHtml: titleHtml,
      subtitleHtml: subHtml,
      bodyFlowChunks,
    };
  }, [
    sorted,
    columnCount,
    articleFlowPages,
    currentSlotContentId,
    editable,
    useGridBodyLayout,
    articleTitleHtmlProp,
    articleSubtitleHtmlProp,
  ]);

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
      data-article-preview-page-card=""
      className={`flex w-full flex-col overflow-hidden rounded-sm border border-gray-300 bg-white shadow-md ${
        fillContainer ? "" : "max-w-[min(100%,28rem)]"
      }`}
      style={{ aspectRatio: PAGE_ASPECT }}
    >
      <header
        className={`flex h-[13%] shrink-0 flex-col justify-center bg-black text-white ${MAGAZINE_HEADER_PAD_CLASS}`}
      >
        {showHeadline ? (
          isRichTextEmpty(headlineHtml) ? (
            <div className={headerTitleClass}>Feature headline</div>
          ) : (
            <RichTextContent
              htmlOrPlain={headlineHtml}
              className={headerTitleClass}
              as="div"
            />
          )
        ) : null}
        {showSubtitle ? (
          isRichTextEmpty(subtitleHtml) ? (
            <div className={headerSubtitleClass}>Subtitle</div>
          ) : (
            <RichTextContent
              htmlOrPlain={subtitleHtml}
              className={headerSubtitleClass}
              as="div"
            />
          )
        ) : null}
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
        {sorted.length === 0 && !editable ? (
          <div className="flex h-full min-h-[6rem] items-center justify-center px-4 text-center text-2xl text-gray-400">
            No chunks on this page yet.
            
          </div>
        ) : (
          <>
            <div
              className={`relative min-h-0 flex-1 overflow-hidden border-t border-gray-200 ${MAGAZINE_BODY_INSET_CLASS}`}
            >
              {columnCount >= 2 ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-10"
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
                    ? "absolute inset-0"
                    : "h-full overflow-hidden text-2xl leading-snug text-gray-800 [overflow-wrap:anywhere] [&_.prose]:max-w-none [&_.prose]:break-words [&_.prose]:text-2xl [&_.prose]:leading-snug [&_.prose_*]:max-w-full [&_.prose_*]:break-words [&_.prose_*]:[overflow-wrap:anywhere] [&_.prose_p]:my-0 [&_.prose_p+p]:mt-1.5"
                }
                style={useGridBodyLayout ? undefined : bodyColumnStyle}
                data-magazine-preview-body=""
                data-magazine-preview-columns={columnCount}
              >
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
                        className={
                          useGridBodyLayout
                            ? `${gridTextShellClass} ${selectionRingClass}`
                            : `${flowTextShellClass} ${selectionRingClass}`
                        }
                        data-pmc-editable-text-chunk={chunkId}
                      >
                        <EditableChunkRichBody
                          chunkId={chunkId}
                          chunkHtml={chunk.chunk_html}
                          format={rawFormat}
                          isLeftPage={isLeftPage}
                          saving={isSaving}
                          fillContainer={useGridBodyLayout}
                          onChunkHtmlChange={onChunkTextChange}
                          onChunkHtmlCommit={onChunkHtmlCommit}
                          onGridTextOverflowCheck={
                            useGridBodyLayout ? onGridTextOverflowCheck : undefined
                          }
                          placeholder="Body text…"
                          ariaLabel={`Chunk ${chunkId} text`}
                          className={
                            useGridBodyLayout ? gridTextareaClass : flowTextareaClass
                          }
                        />
                        {selectionOverlay}
                      </div>
                    );
                  } else if (isMediaBlock && editable) {
                    const imgSrc = extractFirstImgSrc(chunk.chunk_html);
                    const imgAlt = extractFirstImgAlt(chunk.chunk_html);
                    const caption = readChunkImageCaption(chunk);
                    const showImageActions =
                      !chunkSelectionMode &&
                      chunkFormatIncludesImage(rawFormat) &&
                      !!onChunkImageUpdate &&
                      !!onChunkCaptionUpdate;
                    const showTextarea =
                      canEditText &&
                      !!onChunkTextChange &&
                      (fmt === "text_image" || fmt === "image_text");
                    chunkNode = (
                      <div
                        className={`${flowMediaShellClass} ${selectionRingClass}`}
                      >
                        <EditableImageChunkFrame
                          imgSrc={imgSrc}
                          imgAlt={imgAlt || ""}
                          caption={caption}
                          showImageActions={showImageActions}
                          onUpdateImage={() => onChunkImageUpdate!(chunkId)}
                          onUpdateCaption={() => onChunkCaptionUpdate!(chunkId)}
                          imageButtonLabel={imgSrc ? "Update image" : "Add image"}
                        />
                        {showTextarea ? (
                          <EditableChunkRichBody
                            chunkId={chunkId}
                            chunkHtml={chunk.chunk_html}
                            format={rawFormat}
                            isLeftPage={isLeftPage}
                            saving={isSaving}
                            onChunkHtmlChange={onChunkTextChange}
                            onChunkHtmlCommit={onChunkHtmlCommit}
                            placeholder="Body text…"
                            ariaLabel={`Chunk ${chunkId} text`}
                            className={flowTextareaClass}
                          />
                        ) : null}
                        {selectionOverlay}
                      </div>
                    );
                  } else if (isMediaBlock) {
                    const mediaCaption = readChunkImageCaption(chunk);
                    chunkNode = (
                      <div
                        className={`${flowMediaShellClass} ${selectionRingClass} relative`}
                      >
                        <MagazineChunkEditorPreview format={fmt} chunkHtml={chunkHtml} />
                        <ImageCaptionOverlay caption={mediaCaption} />
                        {editable &&
                        hasImg &&
                        chunkFormatIncludesImage(rawFormat) &&
                        onChunkImageUpdate &&
                        onChunkCaptionUpdate &&
                        !chunkSelectionMode ? (
                          <ImageChunkActionButtons
                            onUpdateImage={() => onChunkImageUpdate(chunkId)}
                            onUpdateCaption={() => onChunkCaptionUpdate(chunkId)}
                          />
                        ) : null}
                        {selectionOverlay}
                      </div>
                    );
                  } else {
                    chunkNode = (
                      <div
                        className={
                          useGridBodyLayout
                            ? `${gridTextShellClass} ${selectionRingClass}`
                            : `${flowTextShellClass} ${selectionRingClass}`
                        }
                      >
                        {useGridBodyLayout ? (
                          <div className={gridTextPreviewClass}>
                            <MagazineChunkEditorPreview format={fmt} chunkHtml={chunkHtml} />
                          </div>
                        ) : (
                          <div className={flowTextPreviewPadClass}>
                            <MagazineChunkEditorPreview format={fmt} chunkHtml={chunkHtml} />
                          </div>
                        )}
                        {selectionOverlay}
                      </div>
                    );
                  }

                  const breakBeforeColumn = chunkIdx >= 1 && chunkIdx < columnCount;
                  const wrappedChunkNode = breakBeforeColumn ? (
                    <div
                      className="break-inside-avoid"
                      style={{ breakBefore: "column" } as CSSProperties}
                    >
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
                        className="pointer-events-auto absolute flex min-h-0 flex-col overflow-hidden text-2xl leading-snug"
                        style={box}
                      >
                        {chunkNode}
                      </div>
                    );
                  }

                  return <React.Fragment key={chunkId}>{wrappedChunkNode}</React.Fragment>;
                })
              )}
              
              </div>

            {overlayChunks.length > 0 ? (
              <div
                className={`pointer-events-none absolute inset-0 ${
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
                  const overlayCaption = readChunkImageCaption(chunk);
                  const showOverlayImageActions =
                    editable &&
                    onChunkImageUpdate &&
                    onChunkCaptionUpdate &&
                    !chunkSelectionMode;
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
                      <ImageCaptionOverlay caption={overlayCaption} />
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
                      ) : showOverlayImageActions ? (
                        <ImageChunkActionButtons
                          onUpdateImage={() => onChunkImageUpdate!(chunkId)}
                          onUpdateCaption={() => onChunkCaptionUpdate!(chunkId)}
                        />
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
            </div>
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
