"use client";

import React, { useEffect, useState } from "react";

type NewsletterHtmlPreviewModalProps = {
  open: boolean;
  html: string;
  onClose: () => void;
};

export default function NewsletterHtmlPreviewModal({
  open,
  html,
  onClose,
}: NewsletterHtmlPreviewModalProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (!open) {
      setCopyStatus("idle");
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleCopy = async () => {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-html-preview-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <h3 id="newsletter-html-preview-title" className="text-lg font-semibold text-gray-900">
              Newsletter HTML
            </h3>
            <p className="text-sm text-gray-500">
              HTML generated from the Edition preview in Contents Manager. Press Esc to close.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!html}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {copyStatus === "copied" ? "Copied" : copyStatus === "error" ? "Copy failed" : "Copy"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>

        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words bg-gray-50 px-5 py-4 font-mono text-xs text-gray-800">
          {html}
        </pre>
      </div>
    </div>
  );
}
