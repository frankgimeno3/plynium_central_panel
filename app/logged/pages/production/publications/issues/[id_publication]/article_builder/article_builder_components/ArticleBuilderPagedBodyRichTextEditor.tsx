"use client";

import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import RichTextToolbar from "@/app/logged/logged_components/RichTextEditor/RichTextToolbar";
import { RichTextEditor } from "@/app/logged/logged_components/RichTextEditor";
import type { MagazinePageLayout } from "./magazinePageLayout";
import type { MagazineArticleFlowPageInput } from "./magazineArticleColumnFlow";
import {
  joinPageSegmentHtml,
  splitBodyHtmlIntoPageSegments,
} from "./articleBodyDistribution";
import {
  currentPreviewBodyDimensions,
  htmlOverflowsColumnArea,
  splitBlocksByMeasurement,
} from "./magazinePreviewMeasurement";
import {
  joinParagraphBlocks,
  splitHtmlIntoParagraphBlocks,
} from "./magazineChunkColumnOverflow";
import { linkifyImageUrlsInHtml, plainTextToEditorHtml } from "./portalArticleChunkHtml";
// `linkifyImageUrlsInHtml` is still used below when re-syncing existing HTML
// into segment DOM nodes, so that already-saved URLs render as image boxes.

/** Text length of the caret position relative to the contenteditable element. */
function getCaretTextOffsetWithin(element: HTMLElement): number {
  const selection = typeof window !== "undefined" ? window.getSelection() : null;
  if (!selection || selection.rangeCount === 0) return 0;
  const range = selection.getRangeAt(0);
  if (!element.contains(range.endContainer)) return 0;
  const probe = document.createRange();
  probe.selectNodeContents(element);
  try {
    probe.setEnd(range.endContainer, range.endOffset);
  } catch {
    return 0;
  }
  return probe.toString().length;
}

/** Places the caret at a given text offset inside `element`. */
function setCaretTextOffsetWithin(element: HTMLElement, offset: number): void {
  const selection = typeof window !== "undefined" ? window.getSelection() : null;
  if (!selection) return;
  const range = document.createRange();
  let remaining = Math.max(0, offset);
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const len = node.nodeValue?.length ?? 0;
    if (remaining <= len) {
      range.setStart(node, remaining);
      range.setEnd(node, remaining);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    remaining -= len;
    node = walker.nextNode();
  }
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

const PAGE_ZONE_THEMES = [
  {
    zone: "border-blue-200 bg-blue-50/90",
    header: "border-blue-200/80 bg-blue-100/90 text-blue-950",
    badge: "bg-blue-200/80 text-blue-950",
  },
  {
    zone: "border-amber-200 bg-amber-50/90",
    header: "border-amber-200/80 bg-amber-100/90 text-amber-950",
    badge: "bg-amber-200/80 text-amber-950",
  },
  {
    zone: "border-emerald-200 bg-emerald-50/90",
    header: "border-emerald-200/80 bg-emerald-100/90 text-emerald-950",
    badge: "bg-emerald-200/80 text-emerald-950",
  },
  {
    zone: "border-violet-200 bg-violet-50/90",
    header: "border-violet-200/80 bg-violet-100/90 text-violet-950",
    badge: "bg-violet-200/80 text-violet-950",
  },
  {
    zone: "border-rose-200 bg-rose-50/90",
    header: "border-rose-200/80 bg-rose-100/90 text-rose-950",
    badge: "bg-rose-200/80 text-rose-950",
  },
] as const;

type ArticleBuilderPagedBodyRichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  articleFlowPages: MagazineArticleFlowPageInput[];
  pageFormat: MagazinePageLayout;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  /**
   * Invoked when the user clicks the trash icon on an empty article page zone.
   * Receives the target slot id and its 1-based article-page index. The parent
   * is expected to open a confirmation modal and call the delete endpoint.
   */
  onRequestDeleteEmptyPage?: (slotId: number, pageIndex: number) => void;
};

export const ArticleBuilderPagedBodyRichTextEditor: FC<
  ArticleBuilderPagedBodyRichTextEditorProps
> = ({
  value,
  onChange,
  articleFlowPages,
  pageFormat,
  placeholder = "Write body text…",
  minHeight = "180px",
  className = "",
  onRequestDeleteEmptyPage,
}) => {
  const usePagedLayout = articleFlowPages.length > 1;

  /** slotContentId → total chunk count on that page (any format). */
  const chunkCountBySlot = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of articleFlowPages) {
      m.set(p.slotContentId, Array.isArray(p.chunks) ? p.chunks.length : 0);
    }
    return m;
  }, [articleFlowPages]);

  /** Truly-empty pages are deletable as long as we have more than one page. */
  const canShowDeleteButton = articleFlowPages.length > 1 && Boolean(onRequestDeleteEmptyPage);

  // Mirror the preview's column-fit by reading live preview dimensions when
  // available. This keeps the colored editor zones in sync with where text
  // will actually land in the rendered preview.
  const [previewDimsTick, setPreviewDimsTick] = useState(0);
  useEffect(() => {
    if (!usePagedLayout) return;
    const onResize = () => setPreviewDimsTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [usePagedLayout]);

  const segments = useMemo(() => {
    if (!usePagedLayout) return [];
    const dims = currentPreviewBodyDimensions();
    return splitBodyHtmlIntoPageSegments(value, articleFlowPages, pageFormat, dims);
    // previewDimsTick is intentional: re-derive on viewport resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, articleFlowPages, pageFormat, usePagedLayout, previewDimsTick]);

  const activeEditorRef = useRef<HTMLDivElement | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const syncingFromProps = useRef(false);
  const isInternalChange = useRef(false);
  const isComposingRef = useRef(false);
  const rebalancingRef = useRef(false);

  useEffect(() => {
    if (!usePagedLayout) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    syncingFromProps.current = true;
    for (let i = 0; i < segments.length; i++) {
      const el = segmentRefs.current[i];
      if (!el) continue;
      const nextHtml = linkifyImageUrlsInHtml(segments[i]?.html ?? "");
      if (el.innerHTML !== nextHtml) {
        el.innerHTML = nextHtml;
      }
    }
    requestAnimationFrame(() => {
      syncingFromProps.current = false;
    });
  }, [segments, usePagedLayout]);

  const emitCombinedChange = useCallback(() => {
    if (!usePagedLayout || syncingFromProps.current) return;
    const parts = segments.map((seg, i) => ({
      ...seg,
      html: segmentRefs.current[i]?.innerHTML ?? seg.html,
    }));
    const combined = joinPageSegmentHtml(parts);
    isInternalChange.current = true;
    onChange(combined);
  }, [onChange, segments, usePagedLayout]);

  /**
   * Live forward rebalance: while typing, if the current zone overflows the
   * page's column area, peel off the trailing paragraph blocks and push them
   * into the next zone. If the caret was in the overflowed region, follow it
   * into the next zone so the user keeps typing without doing anything.
   * Cascades for as long as zones still overflow.
   */
  const rebalanceForward = useCallback(
    (startIdx: number) => {
      if (rebalancingRef.current) return;
      if (isComposingRef.current) return;
      const dims = currentPreviewBodyDimensions();
      if (!dims) return;
      rebalancingRef.current = true;
      try {
        let movedAnything = false;
        for (let i = startIdx; i < segmentRefs.current.length - 1; i++) {
          const el = segmentRefs.current[i];
          const nextEl = segmentRefs.current[i + 1];
          if (!el || !nextEl) break;
          const html = el.innerHTML;
          if (!html.trim()) break;
          if (!htmlOverflowsColumnArea(html, dims)) break;

          const blocks = splitHtmlIntoParagraphBlocks(html);
          if (blocks.length === 0) break;
          const { kept, overflow } = splitBlocksByMeasurement(blocks, dims);
          if (overflow.length === 0) break;

          const keptHtml = joinParagraphBlocks(kept);
          const overflowHtml = joinParagraphBlocks(overflow);

          const sel = window.getSelection();
          const caretWasInThis =
            !!sel &&
            sel.rangeCount > 0 &&
            el.contains(sel.getRangeAt(0).endContainer);
          const caretOffsetBefore = caretWasInThis ? getCaretTextOffsetWithin(el) : -1;

          el.innerHTML = keptHtml;
          const keptTextLen = el.textContent?.length ?? 0;
          const prevNextHtml = nextEl.innerHTML;
          nextEl.innerHTML = overflowHtml + prevNextHtml;
          movedAnything = true;

          if (caretWasInThis && caretOffsetBefore > keptTextLen) {
            const newOffset = caretOffsetBefore - keptTextLen;
            activeEditorRef.current = nextEl;
            nextEl.focus();
            setCaretTextOffsetWithin(nextEl, newOffset);
          }
        }
        if (movedAnything) emitCombinedChange();
      } finally {
        rebalancingRef.current = false;
      }
    },
    [emitCombinedChange]
  );

  /**
   * Backward pull: when typing/deleting shrinks the current zone, try to
   * promote the head of the next zone into this one as long as the merged
   * content still fits the column area. This is the Word-like behaviour where
   * deleting at the end of page N reflows text back from page N+1.
   */
  const rebalanceBackward = useCallback(
    (startIdx: number) => {
      if (rebalancingRef.current) return;
      if (isComposingRef.current) return;
      const dims = currentPreviewBodyDimensions();
      if (!dims) return;
      rebalancingRef.current = true;
      try {
        let movedAnything = false;
        for (let i = Math.max(0, startIdx - 1); i < segmentRefs.current.length - 1; i++) {
          const el = segmentRefs.current[i];
          const nextEl = segmentRefs.current[i + 1];
          if (!el || !nextEl) break;
          const nextHtml = nextEl.innerHTML;
          if (!nextHtml.trim()) continue;
          if (htmlOverflowsColumnArea(el.innerHTML, dims)) continue;

          const sel = window.getSelection();
          const caretInNext =
            !!sel &&
            sel.rangeCount > 0 &&
            nextEl.contains(sel.getRangeAt(0).endContainer);
          const caretOffsetBefore = caretInNext ? getCaretTextOffsetWithin(nextEl) : -1;
          const elTextLenBefore = el.textContent?.length ?? 0;

          const combinedHtml = el.innerHTML + nextHtml;
          const blocks = splitHtmlIntoParagraphBlocks(combinedHtml);
          if (blocks.length === 0) break;
          const { kept, overflow } = splitBlocksByMeasurement(blocks, dims);
          const newThisHtml = joinParagraphBlocks(kept);
          const newNextHtml = joinParagraphBlocks(overflow);

          if (newThisHtml === el.innerHTML) continue;

          el.innerHTML = newThisHtml;
          nextEl.innerHTML = newNextHtml;
          movedAnything = true;

          if (caretInNext) {
            const newElTextLen = el.textContent?.length ?? 0;
            const pulledLen = Math.max(0, newElTextLen - elTextLenBefore);
            if (caretOffsetBefore <= pulledLen) {
              const newCaretOffset = elTextLenBefore + caretOffsetBefore;
              activeEditorRef.current = el;
              el.focus();
              setCaretTextOffsetWithin(el, newCaretOffset);
            } else {
              const newOffset = caretOffsetBefore - pulledLen;
              setCaretTextOffsetWithin(nextEl, newOffset);
            }
          }
        }
        if (movedAnything) emitCombinedChange();
      } finally {
        rebalancingRef.current = false;
      }
    },
    [emitCombinedChange]
  );

  const handleSegmentInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      emitCombinedChange();
      if (isComposingRef.current) return;
      const idx = Number(
        (e.currentTarget as HTMLDivElement).dataset.segmentIndex ?? "-1"
      );
      if (idx < 0) return;
      rebalanceForward(idx);
      rebalanceBackward(idx);
    },
    [emitCombinedChange, rebalanceBackward, rebalanceForward]
  );

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);
  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLDivElement>) => {
      isComposingRef.current = false;
      emitCombinedChange();
      const idx = Number(
        (e.currentTarget as HTMLDivElement).dataset.segmentIndex ?? "-1"
      );
      if (idx >= 0) {
        rebalanceForward(idx);
        rebalanceBackward(idx);
      }
    },
    [emitCombinedChange, rebalanceBackward, rebalanceForward]
  );

  const handleSegmentPaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const plain = e.clipboardData.getData("text/plain");
      document.execCommand("insertHTML", false, plainTextToEditorHtml(plain));
      emitCombinedChange();
    },
    [emitCombinedChange]
  );

  const bindSegmentRef = useCallback((index: number) => {
    return (el: HTMLDivElement | null) => {
      segmentRefs.current[index] = el;
    };
  }, []);

  const focusSegment = useCallback((index: number) => {
    const el = segmentRefs.current[index];
    if (el) activeEditorRef.current = el;
  }, []);

  if (!usePagedLayout) {
    return (
      <RichTextEditor
        value={value}
        onChange={onChange}
        expandWithContent
        placeholder={placeholder}
        minHeight={minHeight}
        className={className}
        plainTextOnlyPaste
        transformPasteHtml={plainTextToEditorHtml}
      />
    );
  }

  return (
    <div className={`flex flex-col rounded-xl border border-gray-300 ${className}`}>
      <RichTextToolbar editorRef={activeEditorRef} onCommand={emitCombinedChange} />

      <p className="border-x border-gray-300 bg-gray-50 px-3 py-2 text-[11px] leading-snug text-gray-600">
        Colored blocks follow the same column flow as the page preview. Text in each block will be
        saved on that article page when you finish editing.
      </p>

      <div className="flex flex-col gap-0 rounded-b-xl border border-t-0 border-gray-300">
        {segments.map((segment, index) => {
          const theme = PAGE_ZONE_THEMES[index % PAGE_ZONE_THEMES.length]!;
          const isLast = index === segments.length - 1;
          const chunkCount = chunkCountBySlot.get(segment.slotContentId) ?? 0;
          const segmentHtmlIsEmpty = !segment.html.trim();
          // Show the delete button only when the page has NO content at all —
          // no title/subtitle/body/image chunks, AND no buffered text in the
          // editor zone yet (the segment HTML may briefly hold text the user is
          // typing before it's persisted as a chunk).
          const isTrulyEmpty = chunkCount === 0 && segmentHtmlIsEmpty;
          const showDeleteButton = canShowDeleteButton && isTrulyEmpty;
          return (
            <section
              key={segment.slotContentId}
              className={`border ${theme.zone} ${index > 0 ? "border-t-2" : ""}`}
            >
              <header
                className={`flex items-center gap-2 border-b px-3 py-1.5 ${theme.header}`}
              >
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${theme.badge}`}
                >
                  Article page {segment.pageIndex}
                </span>
                <span className="text-[10px] font-medium opacity-80">
                  {segmentHtmlIsEmpty ? "empty — add text here" : "body text on this page"}
                </span>
                {showDeleteButton ? (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      onRequestDeleteEmptyPage?.(segment.slotContentId, segment.pageIndex)
                    }
                    className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 bg-white/70 px-2 py-1 text-[10px] font-semibold text-red-700 shadow-sm transition hover:bg-red-50 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-300"
                    aria-label={`Delete empty article page ${segment.pageIndex}`}
                    title={`Delete empty article page ${segment.pageIndex}`}
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 2.5a.75.75 0 00-.75.75V4H4.5a.75.75 0 000 1.5h.379l.83 10.376A2.25 2.25 0 007.953 18h4.094a2.25 2.25 0 002.244-2.124l.83-10.376h.379a.75.75 0 000-1.5H12V3.25a.75.75 0 00-.75-.75h-2.5zM10.5 5.5h-1v-1.5h1V5.5zm-3.367 1.5l.78 9.751a.75.75 0 00.748.694h4.078a.75.75 0 00.748-.694l.78-9.751H7.133zm1.992 2a.75.75 0 011.5 0v5a.75.75 0 01-1.5 0v-5zm3 0a.75.75 0 011.5 0v5a.75.75 0 01-1.5 0v-5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Delete page</span>
                  </button>
                ) : null}
              </header>
              <div
                ref={bindSegmentRef(index)}
                contentEditable
                suppressContentEditableWarning
                data-placeholder={
                  index === 0 ? placeholder : `Continuation on page ${segment.pageIndex}…`
                }
                data-segment-index={index}
                className="article-builder-paged-body-zone rich-text-editor-body min-w-0 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400/40"
                style={{ minHeight: isLast ? minHeight : "100px" }}
                onFocus={() => focusSegment(index)}
                onInput={handleSegmentInput}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onPaste={(e) => {
                  handleSegmentPaste(e);
                  rebalanceForward(index);
                }}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
};
