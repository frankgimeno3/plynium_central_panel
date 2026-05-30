"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import MediatecaModal from "@/app/logged/logged_components/modals/MediatecaModal";
import { coverAdvertMaterialsMediatecaPath } from "@/app/contents/mediatecaPaths";
import type { CoverMarginArticleMiniature, MagazineApiRow, PublicationDbRow } from "@/app/logged/pages/production/publications/publication_components/_shared";
import {
  ArticleMenu,
  CoverAdvert,
  CoverHeader,
  countWords,
  limitToWords,
  RED_BOX_BODY_MAX_WORDS,
} from "@/app/logged/pages/production/publications/publication_components/_shared";

export type DataCoverPreviewColumnProps = {
  publicationId: string;
  magazine: MagazineApiRow | null;
  draftPub: PublicationDbRow | null;
  setDraftPub: React.Dispatch<React.SetStateAction<PublicationDbRow | null>>;
  title: string;
  coverSlotId: number | null;
  coverMarginMiniatures: CoverMarginArticleMiniature[];
  onRefreshPublication?: () => void | Promise<void>;
};

export function DataCoverPreviewColumn({
  publicationId,
  magazine,
  draftPub,
  setDraftPub,
  title,
  coverSlotId,
  coverMarginMiniatures,
  onRefreshPublication,
}: DataCoverPreviewColumnProps) {
  const coverPreviewRef = useRef<HTMLDivElement>(null);
  const [mediatecaOpen, setMediatecaOpen] = useState(false);
  const [coverImageSaving, setCoverImageSaving] = useState(false);
  const [coverImageError, setCoverImageError] = useState<string | null>(null);
  const [compositeSaving, setCompositeSaving] = useState(false);
  const [compositeError, setCompositeError] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState(false);

  const editionName = draftPub?.publication_edition_name ?? "";
  const mediatecaPath = useMemo(
    () => coverAdvertMaterialsMediatecaPath(editionName),
    [editionName]
  );

  const handleCoverImageSelected = useCallback(
    async (imageUrl: string) => {
      if (!imageUrl?.trim()) return;
      setCoverImageError(null);
      setCoverImageSaving(true);
      try {
        const res = await fetch(
          `/api/v1/publications-db/${encodeURIComponent(publicationId)}/cover-image`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ image_url: imageUrl.trim() }),
          }
        );
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || "Failed to save cover image");
        }
        const data = (await res.json()) as { publication_main_image_url?: string; image_url?: string };
        const nextUrl = data.publication_main_image_url ?? data.image_url ?? imageUrl.trim();
        setDraftPub((p) => (p ? { ...p, publication_main_image_url: nextUrl } : p));
        await onRefreshPublication?.();
      } catch (e: unknown) {
        setCoverImageError((e as Error)?.message ?? "Failed to save cover image");
      } finally {
        setCoverImageSaving(false);
      }
    },
    [publicationId, setDraftPub, onRefreshPublication]
  );

  const handleCreateCoverFromCurrentData = useCallback(async () => {
    const el = coverPreviewRef.current;
    if (!el || coverSlotId == null) return;
    setCompositeError(null);
    setCompositeSaving(true);
    setCaptureMode(true);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        cacheBust: true,
        includeQueryParams: true,
        skipFonts: true,
        backgroundColor: "#ffffff",
        filter: (node) => {
          if (node instanceof HTMLElement && node.dataset.excludeFromCoverCapture === "true") {
            return false;
          }
          return true;
        },
      });
      const res = await fetch(
        `/api/v1/publications-db/${encodeURIComponent(publicationId)}/cover-flatplan-composite`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            image_png_base64: dataUrl,
            slot_id: coverSlotId,
          }),
        }
      );
      if (!res.ok) {
        const raw = await res.text().catch(() => "");
        let msg = raw;
        try {
          const parsed = JSON.parse(raw) as { message?: string };
          msg = parsed.message || raw;
        } catch {
          // Keep the raw response text.
        }
        throw new Error(msg || "Failed to upload cover composite");
      }
      const data = (await res.json()) as {
        publication_cover_flatplan_image_url?: string;
        image_url?: string;
      };
      const flatplanUrl =
        data.publication_cover_flatplan_image_url ?? data.image_url ?? "";
      setDraftPub((p) =>
        p ? { ...p, publication_cover_flatplan_image_url: flatplanUrl } : p
      );
      await onRefreshPublication?.();
    } catch (e: unknown) {
      setCompositeError((e as Error)?.message ?? "Failed to create cover composite");
    } finally {
      setCaptureMode(false);
      setCompositeSaving(false);
    }
  }, [publicationId, coverSlotId, setDraftPub, onRefreshPublication]);

  return (
    <div className="space-y-3">
      <div
        ref={coverPreviewRef}
        className="rounded-sm overflow-hidden border border-black/10 shadow-sm bg-white flex flex-col w-full aspect-[4/5]"
      >
        <div className="relative z-0 basis-1/5 w-full shrink-0">
          <CoverHeader
            magazineName={magazine?.name ?? null}
            fallbackName={draftPub?.publication_edition_name ?? title}
            subtitle={magazine?.subtitle ?? ""}
            headerDomain={draftPub?.publication_header_domain ?? ""}
            specialEditionSubtitle={
              draftPub?.is_special_edition
                ? draftPub?.special_edition_subtitle ?? ""
                : ""
            }
          />
        </div>
        <div className="relative z-10 basis-4/5 w-full flex flex-row min-h-0 overflow-visible">
          <div className="relative z-30 basis-1/4 min-w-0 overflow-visible">
            <ArticleMenu
              miniatures={coverMarginMiniatures}
              publicationYear={draftPub?.publication_year ?? null}
              thisYearIssue={draftPub?.magazine_this_year_issue ?? null}
              redBoxHeader={draftPub?.red_box_header ?? ""}
              redBoxBody={draftPub?.red_box_body ?? ""}
            />
          </div>
          <div className="relative z-0 flex-1 min-w-0">
            <CoverAdvert
              imageUrl={draftPub?.publication_main_image_url || null}
              alt={title}
            />
            {!captureMode ? (
              <div
                data-exclude-from-cover-capture="true"
                className="absolute top-3 right-3 rounded-xl shadow-lg bg-white/90 p-3 flex flex-col gap-2 min-w-[200px] max-w-[260px]"
              >
                <span className="text-xs font-semibold text-gray-700">Cover image</span>
                {coverSlotId != null ? (
                  <button
                    type="button"
                    disabled={coverImageSaving}
                    onClick={() => setMediatecaOpen(true)}
                    className="block w-full text-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/50 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    {coverImageSaving ? "Saving…" : "Update image"}
                  </button>
                ) : (
                  <span
                    className="block text-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 font-medium text-sm cursor-not-allowed"
                    title="Cover slot is being provisioned…"
                  >
                    Update image
                  </span>
                )}
                {coverImageError ? (
                  <p className="text-xs text-red-600">{coverImageError}</p>
                ) : null}
                {draftPub?.publication_main_image_url ? (
                  <div className="relative aspect-[5/2] w-full max-h-24 overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <img
                      src={draftPub.publication_main_image_url}
                      alt=""
                      className="h-full w-full object-contain object-center p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <MediatecaModal
        open={mediatecaOpen}
        onClose={() => setMediatecaOpen(false)}
        onSelectImage={(imageUrl) => {
          setMediatecaOpen(false);
          void handleCoverImageSelected(imageUrl);
        }}
        initialPath={mediatecaPath}
        allowPdfSelection
        ensureSlotMediatecaFolder={
          coverSlotId != null
            ? { publicationId, slotId: coverSlotId }
            : undefined
        }
      />

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">Cover miniature settings</p>
            <p className="mt-1 text-xs text-gray-500">
              These controls manage the variable text rendered inside the cover miniature.
            </p>
          </div>
          <button
            type="button"
            disabled={compositeSaving || coverSlotId == null}
            onClick={() => void handleCreateCoverFromCurrentData()}
            className="shrink-0 rounded-lg bg-blue-950 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              coverSlotId == null
                ? "Cover slot is being provisioned…"
                : "Capture the preview and upload to mediateca …/cover/final for flatplan"
            }
          >
            {compositeSaving ? "Creating…" : "Create cover from current data"}
          </button>
        </div>
        {compositeError ? (
          <p className="mt-2 text-xs text-red-600">{compositeError}</p>
        ) : null}
        {draftPub?.publication_cover_flatplan_image_url ? (
          <p className="mt-2 text-xs text-green-700">
            Flatplan composite saved. The flatplan tab uses this image for the cover tile.
          </p>
        ) : null}
        <div className="mt-3 grid grid-cols-1 gap-3">
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-gray-500">
              Header Side Web Domain
            </span>
            <input
              type="text"
              value={draftPub?.publication_header_domain ?? ""}
              onChange={(e) =>
                setDraftPub((p) =>
                  p ? { ...p, publication_header_domain: e.target.value } : p
                )
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="vidrioperfil.com"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-gray-500">
              Red Box Content Header
            </span>
            <input
              type="text"
              value={draftPub?.red_box_header ?? ""}
              onChange={(e) =>
                setDraftPub((p) => (p ? { ...p, red_box_header: e.target.value } : p))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1889 · 2026"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-gray-500 flex items-center justify-between">
              <span>Red Box Content Body</span>
              <span
                className={
                  countWords(draftPub?.red_box_body ?? "") >= RED_BOX_BODY_MAX_WORDS
                    ? "text-amber-600 font-semibold"
                    : "text-gray-400 font-normal"
                }
              >
                {countWords(draftPub?.red_box_body ?? "")} / {RED_BOX_BODY_MAX_WORDS} words
              </span>
            </span>
            <textarea
              value={draftPub?.red_box_body ?? ""}
              onChange={(e) => {
                const next = limitToWords(e.target.value, RED_BOX_BODY_MAX_WORDS);
                setDraftPub((p) => (p ? { ...p, red_box_body: next } : p));
              }}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={"Spain\nPortugal\nAndorra"}
            />
          </label>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            The cover subtitle comes from the magazine title. Edit it in the magazine settings page.
          </div>
        </div>
      </div>
    </div>
  );
}
