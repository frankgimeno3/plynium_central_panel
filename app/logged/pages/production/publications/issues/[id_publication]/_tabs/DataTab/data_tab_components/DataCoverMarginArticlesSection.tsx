"use client";

import React from "react";
import type { CoverMarginArticleMiniature } from "@/app/logged/pages/production/publications/publication_components/_shared";

export type DataCoverMarginArticlesSectionProps = {
  coverMarginMiniatures: CoverMarginArticleMiniature[];
  setCoverMarginArticleModalPosition: React.Dispatch<React.SetStateAction<number | null>>;
  removeCoverMarginArticle: (position: number) => void;
  startEditingCoverMarginContent: (position: number) => void;
  updateCoverMarginDraftContent: (position: number, draftContent: string) => void;
  saveCoverMarginDraftContent: (position: number) => void;
};

export function DataCoverMarginArticlesSection({
  coverMarginMiniatures,
  setCoverMarginArticleModalPosition,
  removeCoverMarginArticle,
  startEditingCoverMarginContent,
  updateCoverMarginDraftContent,
  saveCoverMarginDraftContent,
}: DataCoverMarginArticlesSectionProps) {
  return (
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
  );
}
