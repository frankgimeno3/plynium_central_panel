"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import type { NewsletterContentBlock } from "@/app/contents/interfaces";
import MediatecaModal from "@/app/logged/logged_components/modals/MediatecaModal";
import { NewsletterRichTextField } from "./NewsletterRichTextField";

type ImageField = "imageSrc" | "logoUrl";

interface NewsletterBlockEditModalProps {
  open: boolean;
  block: NewsletterContentBlock | null;
  onClose: () => void;
  onSave: (payload: {
    blockType: string;
    order: number;
    data: Record<string, unknown>;
  }) => Promise<void> | void;
}

const NewsletterBlockEditModal: FC<NewsletterBlockEditModalProps> = ({
  open,
  block,
  onClose,
  onSave,
}) => {
  const [localData, setLocalData] = useState<Record<string, unknown>>({});
  const [mediatecaOpen, setMediatecaOpen] = useState(false);
  const [mediatecaTarget, setMediatecaTarget] = useState<ImageField | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLocalData((block?.data as Record<string, unknown>) ?? {});
    setError(null);
  }, [open, block]);

  const preview = useMemo(() => {
    if (!block) return null;
    if (block.type === "header") return String(localData.logoUrl ?? "");
    if (block.type === "banner") return String(localData.imageSrc ?? "");
    if (block.type === "portal_article_preview") return String(localData.imageSrc ?? "");
    return null;
  }, [block, localData]);

  const openMediatecaFor = (target: ImageField) => {
    setMediatecaTarget(target);
    setMediatecaOpen(true);
  };

  const handleSelectImage = (imageSrc: string) => {
    if (!mediatecaTarget) return;
    setLocalData((prev) => ({ ...prev, [mediatecaTarget]: imageSrc }));
    setMediatecaOpen(false);
    setMediatecaTarget(null);
  };

  const handleSave = async () => {
    if (!block) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        blockType: block.type,
        order: block.order,
        data: localData,
      });
      setIsSaving(false);
      onClose();
    } catch (e: unknown) {
      setIsSaving(false);
      setError(e instanceof Error ? e.message : "Failed to save block");
    }
  };

  if (!open || !block) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="relative w-full max-w-xl rounded-lg bg-white shadow-xl overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Edit block: {block.type}</h2>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none p-1"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          <div className="p-6 overflow-auto max-h-[70vh]">
            {error ? <p className="mb-4 text-red-600 text-sm">{error}</p> : null}

            {preview ? (
              <div className="mb-4">
                <img
                  src={preview}
                  alt=""
                  className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                />
              </div>
            ) : null}

            {block.type === "header" ? (
              <div className="space-y-4">
                <NewsletterRichTextField
                  label="Title"
                  labelClassName="block text-sm font-medium text-gray-700 mb-1"
                  value={String(localData.title ?? "")}
                  onChange={(value) => setLocalData((prev) => ({ ...prev, title: value }))}
                  minHeight="80px"
                />
                <NewsletterRichTextField
                  label="Subtitle"
                  labelClassName="block text-sm font-medium text-gray-700 mb-1"
                  value={String(localData.subtitle ?? "")}
                  onChange={(value) => setLocalData((prev) => ({ ...prev, subtitle: value }))}
                  minHeight="100px"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo image</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={String(localData.logoUrl ?? "")}
                      readOnly
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      onClick={() => openMediatecaFor("logoUrl")}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {block.type === "banner" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner image</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={String(localData.imageSrc ?? "")}
                      readOnly
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      onClick={() => openMediatecaFor("imageSrc")}
                    >
                      Select
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URL</label>
                  <input
                    type="text"
                    value={String(localData.redirectUrl ?? "")}
                    onChange={(event) =>
                      setLocalData((prev) => ({ ...prev, redirectUrl: event.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt text</label>
                  <input
                    type="text"
                    value={String(localData.alt ?? "")}
                    onChange={(event) => setLocalData((prev) => ({ ...prev, alt: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ) : null}

            {block.type === "portal_article_preview" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preview image</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={String(localData.imageSrc ?? "")}
                      readOnly
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      onClick={() => openMediatecaFor("imageSrc")}
                    >
                      Select
                    </button>
                  </div>
                </div>
                <NewsletterRichTextField
                  label="Title"
                  labelClassName="block text-sm font-medium text-gray-700 mb-1"
                  value={String(localData.title ?? "")}
                  onChange={(value) => setLocalData((prev) => ({ ...prev, title: value }))}
                  minHeight="80px"
                />
                <NewsletterRichTextField
                  label="Briefing"
                  labelClassName="block text-sm font-medium text-gray-700 mb-1"
                  value={String(localData.briefing ?? "")}
                  onChange={(value) => setLocalData((prev) => ({ ...prev, briefing: value }))}
                  minHeight="140px"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URL</label>
                  <input
                    type="text"
                    value={String(localData.link ?? "")}
                    onChange={(event) => setLocalData((prev) => ({ ...prev, link: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ) : null}

            {block.type === "footer" ? (
              <NewsletterRichTextField
                label="Text"
                labelClassName="block text-sm font-medium text-gray-700 mb-1"
                value={String(localData.text ?? "")}
                onChange={(value) => setLocalData((prev) => ({ ...prev, text: value }))}
                minHeight="160px"
              />
            ) : null}

            {block.type === "custom_content" ? (
              <NewsletterRichTextField
                label="HTML"
                labelClassName="block text-sm font-medium text-gray-700 mb-1"
                value={String(localData.html ?? "")}
                onChange={(value) => setLocalData((prev) => ({ ...prev, html: value }))}
                minHeight="220px"
              />
            ) : null}

            {!(
              block.type === "header" ||
              block.type === "banner" ||
              block.type === "portal_article_preview" ||
              block.type === "footer" ||
              block.type === "custom_content"
            ) ? (
              <p className="text-sm text-gray-600">Editing UI not implemented for this block type.</p>
            ) : null}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                isSaving ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              }`}
            >
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      <MediatecaModal
        open={mediatecaOpen}
        onClose={() => {
          setMediatecaOpen(false);
          setMediatecaTarget(null);
        }}
        onSelectImage={(imageSrc) => handleSelectImage(imageSrc)}
      />
    </>
  );
};

export default NewsletterBlockEditModal;
