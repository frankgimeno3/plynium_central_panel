"use client";

import React, { FC, useRef, useEffect, useCallback } from "react";
import RichTextToolbar from "./RichTextToolbar";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  /** Grow with content instead of scrolling inside a fixed-height box. */
  expandWithContent?: boolean;
  /**
   * When true, pasting only ever inserts plain text (clipboard formatting is
   * dropped). Useful for editors whose output is reflowed into magazine
   * columns where source formatting would clash with the publication's style.
   */
  plainTextOnlyPaste?: boolean;
  /**
   * Optional transform applied to the pasted payload before it is inserted.
   * If `plainTextOnlyPaste` is true, the input is the raw text/plain string;
   * otherwise it is the clipboard's text/html (or text/plain fallback).
   */
  transformPasteHtml?: (input: string) => string;
}

function defaultPlainTextToHtml(text: string): string {
  const raw = String(text ?? "");
  if (!raw) return "";
  const normalized = raw.replace(/\r\n?/g, "\n");
  return normalized
    .split(/\n{2,}/)
    .map((p) => {
      const escaped = p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<p>${escaped.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}

const RichTextEditor: FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Type here...",
  className = "",
  minHeight = "100px",
  expandWithContent = false,
  plainTextOnlyPaste = false,
  transformPasteHtml,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const syncingFromProps = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (el.innerHTML !== value) {
      syncingFromProps.current = true;
      el.innerHTML = value || "";
      requestAnimationFrame(() => {
        syncingFromProps.current = false;
      });
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";
    if (syncingFromProps.current) return;
    isInternalChange.current = true;
    onChange(html);
  }, [onChange]);

  const handleInput = useCallback(() => {
    emitChange();
  }, [emitChange]);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    let insertHtml: string;
    if (plainTextOnlyPaste) {
      const plain = e.clipboardData.getData("text/plain");
      insertHtml = transformPasteHtml
        ? transformPasteHtml(plain)
        : defaultPlainTextToHtml(plain);
    } else {
      const payload =
        e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain");
      insertHtml = transformPasteHtml ? transformPasteHtml(payload) : payload;
    }
    document.execCommand("insertHTML", false, insertHtml);
    emitChange();
  };

  return (
    <div className={`flex flex-col rounded-xl border border-gray-300 ${className}`}>
      <RichTextToolbar editorRef={editorRef} onCommand={emitChange} />
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className={
          expandWithContent
            ? "rich-text-editor-body min-w-0 rounded-b-xl border border-gray-300 border-t-0 px-4 py-2 text-gray-800 focus:outline-none"
            : "rich-text-editor-body min-w-0 flex-1 overflow-y-auto rounded-b-xl border border-gray-300 border-t-0 px-4 py-2 text-gray-800 focus:outline-none"
        }
        style={{ minHeight }}
        onInput={handleInput}
        onPaste={handlePaste}
      />
    </div>
  );
};

export default RichTextEditor;
