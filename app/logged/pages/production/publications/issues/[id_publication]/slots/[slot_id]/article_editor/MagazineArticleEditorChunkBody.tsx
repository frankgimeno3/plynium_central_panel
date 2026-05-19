"use client";

import React, { FC, useMemo } from "react";
import {
  RichTextContent,
  RichTextEditor,
} from "@/app/logged/logged_components/RichTextEditor";
import {
  buildChunkHtmlForFormat,
  parseMagazineChunkHtml,
} from "./magazineChunkMediaHtml";

export type MagazineChunkFormat =
  | "title"
  | "subtitle"
  | "only_text"
  | "only_image"
  | "text_image"
  | "image_text";

type MagazineArticleEditorChunkBodyProps = {
  format: MagazineChunkFormat;
  chunkHtml: string;
  onHtmlChange: (nextHtml: string) => void;
  onOpenMediateca: () => void;
};

function imageColumn(
  imageSrc: string | null,
  onOpenMediateca: () => void,
  label = "Image"
) {
  return (
    <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-36">
      <span className="text-[10px] uppercase tracking-wide text-gray-500">{label}</span>
      <button
        type="button"
        onClick={onOpenMediateca}
        className="relative flex aspect-square w-full max-w-[11rem] sm:max-w-none items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center text-[11px] text-gray-500 transition hover:border-blue-300 hover:bg-gray-100"
      >
        {imageSrc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- mediateca / S3 URLs */}
            <img src={imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="sr-only">Change image from media library</span>
            <span className="absolute bottom-0 left-0 right-0 bg-black/45 py-0.5 text-[10px] font-medium text-white">
              Change
            </span>
          </>
        ) : (
          <span className="px-2">Choose from media library</span>
        )}
      </button>
    </div>
  );
}

export const MagazineChunkEditorPreview: FC<{
  format: MagazineChunkFormat;
  chunkHtml: string;
}> = ({ format, chunkHtml }) => {
  if (format !== "text_image" && format !== "image_text" && format !== "only_image") {
    return <RichTextContent htmlOrPlain={chunkHtml} className="prose prose-sm max-w-none" />;
  }
  const parsed = parseMagazineChunkHtml(chunkHtml, format);
  if (format === "only_image") {
    if (!parsed.imageSrc) {
      return <p className="text-sm text-gray-400">No image selected.</p>;
    }
    return (
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={parsed.imageSrc}
          alt={parsed.imageAlt || ""}
          className="max-h-56 rounded-lg border border-gray-200 object-contain"
        />
        
      </div>
    );
  }
  const textHtml = parsed.textHtml;
  const rowClass =
    format === "image_text"
      ? "flex flex-col gap-4 sm:flex-row-reverse sm:items-start"
      : "flex flex-col gap-4 sm:flex-row sm:items-start";
  return (
    <div className={rowClass}>
      <div className="min-w-0 flex-1 prose prose-sm max-w-none">
        <RichTextContent htmlOrPlain={textHtml} className="" />
      </div>
      <div className="w-32 shrink-0">
        {parsed.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={parsed.imageSrc}
            alt={parsed.imageAlt || ""}
            className="w-full rounded-md border border-gray-200 object-cover"
          />
        ) : (
          <p className="text-xs text-gray-400">No image</p>
        )}
      </div>
    </div>
  );
};

export const MagazineArticleEditorChunkBody: FC<MagazineArticleEditorChunkBodyProps> = ({
  format,
  chunkHtml,
  onHtmlChange,
  onOpenMediateca,
}) => {
  const parsed = useMemo(() => parseMagazineChunkHtml(chunkHtml, format), [chunkHtml, format]);

  if (format === "only_image") {
    return (
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wide text-gray-500">Image (media library)</p>
        {imageColumn(parsed.imageSrc, onOpenMediateca)}
      </div>
    );
  }

  if (format === "text_image" || format === "image_text") {
    const textHtml = parsed.textHtml;
    const imageSrc = parsed.imageSrc;
    const imageAlt = parsed.imageAlt;
    const rowClass =
      format === "image_text"
        ? "flex flex-col gap-4 sm:flex-row-reverse sm:items-start"
        : "flex flex-col gap-4 sm:flex-row sm:items-start";

    return (
      <div className={rowClass}>
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-500">
            Text
          </label>
          <RichTextEditor
            value={textHtml}
            onChange={(next) => {
              onHtmlChange(buildChunkHtmlForFormat(format, next, imageSrc, imageAlt));
            }}
            minHeight="160px"
            placeholder="Write the text column…"
          />
        </div>
        {imageColumn(imageSrc, onOpenMediateca)}
      </div>
    );
  }

  return (
    <>
      <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-500">Content</label>
      <RichTextEditor
        value={chunkHtml}
        onChange={onHtmlChange}
        minHeight="160px"
        placeholder="Write the chunk content…"
      />
    </>
  );
};
