"use client";

import React, { FC } from "react";

const imageChunkOverlayButtonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/70 bg-black/60 px-3 py-1.5 text-lg font-semibold uppercase tracking-wide text-white shadow-md backdrop-blur-sm transition hover:bg-black/80";

const UpdateImageButton: FC<{
  onClick: () => void;
  className?: string;
  label?: string;
  stacked?: boolean;
}> = ({ onClick, className = "", label = "Update image", stacked = false }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className={`pointer-events-auto z-30 ${imageChunkOverlayButtonClass} ${
      stacked ? "" : "absolute right-2 top-2"
    } ${className}`}
  >
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-5 w-5 shrink-0">
      <path d="M4 5a2 2 0 012-2h2.586a1 1 0 01.707.293l1.414 1.414A1 1 0 0011.414 5H14a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm6 3a3 3 0 100 6 3 3 0 000-6z" />
    </svg>
    {label}
  </button>
);

const UpdateCaptionButton: FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className={`pointer-events-auto z-30 ${imageChunkOverlayButtonClass}`}
  >
    Update caption
  </button>
);

export const ImageCaptionOverlay: FC<{ caption: string }> = ({ caption }) => {
  const text = caption.trim();
  if (!text) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-black/80">
      <p className="p-5 text-left text-lg italic text-white">{text}</p>
    </div>
  );
};

export const ImageChunkActionButtons: FC<{
  onUpdateImage: () => void;
  onUpdateCaption: () => void;
  imageLabel?: string;
}> = ({ onUpdateImage, onUpdateCaption, imageLabel }) => (
  <div className="pointer-events-auto absolute right-2 top-2 z-30 flex w-[min(100%,12rem)] flex-col items-stretch gap-1">
    <UpdateImageButton stacked onClick={onUpdateImage} label={imageLabel} />
    <UpdateCaptionButton onClick={onUpdateCaption} />
  </div>
);

export const EditableImageChunkFrame: FC<{
  imgSrc: string | null;
  imgAlt: string;
  caption: string;
  showImageActions: boolean;
  onUpdateImage: () => void;
  onUpdateCaption: () => void;
  imageButtonLabel?: string;
  objectFitClass?: string;
  children?: React.ReactNode;
}> = ({
  imgSrc,
  imgAlt,
  caption,
  showImageActions,
  onUpdateImage,
  onUpdateCaption,
  imageButtonLabel,
  objectFitClass = "object-contain",
  children,
}) => (
  <div className="relative w-full overflow-hidden rounded-sm border border-gray-200 bg-gray-50">
    {imgSrc ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imgSrc} alt={imgAlt || ""} className={`block h-auto w-full ${objectFitClass}`} />
    ) : (
      <div className="flex h-32 w-full items-center justify-center text-2xl text-gray-400">
        No image selected.
      </div>
    )}
    <ImageCaptionOverlay caption={caption} />
    {showImageActions ? (
      <ImageChunkActionButtons
        onUpdateImage={onUpdateImage}
        onUpdateCaption={onUpdateCaption}
        imageLabel={imageButtonLabel}
      />
    ) : null}
    {children}
  </div>
);
