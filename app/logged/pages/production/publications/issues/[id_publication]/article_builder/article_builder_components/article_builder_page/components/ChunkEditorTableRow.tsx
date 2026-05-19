"use client";

import React, { FC } from "react";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import { effectiveChunkPageWeight, isTitleOrSubtitleChunkFormat } from "../chunkUtils";
import type { ChunkPageOption, PublicationArticleChunk } from "../types";

type ChunkEditorTableRowProps = {
  chunk: PublicationArticleChunk;
  rowBusy: boolean;
  pageOptions: ChunkPageOption[];
  onAssign: (chunkId: string, slotId: number | null) => void;
  onRequestDelete: (chunk: PublicationArticleChunk) => void;
  onWeightCommit: (chunkId: string, weight: number) => void;
  previewOverflow: boolean;
  canMoveRestForward: boolean;
  onMoveRestForward?: () => void;
};

export const ChunkEditorTableRow: FC<ChunkEditorTableRowProps> = ({
  chunk,
  rowBusy,
  pageOptions,
  onAssign,
  onRequestDelete,
  onWeightCommit,
  previewOverflow,
  canMoveRestForward,
  onMoveRestForward,
}) => {
  const locked = isTitleOrSubtitleChunkFormat(chunk.publication_article_chunk_format);
  const w = effectiveChunkPageWeight(chunk);
  const previewClass = previewOverflow
    ? "max-w-md text-xs leading-snug line-clamp-3 prose prose-sm prose-invert text-red-300 [&_*]:!text-red-300 [&_a]:text-red-200 [&_em]:text-red-200"
    : "max-w-md text-xs leading-snug text-white line-clamp-3 prose prose-sm prose-invert [&_*]:!text-white [&_a]:text-sky-300 [&_em]:text-slate-300";

  return (
    <tr className="bg-slate-950">
      <td className="px-3 py-2 font-mono text-[11px] text-white">{chunk.chunk_position}</td>
      <td className="px-3 py-2 text-xs text-white">
        <span className="inline-flex items-center rounded-full border border-slate-500 bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-white">
          {chunk.publication_article_chunk_format}
        </span>
      </td>
      <td className="px-3 py-2 text-white">
        <input
          type="number"
          min={1}
          max={100}
          disabled={rowBusy}
          className="w-14 rounded border border-slate-500 bg-slate-900 px-1 py-1 text-center text-[11px] text-white disabled:opacity-50"
          defaultValue={w}
          key={`${chunk.publication_article_chunk_id}-w-${chunk.chunk_page_weight ?? w}`}
          onBlur={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v)) return;
            const clamped = Math.min(100, Math.max(1, Math.round(v)));
            if (clamped !== w) onWeightCommit(chunk.publication_article_chunk_id, clamped);
          }}
        />
      </td>
      <td className="px-3 py-2 text-white">
        <div
          className={previewClass}
          dangerouslySetInnerHTML={{
            __html: chunk.chunk_html || "<em>(empty)</em>",
          }}
        />
      </td>
      <td className="px-3 py-2 text-white">
        {locked ? (
          <span className="text-xs text-slate-400">Page 1 (fixed)</span>
        ) : (
          <select
            value={chunkPublicationSlotId(chunk) ?? ""}
            onChange={(e) =>
              onAssign(chunk.publication_article_chunk_id, e.target.value ? Number(e.target.value) : null)
            }
            disabled={rowBusy}
            className="w-full max-w-[16rem] rounded-md border border-slate-500 bg-slate-900 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" className="bg-slate-900 text-white">
              Unassigned
            </option>
            {pageOptions.map((p) => (
              <option
                key={p.publication_slot_id}
                value={p.publication_slot_id}
                className="bg-slate-900 text-white"
              >
                Page {p.index}
                {p.publication_page != null
                  ? ` (publication page ${p.publication_page})`
                  : ` (slot #${p.publication_slot_id})`}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="px-3 py-2 text-right text-white">
        {locked ? (
          <span className="text-xs text-slate-500">—</span>
        ) : (
          <div className="flex flex-col items-end gap-1">
            {canMoveRestForward && onMoveRestForward ? (
              <button
                type="button"
                onClick={() => onMoveRestForward()}
                disabled={rowBusy}
                title="Move this chunk and all following chunks on this page to the next page"
                className="whitespace-nowrap rounded-md border border-amber-500/50 bg-amber-950/40 px-2 py-1 text-[10px] font-medium text-amber-100 hover:bg-amber-950/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Rest → next
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onRequestDelete(chunk)}
              disabled={rowBusy}
              className="rounded-md border border-red-500/60 bg-red-950/40 px-2 py-1 text-[11px] font-medium text-red-200 hover:bg-red-950/70 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};
