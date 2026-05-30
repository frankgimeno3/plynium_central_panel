"use client";

import { FC, useCallback, useMemo, useState } from "react";

import {
  PublicationDbRow,
  SlotRow,
  publicationPublishBlockers,
} from "@/app/logged/pages/production/publications/publication_components/_shared";

export type PublishMagazineModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  publicationId: string;
  publication: PublicationDbRow;
  slots: SlotRow[];
  onPublished: (updated: PublicationDbRow) => void;
};

export const PublishMagazineModal: FC<PublishMagazineModalProps> = ({
  open,
  onClose,
  title,
  publicationId,
  publication,
  slots,
  onPublished,
}) => {
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const publishBlockers = useMemo(
    () => publicationPublishBlockers(publication, slots),
    [publication, slots]
  );
  const canPublish = publishBlockers.length === 0;

  const handlePublish = useCallback(async () => {
    if (!canPublish || publishing) return;
    setPublishError(null);
    setPublishing(true);
    try {
      const res = await fetch(
        `/api/v1/publications-db/${encodeURIComponent(publicationId)}/publish`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: "{}",
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        blockers?: string[];
        publication?: PublicationDbRow;
      };
      if (!res.ok) {
        const lines = Array.isArray(data.blockers) ? data.blockers : [];
        throw new Error(
          lines.length ? lines.join("\n") : data.message || `HTTP ${res.status}`
        );
      }
      if (data.publication) {
        onPublished(data.publication);
      }
      onClose();
    } catch (e: unknown) {
      setPublishError((e as Error)?.message ?? "Failed to publish publication");
    } finally {
      setPublishing(false);
    }
  }, [canPublish, publishing, publicationId, onPublished, onClose]);

  if (!open) return null;

  const statusLabel = String(publication.publication_status ?? "draft").trim() || "draft";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-magazine-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-4 max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-xl flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2
            id="publish-magazine-modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            Publish magazine
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="space-y-3 px-6 py-5 overflow-y-auto">
          <p className="text-sm text-gray-700">
            You are about to publish this magazine issue. This action is intended to be final for
            production workflow purposes.
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900">
            <p className="font-semibold text-slate-950">What will happen</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate-800">
              <li>
                Issue status changes from <strong>{statusLabel}</strong> to{" "}
                <strong>published</strong>.
              </li>
              <li>
                <strong>Published date</strong> (<span className="font-mono text-xs">real_publication_month_date</span>)
                is set to <strong>today</strong>.
              </li>
              <li>
                This issue will <strong>no longer appear</strong> as an offerable publication
                service in <strong>proposals</strong> (preferential pages and related inventory
                only list pending issues).
              </li>
              <li>
                When you reopen this issue, the header will show{" "}
                <strong>Edit current publication</strong> instead of Publish magazine.
              </li>
            </ul>
          </div>
          <p className="text-sm text-gray-700">
            Before publishing, confirm every <strong>article</strong> slot is linked and{" "}
            <strong>finished approved</strong> in Article Builder, and mark the{" "}
            <strong>index</strong> and <strong>summary</strong> slots as ready on their slot pages.
          </p>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs uppercase tracking-wide text-blue-700">Magazine issue</p>
            <p className="mt-1 font-medium text-blue-950">{title}</p>
            <p className="mt-1 text-xs text-blue-800">
              Current status: <span className="font-semibold">{statusLabel}</span>
            </p>
          </div>
          {canPublish ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              All workflow gates are satisfied. You can publish this issue now.
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <p className="font-semibold text-amber-900">Cannot publish yet</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-950/95">
                {publishBlockers.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          {publishError ? (
            <p className="text-sm text-red-700 whitespace-pre-wrap" role="alert">
              {publishError}
            </p>
          ) : null}
          {!canPublish ? (
            <p className="text-xs text-gray-500">
              The publish button stays disabled until every requirement above is satisfied.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={publishing}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={!canPublish || publishing}
            title={
              !canPublish
                ? "Resolve every blocker above before publishing."
                : undefined
            }
            className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {publishing ? "Publishing…" : "Publish magazine"}
          </button>
        </div>
      </div>
    </div>
  );
};
