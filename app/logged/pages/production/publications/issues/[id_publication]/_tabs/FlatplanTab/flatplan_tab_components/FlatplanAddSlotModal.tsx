"use client";

import React, { FC, useEffect, useState } from "react";

import ProjectSelectModal, {
  type ProjectRow,
} from "@/app/logged/logged_components/modals/ProjectSelectModal";
import type { EditorialPublicationIntegerBounds } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/FlatplanTab/flatplan_tab_components/flatplanInsertPlacement";
import {
  ARTICLE_PAGE_SLOT_KEY,
  type SlotContentTypeOption,
} from "@/app/logged/pages/production/publications/publication_components/_shared";

export type FlatplanAddSlotModalProps = {
  open: boolean;
  onClose: () => void;
  publicationId: string;
  publicationFormat: string;
  /** Initial whole-number page when the modal opens (user may edit). */
  initialPublicationPage: number;
  /** Allowed integer pages `minPage`…`maxPage` inclusive (`maxPage` = current end slot page). */
  editorialPageBounds: EditorialPublicationIntegerBounds | null;
  /** Full document reload after successful create (e.g. flatplan row "+" inserts). */
  reloadDocumentAfterCreate?: boolean;
  onCreated?: (info?: { publication_slot_id?: number }) => void | Promise<void>;
};

const TYPE_OPTIONS: SlotContentTypeOption[] = ["advert", "article"];

function clampIntegerSuggestion(value: number, bounds: EditorialPublicationIntegerBounds | null): number {
  if (!bounds || !Number.isFinite(value)) return Math.round(value);
  const r = Math.round(value);
  return Math.min(bounds.maxPage, Math.max(bounds.minPage, r));
}

export const FlatplanAddSlotModal: FC<FlatplanAddSlotModalProps> = ({
  open,
  onClose,
  publicationId,
  publicationFormat,
  initialPublicationPage,
  editorialPageBounds,
  reloadDocumentAfterCreate = false,
  onCreated,
}) => {
  const [slotContentType, setSlotContentType] = useState<SlotContentTypeOption>("advert");
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicationPageInput, setPublicationPageInput] = useState("");

  useEffect(() => {
    if (!open) return;
    setSlotContentType("advert");
    setSelectedProject(null);
    setError(null);
    setBusy(false);
    setProjectPickerOpen(false);
    const suggested = clampIntegerSuggestion(initialPublicationPage, editorialPageBounds);
    setPublicationPageInput(String(suggested));
  }, [open, initialPublicationPage, editorialPageBounds]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (projectPickerOpen) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, projectPickerOpen]);

  const parseAndValidatePublicationPage = (): number | null => {
    const raw = publicationPageInput.trim();
    if (raw === "") {
      setError("Enter a page number.");
      return null;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      setError("Enter a whole number (integer) for the page.");
      return null;
    }
    if (!editorialPageBounds) {
      setError("Could not resolve page limits (missing end slot).");
      return null;
    }
    const { minPage, maxPage } = editorialPageBounds;
    if (parsed < minPage || parsed > maxPage) {
      setError(
        `Choose an integer between ${minPage} and ${maxPage} (inclusive). These are the editorial pages after preferential page 9 through the current end slot page.`
      );
      return null;
    }
    return parsed;
  };

  const handleSubmit = async () => {
    const publication_page = parseAndValidatePublicationPage();
    if (publication_page == null) return;

    setBusy(true);
    setError(null);
    try {
      const createBody: Record<string, unknown> = {
        slot_key: ARTICLE_PAGE_SLOT_KEY,
        publication_format: publicationFormat === "informer" ? "informer" : "flipbook",
        slot_content_type: slotContentType,
        slot_state: "pending",
        publication_page,
      };

      const res = await fetch(
        `/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify(createBody),
        }
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let message = txt || "Failed to create slot";
        try {
          const j = JSON.parse(txt);
          if (j?.message) message = String(j.message);
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }

      const created = (await res.json()) as { publication_slot_id?: number };
      const sid = created?.publication_slot_id;

      if (selectedProject?.id_project && sid != null && Number.isFinite(Number(sid))) {
        const patchRes = await fetch(`/api/v1/publication-slots/${encodeURIComponent(String(sid))}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ project_id: selectedProject.id_project }),
        });
        if (!patchRes.ok) {
          const txt = await patchRes.text().catch(() => "");
          throw new Error(txt || "Slot created but failed to attach project");
        }
      }

      await onCreated?.({ publication_slot_id: sid });
      if (reloadDocumentAfterCreate) {
        window.location.reload();
        return;
      }
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add slot");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const rangeLabel =
    editorialPageBounds != null
      ? `${editorialPageBounds.minPage}–${editorialPageBounds.maxPage}`
      : "—";

  return (
    <>
      <ProjectSelectModal
        open={projectPickerOpen}
        onClose={() => setProjectPickerOpen(false)}
        onSelectProject={(p) => {
          setSelectedProject(p);
          setProjectPickerOpen(false);
        }}
        currentProjectId={selectedProject?.id_project ?? null}
        confirmLabel="Use project"
        overlayZIndexClass="z-[100]"
      />

      <div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl text-gray-900"
          role="dialog"
          aria-modal="true"
          aria-labelledby="flatplan-add-slot-title"
        >
          <div className="flex flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="flatplan-add-slot-title" className="text-lg font-semibold text-gray-900">
                Add editorial slot
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Slots default to type <span className="font-semibold">advert</span>. New slots start in{" "}
                <span className="font-semibold">pending</span> state. Slot key is fixed to{" "}
                <span className="font-mono">{ARTICLE_PAGE_SLOT_KEY}</span>.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg p-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Close"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="flatplan-add-slot-page" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Position (publication page)
              </label>
              <p className="mt-1 text-xs text-gray-600 leading-snug">
                Enter the logical magazine page (<span className="font-mono">publication_page</span>) where this editorial slot should live.
                Only <span className="font-semibold">whole numbers</span> are allowed. Valid range is{" "}
                <span className="font-semibold">{rangeLabel}</span>
                : strictly after preferential page 9 (so starting at <span className="font-semibold">10</span>) through the{" "}
                <span className="font-semibold">current end slot page</span> <span className="font-semibold">inclusive</span>.
                Choosing the same page number as <span className="font-mono">end</span> places the new slot there and moves{" "}
                <span className="font-mono">end</span> forward by one. Every existing <span className="font-mono">regular_page</span>{" "}
                and <span className="font-mono">end</span> row whose page is greater than or equal to your choice is shifted forward by one page;
                slots before that stay unchanged.
              </p>
              <input
                id="flatplan-add-slot-page"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={publicationPageInput}
                onChange={(e) => setPublicationPageInput(e.target.value.replace(/\D/g, ""))}
                disabled={busy}
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 font-mono disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="flatplan-add-slot-type" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Type
              </label>
              <select
                id="flatplan-add-slot-type"
                value={slotContentType}
                onChange={(e) => setSlotContentType(e.target.value as SlotContentTypeOption)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                State
              </span>
              <p className="mt-1 text-sm font-medium text-gray-800">pending</p>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Project
              </span>
              <div className="mt-1 flex flex-row flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProjectPickerOpen(true)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  {selectedProject?.title?.trim()
                    ? selectedProject.title
                    : "Choose project (optional)"}
                </button>
                {selectedProject ? (
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              <span className="font-semibold">Flatplan note:</span> your issue reloads after creation. Use bulk delete or the slot detail page to remove slots — this dialog only creates them.
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <div className="mt-6 flex flex-row justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={busy}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Create slot"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
