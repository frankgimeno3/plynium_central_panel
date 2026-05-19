import React, { FC, useState } from "react";
import {
  isOverlayImageChunk,
  overlayImageSrc,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_image_manager/articleImagePlacement";
import { ArticleSubpageChunkHtmlEditor } from "./ArticleSubpageChunkHtmlEditor";
import { ArticleSubpageChunkToolbar } from "./ArticleSubpageChunkToolbar";
import { isHeadingChunkFormat } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazineArticleColumnFlow";
import { ChunkFormat, PublicationArticleChunk } from "./types";

type ArticleSubpageChunkRowProps = {
  chunk: PublicationArticleChunk;
  index: number;
  totalChunks: number;
  savingChunkId: string | null;
  onFormatChange: (chunkId: string, format: ChunkFormat) => void;
  onMoveUp: (chunkId: string) => void;
  onMoveDown: (chunkId: string) => void;
  onDelete: (chunkId: string) => void;
  onHtmlChange: (chunkId: string, html: string) => void;
};

export const ArticleSubpageChunkRow: FC<ArticleSubpageChunkRowProps> = ({
  chunk,
  index,
  totalChunks,
  savingChunkId,
  onFormatChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  onHtmlChange,
}) => {
  const chunkId = chunk.publication_article_chunk_id;
  const isOverlayImage = isOverlayImageChunk(
    chunk.chunk_html,
    chunk.publication_article_chunk_format
  );
  const overlaySrc = isOverlayImage ? overlayImageSrc(chunk.chunk_html) : null;
  const isMandatoryChunk = isHeadingChunkFormat(chunk.publication_article_chunk_format);
  const isHeadingChunk = isMandatoryChunk;
  const [headingExpanded, setHeadingExpanded] = useState(true);

  if (isOverlayImage) {
    return (
      <li className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-500">#{index + 1}</span>
            <span className="rounded-md border border-emerald-300 bg-white px-2 py-1 text-xs font-medium text-emerald-900">
              only_image (overlay)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onMoveUp(chunkId)}
              disabled={index === 0}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-30"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onMoveDown(chunkId)}
              disabled={index >= totalChunks - 1}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-30"
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onDelete(chunkId)}
              className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-gray-600">
          Placed with Article Image manager. Edit position via the manager, not here.
        </p>
        {overlaySrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={overlaySrc}
            alt=""
            className="mt-2 h-20 w-auto max-w-full rounded border border-emerald-200 object-contain"
          />
        ) : null}
        {savingChunkId === chunkId ? (
          <p className="mt-1 text-[10px] text-blue-500">Saving…</p>
        ) : null}
      </li>
    );
  }

  return (
    <li
      className={`rounded-xl border bg-white p-3 ${
        isHeadingChunk ? "border-gray-300" : "border-gray-200"
      }`}
    >
      <ArticleSubpageChunkToolbar
        index={index}
        chunkFormat={chunk.publication_article_chunk_format}
        isMandatoryChunk={isMandatoryChunk}
        isHeadingChunk={isHeadingChunk}
        headingExpanded={headingExpanded}
        onToggleHeadingExpanded={
          isHeadingChunk ? () => setHeadingExpanded((v) => !v) : undefined
        }
        canMoveUp={index > 0}
        canMoveDown={index < totalChunks - 1}
        onFormatChange={(format) => onFormatChange(chunkId, format)}
        onMoveUp={() => onMoveUp(chunkId)}
        onMoveDown={() => onMoveDown(chunkId)}
        onDelete={() => onDelete(chunkId)}
      />
      {!isHeadingChunk || headingExpanded ? (
        <ArticleSubpageChunkHtmlEditor
          chunkFormat={chunk.publication_article_chunk_format}
          chunkHtml={chunk.chunk_html}
          onHtmlChange={(html) => onHtmlChange(chunkId, html)}
        />
      ) : null}
      {savingChunkId === chunkId ? (
        <p className="mt-1 text-[10px] text-blue-500">Saving…</p>
      ) : null}
    </li>
  );
};
