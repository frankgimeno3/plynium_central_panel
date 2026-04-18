"use client";

import React, { useEffect } from "react";
import type { Newsletter } from "@/app/contents/interfaces";

type PortalTag = { id: number; key: string; name: string };

export default function ConfirmRemoveCampaignPortalModal({
  open,
  mode,
  portal,
  campaignName,
  loading,
  newsletters,
  error,
  confirming,
  onClose,
  onConfirm,
}: {
  open: boolean;
  mode: "portal" | "campaign";
  portal: PortalTag | null;
  campaignName?: string;
  loading: boolean;
  newsletters: Newsletter[];
  error: string | null;
  confirming: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open || confirming) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, confirming, onClose]);

  if (!open) return null;
  if (mode === "portal" && !portal) return null;

  const titleId = mode === "campaign" ? "confirm-delete-campaign-title" : "confirm-remove-campaign-portal-title";
  const title = mode === "campaign" ? "Delete newsletter campaign?" : "Remove portal from campaign?";

  const listHeading =
    mode === "campaign"
      ? "Newsletters for this campaign"
      : "Related newsletters (same campaign + same portal)";

  const confirmLabel = mode === "campaign" ? "Delete campaign" : "Remove";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={() => (confirming ? null : onClose())}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id={titleId} className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => (confirming ? null : onClose())}
            disabled={confirming}
            className="p-1 text-2xl leading-none text-gray-500 hover:text-gray-700 disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          {mode === "portal" && portal && (
            <>
              <p className="text-sm text-gray-700">
                You’re about to remove <span className="font-semibold">{portal.key}</span> from this campaign.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This will only remove the portal association. Existing newsletters will{" "}
                <span className="font-semibold">not</span> be deleted.
              </p>
            </>
          )}

          {mode === "campaign" && (
            <>
              <p className="text-sm text-gray-700">
                You’re about to delete{" "}
                <span className="font-semibold">{campaignName?.trim() ? campaignName : "this campaign"}</span>.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This will permanently delete the campaign and <span className="font-semibold">all</span> newsletters
                linked to it (including their content blocks).
              </p>
            </>
          )}

          <div className="mt-4 rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900">
              {listHeading}
            </div>
            <div className="max-h-[40vh] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-sm text-gray-500">Loading…</div>
              ) : error ? (
                <div className="p-4 text-sm text-red-700">{error}</div>
              ) : newsletters.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No newsletters found.</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {newsletters.map((n) => (
                    <div key={n.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-gray-900">{n.id}</p>
                        <p className="truncate text-gray-500">{n.topic}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900">{n.estimatedPublishDate || "—"}</p>
                        <p className="text-xs font-medium text-gray-500">{n.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {confirming ? (mode === "campaign" ? "Deleting…" : "Removing…") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
