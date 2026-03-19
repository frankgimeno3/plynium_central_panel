"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import type { NewsletterContentBlock } from "@/app/contents/interfaces";
import MediatecaModal from "@/app/logged/logged_components/modals/MediatecaModal";

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
    } catch (e: any) {
      setIsSaving(false);
      setError(e?.message ? String(e.message) : "Failed to save block");
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
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Edit block: {block.type}
            </h2>
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
            {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

            {preview ? (
              <div className="mb-4">
                <img
                  src={preview}
                  alt=""
                  className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                />
              </div>
            ) : null}

            {block.type === "header" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={String(localData.title ?? "")}
                    onChange={(e) => setLocalData((p) => ({ ...p, title: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={String(localData.subtitle ?? "")}
                    onChange={(e) => setLocalData((p) => ({ ...p, subtitle: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
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
            )}

            {block.type === "banner" && (
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
                    onChange={(e) => setLocalData((p) => ({ ...p, redirectUrl: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt text</label>
                  <input
                    type="text"
                    value={String(localData.alt ?? "")}
                    onChange={(e) => setLocalData((p) => ({ ...p, alt: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {block.type === "portal_article_preview" && (
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={String(localData.title ?? "")}
                    onChange={(e) => setLocalData((p) => ({ ...p, title: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Briefing</label>
                  <textarea
                    value={String(localData.briefing ?? "")}
                    onChange={(e) => setLocalData((p) => ({ ...p, briefing: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URL</label>
                  <input
                    type="text"
                    value={String(localData.link ?? "")}
                    onChange={(e) => setLocalData((p) => ({ ...p, link: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {block.type === "footer" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                  <textarea
                    value={String(localData.text ?? "")}
                    onChange={(e) => setLocalData((p) => ({ ...p, text: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {block.type === "custom_content" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HTML</label>
                  <textarea
                    value={String(localData.html ?? "")}
                    onChange={(e) => setLocalData((p) => ({ ...p, html: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    rows={8}
                  />
                </div>
              </div>
            )}

            {!(block.type === "header" || block.type === "banner" || block.type === "portal_article_preview" || block.type === "footer" || block.type === "custom_content") && (
              <p className="text-sm text-gray-600">
                Editing UI not implemented for this block type.
              </p>
            )}
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

