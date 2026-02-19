"use client";

import React, { FC, useRef, useEffect, useCallback } from "react";
import RichTextToolbar from "./RichTextToolbar";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const RichTextEditor: FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Escriba aquí...",
  className = "",
  minHeight = "100px",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";
    isInternalChange.current = true;
    onChange(html);
  }, [onChange]);

  const handleInput = () => {
    emitChange();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain");
    document.execCommand("insertHTML", false, text);
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
        className="rich-text-editor-body min-w-0 flex-1 overflow-y-auto rounded-b-xl border border-gray-300 border-t-0 px-4 py-2 text-gray-800 focus:outline-none"
        style={{ minHeight }}
        onInput={handleInput}
        onPaste={handlePaste}
      />
    </div>
  );
};

export default RichTextEditor;
