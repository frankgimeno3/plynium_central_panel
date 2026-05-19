"use client";

import React from "react";
import type { PublicationDbRow } from "@/app/logged/pages/production/publications/publication_components/_shared";
import { monthName, normalizeDateString, toNullableInt, toNullableMonth } from "@/app/logged/pages/production/publications/publication_components/_shared";

export type DataPublicationMetadataFormProps = {
  publication: PublicationDbRow;
  draftPub: PublicationDbRow | null;
  setDraftPub: React.Dispatch<React.SetStateAction<PublicationDbRow | null>>;
};

export function DataPublicationMetadataForm({
  publication,
  draftPub,
  setDraftPub,
}: DataPublicationMetadataFormProps) {
  return (
    <>
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
    </>
  );
}
