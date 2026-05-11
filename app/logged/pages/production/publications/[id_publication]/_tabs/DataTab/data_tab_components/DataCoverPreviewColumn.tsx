"use client";

import React from "react";
import Link from "next/link";
import type { CoverMarginArticleMiniature, MagazineApiRow, PublicationDbRow } from "../../../_shared";
import {
  ArticleMenu,
  BASE,
  CoverAdvert,
  CoverHeader,
  countWords,
  limitToWords,
  RED_BOX_BODY_MAX_WORDS,
} from "../../../_shared";

export type DataCoverPreviewColumnProps = {
  publicationId: string;
  magazine: MagazineApiRow | null;
  draftPub: PublicationDbRow | null;
  setDraftPub: React.Dispatch<React.SetStateAction<PublicationDbRow | null>>;
  title: string;
  coverSlotId: number | null;
  coverMarginMiniatures: CoverMarginArticleMiniature[];
};

export function DataCoverPreviewColumn({
  publicationId,
  magazine,
  draftPub,
  setDraftPub,
  title,
  coverSlotId,
  coverMarginMiniatures,
}: DataCoverPreviewColumnProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-sm overflow-hidden border border-black/10 shadow-sm bg-white flex flex-col w-full aspect-[4/5]">
        <div className="basis-1/5 w-full">
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
        <div className="basis-4/5 w-full flex flex-row min-h-0 overflow-visible relative z-20">
          <div className="basis-1/4 min-w-0 overflow-visible relative">
            <ArticleMenu
              miniatures={coverMarginMiniatures}
              publicationYear={draftPub?.publication_year ?? null}
              thisYearIssue={draftPub?.magazine_this_year_issue ?? null}
              redBoxHeader={draftPub?.red_box_header ?? ""}
              redBoxBody={draftPub?.red_box_body ?? ""}
            />
          </div>
          <div className="flex-1 min-w-0 relative">
            <CoverAdvert
              imageUrl={draftPub?.publication_main_image_url || null}
              alt={title}
            />
            <div className="absolute top-3 right-3 rounded-xl shadow-lg bg-white/90 p-3 flex flex-col gap-2 min-w-[200px] max-w-[260px]">
              <span className="text-xs font-semibold text-gray-700">Cover image</span>
              {coverSlotId != null ? (
                <Link
                  href={`${BASE}/${encodeURIComponent(publicationId)}/slots/${coverSlotId}`}
                  className="block text-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/50 transition-colors font-medium text-sm"
                >
                  Update image
                </Link>
              ) : (
                <span
                  className="block text-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 font-medium text-sm cursor-not-allowed"
                  title="Cover slot is being provisioned…"
                >
                  Update image
                </span>
              )}
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
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-900">Cover miniature settings</p>
        <p className="mt-1 text-xs text-gray-500">
          These controls manage the variable text rendered inside the cover miniature.
        </p>
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
