import React, { FC } from "react";
import { normalizeChunkFormat } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazineArticleColumnFlow";
import { CHUNK_FORMATS, ChunkFormat } from "./types";

type ArticleSubpageChunkToolbarProps = {
  index: number;
  chunkFormat: ChunkFormat;
  isMandatoryChunk: boolean;
  isHeadingChunk?: boolean;
  headingExpanded?: boolean;
  onToggleHeadingExpanded?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onFormatChange: (format: ChunkFormat) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

const EDITABLE_SUBPAGE_CHUNK_FORMATS: ChunkFormat[] = ["only_text"];

function ChunkVisibilityToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-md border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      aria-expanded={expanded}
      aria-label={expanded ? "Hide editor" : "Show editor"}
      title={expanded ? "Hide" : "Show"}
    >
      {expanded ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
          <path
            fillRule="evenodd"
            d="M0.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path
            fillRule="evenodd"
            d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.027 10.027 0 003.3-4.38 1.87 1.87 0 00-2.6-2.25L3.28 2.22zM12.873 11.96l-1.62-1.62a3 3 0 00-3.653-3.653l-1.62-1.62A8.987 8.987 0 0110 5c3.478 0 6.668 2.057 8.542 5-.64 1.02-1.477 1.91-2.45 2.61l-1.22-1.22a4 4 0 00-5.9-5.9L7.04 6.127A8.97 8.97 0 0010 15c3.478 0 6.668-2.057 8.542-5a9.956 9.956 0 00-4.327-4.327l-1.342 1.342z"
            clipRule="evenodd"
          />
          <path d="M10 12.5a2.5 2.5 0 01-2.45-2.05l2.45 2.45a2.5 2.5 0 002.45-2.45l-2.45 2.45A2.5 2.5 0 0110 12.5z" />
        </svg>
      )}
    </button>
  );
}

export const ArticleSubpageChunkToolbar: FC<ArticleSubpageChunkToolbarProps> = ({
  index,
  chunkFormat,
  isMandatoryChunk,
  isHeadingChunk = false,
  headingExpanded = true,
  onToggleHeadingExpanded,
  canMoveUp,
  canMoveDown,
  onFormatChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}) => {
  const fmt = normalizeChunkFormat(chunkFormat);
  const normalizedFormat: ChunkFormat =
    fmt === "title" || fmt === "subtitle" || fmt === "only_text" ? fmt : "only_text";

  const formatOptions = isMandatoryChunk
    ? CHUNK_FORMATS.filter((f) => f === normalizedFormat)
    : EDITABLE_SUBPAGE_CHUNK_FORMATS;

  const legacyFormatLabel =
    !isMandatoryChunk && fmt && fmt !== "only_text"
      ? chunkFormat.trim() || fmt
      : null;

  if (isHeadingChunk) {
    return (
      <div className="flex flex-row flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono text-gray-500">#{index + 1}</span>
        <select
          value={normalizedFormat}
          disabled={isMandatoryChunk}
          onChange={(e) => onFormatChange(e.target.value as ChunkFormat)}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
        >
          {formatOptions.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
        </select>
        {onToggleHeadingExpanded ? (
          <ChunkVisibilityToggle
            expanded={headingExpanded}
            onToggle={onToggleHeadingExpanded}
          />
        ) : null}
        <span
          className="shrink-0 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] text-gray-500"
          title="Title and subtitle always belong to this page"
        >
          Locked page
        </span>
        {!headingExpanded ? (
          <span className="text-[11px] italic text-gray-500">
            Collapsed — click the eye icon to edit.
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-gray-500">#{index + 1}</span>
        <select
          value={normalizedFormat}
          disabled={isMandatoryChunk}
          onChange={(e) => onFormatChange(e.target.value as ChunkFormat)}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
        >
          {formatOptions.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
        </select>
        {legacyFormatLabel ? (
          <span
            className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-900"
            title="Stored format from the full article editor; preview still renders this chunk."
          >
            stored: {legacyFormatLabel}
          </span>
        ) : null}
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
