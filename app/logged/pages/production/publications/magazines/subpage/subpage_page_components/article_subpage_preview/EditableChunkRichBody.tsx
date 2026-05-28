"use client";

import React, {
  FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import {
  readChunkEditableHtml,
  writeChunkEditableHtml,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/articleChunkPlainTextEditing";
import { useArticleBuilderRichTextToolbar } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_builder_page/components/ArticleBuilderFloatingRichTextToolbar";
import { consumeChunkEditorDomSync } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/chunkEditorDomSync";
import { chunkEditorDomMatches } from "./chunkEditorDom";

export type EditableChunkRichBodyProps = {
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
};

/** Rich-text body field (`contentEditable`) for the magazine preview. */
export const EditableChunkRichBody: FC<EditableChunkRichBodyProps> = ({
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
  const syncingFromProps = useRef(false);
  const lastEmittedHtmlRef = useRef("");
  const { registerActiveChunkEditor, clearActiveChunkEditor, activeChunkId } =
    useArticleBuilderRichTextToolbar();

  chunkHtmlRef.current = chunkHtml;

  const isEditingThisChunk = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return false;
      const active = document.activeElement;
      if (active === el || (active != null && el.contains(active))) return true;
      if (activeChunkId !== chunkId) return false;
      const toolbar = document.querySelector("[data-pmc-floating-rich-toolbar]");
      return Boolean(active && toolbar?.contains(active));
    },
    [activeChunkId, chunkId]
  );

  const applyIncomingHtmlToDom = useCallback(() => {
    const el = editorRef.current;
    if (!el || syncingFromProps.current) return;
    const incoming = readChunkEditableHtml(chunkHtml, format);
    const forceSync = consumeChunkEditorDomSync(chunkId);
    if (!forceSync && isEditingThisChunk(el)) return;
    if (!forceSync && chunkEditorDomMatches(el, incoming)) return;
    syncingFromProps.current = true;
    el.innerHTML = incoming || "";
    lastEmittedHtmlRef.current = incoming;
    requestAnimationFrame(() => {
      syncingFromProps.current = false;
    });
  }, [chunkHtml, chunkId, format, isEditingThisChunk]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el || syncingFromProps.current) return;
    const nextInner = el.innerHTML;
    const fullHtml = writeChunkEditableHtml(chunkHtmlRef.current, format, nextInner);
    lastEmittedHtmlRef.current = readChunkEditableHtml(fullHtml, format);
    onChunkHtmlChange(chunkId, fullHtml);
  }, [chunkId, format, onChunkHtmlChange]);

  useLayoutEffect(() => {
    applyIncomingHtmlToDom();
  }, [applyIncomingHtmlToDom]);

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
  }, [chunkId, emitChange, isLeftPage, registerActiveChunkEditor, chunkHtml]);

  const commitEditorHtml = useCallback(() => {
    const el = editorRef.current;
    if (!el || syncingFromProps.current) return;
    const nextInner = el.innerHTML;
    const fullHtml = writeChunkEditableHtml(chunkHtmlRef.current, format, nextInner);
    lastEmittedHtmlRef.current = readChunkEditableHtml(fullHtml, format);
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
