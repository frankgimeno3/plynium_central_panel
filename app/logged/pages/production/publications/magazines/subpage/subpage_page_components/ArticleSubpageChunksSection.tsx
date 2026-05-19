import React, { FC } from "react";
import { ArticleSubpageChunkRow } from "./ArticleSubpageChunkRow";
import { ChunkFormat, PublicationArticleChunk } from "./types";

type ArticleSubpageChunksSectionProps = {
  slotId: number | null;
  subpageChunks: PublicationArticleChunk[];
  savingChunkId: string | null;
  onAddChunkAt: (position: number) => void;
  onFormatChange: (chunkId: string, format: ChunkFormat) => void;
  onMoveUp: (chunkId: string) => void;
  onMoveDown: (chunkId: string) => void;
  onDelete: (chunkId: string) => void;
  onHtmlChange: (chunkId: string, html: string) => void;
};

const addChunkButtonClass =
  "w-full rounded-lg border border-dashed border-gray-300 bg-gray-50/80 px-3 py-2 text-xs font-medium text-gray-600 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-900";

function AddChunkButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={addChunkButtonClass}>
      + Add chunk
    </button>
  );
}

export const ArticleSubpageChunksSection: FC<ArticleSubpageChunksSectionProps> = ({
  slotId,
  subpageChunks,
  savingChunkId,
  onAddChunkAt,
  onFormatChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  onHtmlChange,
}) => {
  return (
    <section className="space-y-2">
      <header>
        <h2 className="text-sm font-semibold text-gray-800">Chunks on this page</h2>
      </header>

      {!slotId ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          Invalid or missing magazine page slot. Open this page from the Article Builder.
        </div>
      ) : (
        <div className="space-y-2">
          <AddChunkButton onClick={() => onAddChunkAt(0)} />

          {subpageChunks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              No chunks on this page yet. Add one above or below.
            </div>
          ) : (
            <ul className="space-y-3">
              {subpageChunks.map((chunk, index) => (
                <ArticleSubpageChunkRow
                  key={chunk.publication_article_chunk_id}
                  chunk={chunk}
                  index={index}
                  totalChunks={subpageChunks.length}
                  savingChunkId={savingChunkId}
                  onFormatChange={onFormatChange}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onDelete={onDelete}
                  onHtmlChange={onHtmlChange}
                />
              ))}
            </ul>
          )}

          <AddChunkButton onClick={() => onAddChunkAt(subpageChunks.length)} />
        </div>
      )}
    </section>
  );
};
