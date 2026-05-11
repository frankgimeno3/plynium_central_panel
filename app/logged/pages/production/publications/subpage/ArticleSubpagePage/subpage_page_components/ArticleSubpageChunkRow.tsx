import React, { FC } from "react";
import { ArticleSubpageChunkHtmlEditor } from "./ArticleSubpageChunkHtmlEditor";
import { ArticleSubpageChunkToolbar } from "./ArticleSubpageChunkToolbar";
import { ChunkFormat, PublicationArticleChunk, SubpagePageOption } from "./types";

type ArticleSubpageChunkRowProps = {
  chunk: PublicationArticleChunk;
  index: number;
  totalChunks: number;
  parsedSlotContentId: number;
  slotId: number;
  allPages: SubpagePageOption[];
  savingChunkId: string | null;
  onFormatChange: (chunkId: string, format: ChunkFormat) => void;
  onMoveUp: (chunkId: string) => void;
  onMoveDown: (chunkId: string) => void;
  onSlotContentChange: (chunkId: string, slotContentId: number | null) => void;
  onDelete: (chunkId: string) => void;
  onHtmlChange: (chunkId: string, html: string) => void;
  onHtmlBlur: (chunkId: string, html: string) => void;
};

export const ArticleSubpageChunkRow: FC<ArticleSubpageChunkRowProps> = ({
  chunk,
  index,
  totalChunks,
  parsedSlotContentId,
  slotId,
  allPages,
  savingChunkId,
  onFormatChange,
  onMoveUp,
  onMoveDown,
  onSlotContentChange,
  onDelete,
  onHtmlChange,
  onHtmlBlur,
}) => {
  const chunkId = chunk.publication_article_chunk_id;

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-3">
      <ArticleSubpageChunkToolbar
        index={index}
        chunkFormat={chunk.publication_article_chunk_format}
        slotContentId={chunk.publication_slot_content_id}
        parsedSlotContentId={parsedSlotContentId}
        slotId={slotId}
        allPages={allPages}
        canMoveUp={index > 0}
        canMoveDown={index < totalChunks - 1}
        onFormatChange={(format) => onFormatChange(chunkId, format)}
        onMoveUp={() => onMoveUp(chunkId)}
        onMoveDown={() => onMoveDown(chunkId)}
        onSlotContentChange={(slotContentId) => onSlotContentChange(chunkId, slotContentId)}
        onDelete={() => onDelete(chunkId)}
      />
      <ArticleSubpageChunkHtmlEditor
        chunkHtml={chunk.chunk_html}
        onChange={(html) => onHtmlChange(chunkId, html)}
        onBlur={(html) => onHtmlBlur(chunkId, html)}
      />
      {savingChunkId === chunkId ? (
        <p className="mt-1 text-[10px] text-blue-500">Saving…</p>
      ) : null}
    </li>
  );
};
