"use client";

import React, { FC } from "react";
import { RichTextEditor } from "@/app/logged/logged_components/RichTextEditor";
import type { ChunkFormat } from "./types";

type ArticleSubpageChunkHtmlEditorProps = {
  chunkFormat: ChunkFormat;
  chunkHtml: string;
  onHtmlChange: (html: string) => void;
};

/** Text-only chunk editor (title, subtitle, only_text). */
export const ArticleSubpageChunkHtmlEditor: FC<ArticleSubpageChunkHtmlEditorProps> = ({
  chunkFormat,
  chunkHtml,
  onHtmlChange,
}) => {
  return (
    <div className="mt-2 min-w-0">
      <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-500">
        {chunkFormat === "title" ? "Title" : chunkFormat === "subtitle" ? "Subtitle" : "Text"}
      </label>
      <RichTextEditor
        value={chunkHtml}
        onChange={onHtmlChange}
        expandWithContent
        plainTextOnlyPaste
        minHeight={chunkFormat === "only_text" ? "180px" : "120px"}
        placeholder={
          chunkFormat === "title"
            ? "Page title…"
            : chunkFormat === "subtitle"
              ? "Subtitle…"
              : "Write body text…"
        }
        className="min-w-0"
      />
    </div>
  );
};
