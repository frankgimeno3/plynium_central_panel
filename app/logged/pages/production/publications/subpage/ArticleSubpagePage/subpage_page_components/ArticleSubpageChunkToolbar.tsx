import React, { FC } from "react";
import { CHUNK_FORMATS, ChunkFormat, SubpagePageOption } from "./types";

type ArticleSubpageChunkToolbarProps = {
  index: number;
  chunkFormat: ChunkFormat;
  slotContentId: number | null;
  parsedSlotContentId: number;
  slotId: number;
  allPages: SubpagePageOption[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  onFormatChange: (format: ChunkFormat) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSlotContentChange: (slotContentId: number | null) => void;
  onDelete: () => void;
};

export const ArticleSubpageChunkToolbar: FC<ArticleSubpageChunkToolbarProps> = ({
  index,
  chunkFormat,
  slotContentId,
  parsedSlotContentId,
  slotId,
  allPages,
  canMoveUp,
  canMoveDown,
  onFormatChange,
  onMoveUp,
  onMoveDown,
  onSlotContentChange,
  onDelete,
}) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-gray-500">#{index + 1}</span>
        <select
          value={chunkFormat}
          onChange={(e) => onFormatChange(e.target.value as ChunkFormat)}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CHUNK_FORMATS.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-30"
          aria-label="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-30"
          aria-label="Move down"
        >
          ↓
        </button>
        <select
          value={slotContentId ?? ""}
          onChange={(e) =>
            onSlotContentChange(e.target.value ? Number(e.target.value) : null)
          }
          className="rounded-md border border-gray-300 px-2 py-1 text-xs"
          title="Move to another page"
        >
          <option value={parsedSlotContentId}>Stay on this page</option>
          {allPages
            .filter((page) => page.publication_slot_id !== slotId)
            .map((page) => (
              <option key={page.publication_slot_id} value={`${page.publication_slot_id}`}>
                Move to page {page.index}
              </option>
            ))}
        </select>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
