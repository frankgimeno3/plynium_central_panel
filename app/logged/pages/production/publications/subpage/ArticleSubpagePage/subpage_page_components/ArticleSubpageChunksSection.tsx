import React, { FC } from "react";
import { ArticleSubpageChunkRow } from "./ArticleSubpageChunkRow";
import { ChunkFormat, PublicationArticleChunk, SubpagePageOption } from "./types";

type ArticleSubpageChunksSectionProps = {
  parsedSlotContentId: number | null;
  subpageChunks: PublicationArticleChunk[];
  slotId: number;
  allPages: SubpagePageOption[];
  savingChunkId: string | null;
  onAddChunk: () => void;
  onFormatChange: (chunkId: string, format: ChunkFormat) => void;
  onMoveUp: (chunkId: string) => void;
  onMoveDown: (chunkId: string) => void;
  onSlotContentChange: (chunkId: string, slotContentId: number | null) => void;
  onDelete: (chunkId: string) => void;
  onHtmlChange: (chunkId: string, html: string) => void;
  onHtmlBlur: (chunkId: string, html: string) => void;
};

export const ArticleSubpageChunksSection: FC<ArticleSubpageChunksSectionProps> = ({
  parsedSlotContentId,
  subpageChunks,
  slotId,
  allPages,
  savingChunkId,
  onAddChunk,
  onFormatChange,
  onMoveUp,
  onMoveDown,
  onSlotContentChange,
  onDelete,
  onHtmlChange,
  onHtmlBlur,
}) => {
  return (
    <section className="space-y-2">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Chunks on this page</h2>
        <button
          type="button"
          onClick={onAddChunk}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add chunk
        </button>
      </header>

      {!parsedSlotContentId ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          This page does not yet have a publication_slot_content row. Returning to the Article
          Builder and re-applying the page count should provision it.
        </div>
      ) : subpageChunks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          No chunks assigned to this page yet. Use "Add chunk".
        </div>
      ) : (
        <ul className="space-y-3">
          {subpageChunks.map((chunk, index) => (
            <ArticleSubpageChunkRow
              key={chunk.publication_article_chunk_id}
              chunk={chunk}
              index={index}
              totalChunks={subpageChunks.length}
              parsedSlotContentId={parsedSlotContentId}
              slotId={slotId}
              allPages={allPages}
              savingChunkId={savingChunkId}
              onFormatChange={onFormatChange}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onSlotContentChange={onSlotContentChange}
              onDelete={onDelete}
              onHtmlChange={onHtmlChange}
              onHtmlBlur={onHtmlBlur}
            />
          ))}
        </ul>
      )}
    </section>
  );
};
