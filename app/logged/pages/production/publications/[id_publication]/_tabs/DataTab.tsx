"use client";

import React from "react";
import Link from "next/link";
import { MovableContentType } from "@/app/logged/logged_components/modals/MoveContentTypeModal";
import {
  ArticleMenu,
  BASE,
  CoverHeader,
  CoverAdvert,
  CoverMarginArticleMiniature,
  countWords,
  limitToWords,
  MagazineApiRow,
  monthName,
  normalizeDateString,
  PreferentialSlotApiRow,
  PreferentialSlotBlock,
  PublicationDbRow,
  RED_BOX_BODY_MAX_WORDS,
  toNullableInt,
  toNullableMonth,
} from "../_shared";

export type MoveContentTypeModalState = {
  contentType: MovableContentType;
  initialTarget: string | null;
} | null;

export type DataTabProps = {
  publicationId: string;
  publication: PublicationDbRow;
  draftPub: PublicationDbRow | null;
  setDraftPub: React.Dispatch<React.SetStateAction<PublicationDbRow | null>>;
  saveError: string | null;
  magazine: MagazineApiRow | null;
  preferentialSlots: PreferentialSlotApiRow[];
  title: string;
  coverSlotId: number | null;
  coverMarginMiniatures: CoverMarginArticleMiniature[];
  setCoverMarginArticleModalPosition: React.Dispatch<React.SetStateAction<number | null>>;
  removeCoverMarginArticle: (position: number) => void;
  startEditingCoverMarginContent: (position: number) => void;
  updateCoverMarginDraftContent: (position: number, draftContent: string) => void;
  saveCoverMarginDraftContent: (position: number) => void;
  setMoveContentTypeModal: React.Dispatch<
    React.SetStateAction<MoveContentTypeModalState>
  >;
};

/**
 * Editable "Data" tab: publication metadata form + preferential placements
 * grid + cover margin miniatures table + the cover preview composition.
 *
 * State and side effects (autosave, modals, slot mutations) live in the
 * parent component. The tab only renders and forwards user intent.
 */
export function DataTab({
  publicationId,
  publication,
  draftPub,
  setDraftPub,
  saveError,
  magazine,
  preferentialSlots,
  title,
  coverSlotId,
  coverMarginMiniatures,
  setCoverMarginArticleModalPosition,
  removeCoverMarginArticle,
  startEditingCoverMarginContent,
  updateCoverMarginDraftContent,
  saveCoverMarginDraftContent,
  setMoveContentTypeModal,
}: DataTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        {saveError && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
            {saveError}
          </div>
        )}
        <div className="flex flex-row flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 uppercase">Publication ID</p>
            <p className="font-medium text-gray-900 break-all">{publication.publication_id}</p>
          </div>
          <div className="shrink-0 flex flex-col items-start gap-1">
            <p className="text-xs text-gray-500 uppercase">Special edition</p>
            <label className="mt-1 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(draftPub?.is_special_edition)}
                onChange={(e) =>
                  setDraftPub((p) =>
                    p ? { ...p, is_special_edition: e.target.checked } : p
                  )
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-800">This issue is a special edition</span>
            </label>
            {draftPub?.is_special_edition ? (
              <input
                value={draftPub?.special_edition_subtitle ?? ""}
                onChange={(e) =>
                  setDraftPub((p) =>
                    p ? { ...p, special_edition_subtitle: e.target.value } : p
                  )
                }
                maxLength={255}
                className="mt-1 w-72 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Special edition subtitle (e.g. 25th anniversary issue)"
              />
            ) : null}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Edition name</p>
          <input
            value={draftPub?.publication_edition_name ?? ""}
            onChange={(e) =>
              setDraftPub((p) =>
                p ? { ...p, publication_edition_name: e.target.value } : p
              )
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Edition name"
          />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Theme</p>
          <input
            value={draftPub?.publication_theme ?? ""}
            onChange={(e) =>
              setDraftPub((p) => (p ? { ...p, publication_theme: e.target.value } : p))
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Theme"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Year</p>
            <input
              value={
                draftPub?.publication_year != null ? String(draftPub.publication_year) : ""
              }
              onChange={(e) =>
                setDraftPub((p) =>
                  p ? { ...p, publication_year: toNullableInt(e.target.value) } : p
                )
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 2026"
              inputMode="numeric"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Expected month</p>
            <input
              value={
                draftPub?.publication_expected_publication_month != null
                  ? String(draftPub.publication_expected_publication_month)
                  : ""
              }
              onChange={(e) =>
                setDraftPub((p) =>
                  p
                    ? {
                        ...p,
                        publication_expected_publication_month: toNullableMonth(
                          e.target.value
                        ),
                      }
                    : p
                )
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1-12"
              inputMode="numeric"
            />
            <p className="text-xs text-gray-400 mt-1">
              {monthName(draftPub?.publication_expected_publication_month ?? null)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Magazine ID</p>
            <input
              value={draftPub?.magazine_id ?? ""}
              onChange={(e) =>
                setDraftPub((p) =>
                  p ? { ...p, magazine_id: e.target.value || null } : p
                )
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="mag-001"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Issue # (this year)</p>
            <input
              value={
                draftPub?.magazine_this_year_issue != null
                  ? String(draftPub.magazine_this_year_issue)
                  : ""
              }
              onChange={(e) =>
                setDraftPub((p) =>
                  p
                    ? {
                        ...p,
                        magazine_this_year_issue: toNullableInt(e.target.value),
                      }
                    : p
                )
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 3"
              inputMode="numeric"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Status</p>
            <select
              value={draftPub?.publication_status ?? "draft"}
              onChange={(e) =>
                setDraftPub((p) => (p ? { ...p, publication_status: e.target.value } : p))
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="planned">planned</option>
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Format</p>
            <select
              value={draftPub?.publication_format ?? "flipbook"}
              onChange={(e) =>
                setDraftPub((p) => (p ? { ...p, publication_format: e.target.value } : p))
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="flipbook">flipbook</option>
              <option value="informer">informer</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Materials deadline</p>
            <input
              type="date"
              value={draftPub?.publication_materials_deadline ?? ""}
              onChange={(e) =>
                setDraftPub((p) =>
                  p
                    ? {
                        ...p,
                        publication_materials_deadline: normalizeDateString(e.target.value),
                      }
                    : p
                )
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Published date</p>
            <input
              type="date"
              value={draftPub?.real_publication_month_date ?? ""}
              onChange={(e) =>
                setDraftPub((p) =>
                  p
                    ? {
                        ...p,
                        real_publication_month_date: normalizeDateString(e.target.value),
                      }
                    : p
                )
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 mt-2 border-t border-gray-200 space-y-3 min-w-0">
          <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-gray-900">Preferential placements</p>
              <p className="text-xs text-gray-500 mt-1">
                Summary of <span className="font-mono">publication_preferential_slots</span> for this
                publication.
              </p>
            </div>
            <div className="flex flex-row items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setMoveContentTypeModal({
                    contentType: "summary",
                    initialTarget: null,
                  })
                }
                className="px-3 py-2 text-xs font-medium rounded-lg border border-amber-300 bg-white text-amber-800 hover:bg-amber-50"
              >
                Change Summary Location
              </button>
              <button
                type="button"
                onClick={() =>
                  setMoveContentTypeModal({
                    contentType: "index",
                    initialTarget: null,
                  })
                }
                className="px-3 py-2 text-xs font-medium rounded-lg border border-amber-300 bg-white text-amber-800 hover:bg-amber-50"
              >
                Change Index Location
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-[min(70vh,720px)] overflow-y-auto pr-1 auto-rows-min">
            {preferentialSlots.length === 0 ? (
              <p className="col-span-2 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-4">
                No preferential slot data returned. If this is a magazine issue, ensure slots were
                provisioned for this publication.
              </p>
            ) : (
              preferentialSlots.map((slot) => (
                <div
                  key={slot.position_in_magazine}
                  className="min-w-0 rounded-lg border border-gray-200 bg-gray-50/90 p-3 sm:p-4 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-gray-900">{slot.section_title}</h3>
                  <PreferentialSlotBlock slot={slot} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 mt-2 border-t border-gray-200 space-y-3 min-w-0">
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-gray-900">
              Cover margin article miniatures
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Manage the six ordered article miniatures shown in the cover margin.
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Position
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Article
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Content to show
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coverMarginMiniatures.map((row) => (
                  <tr key={row.position} className="align-top">
                    <td className="px-3 py-3 font-mono text-sm text-gray-800">
                      {row.position}
                    </td>
                    <td className="px-3 py-3 min-w-[220px]">
                      {row.article ? (
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 shadow-sm">
                          <p className="text-[10px] uppercase tracking-wide text-blue-700">
                            Article
                          </p>
                          <p className="text-sm font-semibold text-blue-950">
                            {row.article.title}
                          </p>
                          <p className="mt-1 text-xs font-mono text-blue-800 break-all">
                            {row.article.id}
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCoverMarginArticleModalPosition(row.position)}
                          className="px-3 py-2 text-xs font-medium rounded-lg border border-blue-200 bg-white text-blue-800 hover:bg-blue-50"
                        >
                          Select article from publication
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-3 min-w-[320px]">
                      {row.article ? (
                        row.editing ? (
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">
                                Current content
                              </label>
                              <textarea
                                value={row.currentContent}
                                readOnly
                                className="w-full min-h-[80px] rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">
                                Modified content
                              </label>
                              <textarea
                                value={row.draftContent}
                                onChange={(e) =>
                                  updateCoverMarginDraftContent(
                                    row.position,
                                    e.target.value
                                  )
                                }
                                className="w-full min-h-[80px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => saveCoverMarginDraftContent(row.position)}
                              className="justify-self-start px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Save content
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditingCoverMarginContent(row.position)}
                            className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-left text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                          >
                            {row.currentContent || "Click to edit display content"}
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">No article selected.</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {row.article ? (
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => removeCoverMarginArticle(row.position)}
                            className="px-3 py-2 text-xs font-medium rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50"
                          >
                            Remove article
                          </button>
                          <button
                            type="button"
                            onClick={() => setCoverMarginArticleModalPosition(row.position)}
                            className="px-3 py-2 text-xs font-medium rounded-lg border border-blue-200 bg-white text-blue-800 hover:bg-blue-50"
                          >
                            Select another article
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
    </div>
  );
}
