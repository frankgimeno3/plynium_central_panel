"use client";

import { FC, useEffect, useState, useCallback } from "react";
import { ArticleService } from "@/app/service/ArticleService";

const HIGHLIGHT_POSITIONS = ["Main article", "Position1", "Position2", "Position3", "Position4", "Position5"];

const POSITION_BUTTON_LABELS: Record<string, string> = {
  "Main article": "Main Article",
  Position1: "1",
  Position2: "2",
  Position3: "3",
  Position4: "4",
  Position5: "5",
};

type FilterType = "date" | "title" | "company";

function isValidDdMmYy(value: string): boolean {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (!match) return false;
  const [, d, m, y] = match;
  const day = parseInt(d!, 10);
  const month = parseInt(m!, 10);
  const year = 2000 + parseInt(y!, 10);
  if (month < 1 || month > 12) return false;
  const lastDay = new Date(year, month, 0).getDate();
  return day >= 1 && day <= lastDay;
}

function ddMmYyToIso(value: string): string {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (!match) return "";
  const [, d, m, y] = match;
  const day = d!.padStart(2, "0");
  const month = m!.padStart(2, "0");
  const year = parseInt(y!, 10) >= 50 ? `19${y}` : `20${y}`;
  return `${year}-${month}-${day}`;
}

export interface HighlightRow {
  highlightPosition: string;
  articleId: string;
  articleTitle?: string;
  article_main_image_url?: string;
}

export interface ArticleForModal {
  id_article: string;
  articleTitle: string;
  company: string;
  date: string;
  article_main_image_url?: string;
}

interface SelectArticleModalProps {
  portalId: number;
  portalName: string;
  targetPosition: string;
  highlightedRowsForPortal: HighlightRow[];
  onClose: () => void;
  onSuccess: () => void;
}

export const SelectArticleModal: FC<SelectArticleModalProps> = ({
  portalId,
  portalName,
  targetPosition,
  highlightedRowsForPortal,
  onClose,
  onSuccess,
}) => {
  const [articles, setArticles] = useState<ArticleForModal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("date");
  const [filterValue, setFilterValue] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState<{ fromPosition: string; toPosition: string } | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const articleIdToPosition = new Map<string, string>();
  highlightedRowsForPortal.forEach((r) => {
    if (r.articleId) articleIdToPosition.set(r.articleId, r.highlightPosition);
  });

  const getHighlightLabel = (articleId: string): string => {
    return articleIdToPosition.get(articleId) ?? "No";
  };

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const apiArticles = await ArticleService.getAllArticles({
        withHighlightInfo: true,
        portalNames: [portalName],
      });
      const list = Array.isArray(apiArticles)
        ? apiArticles.filter((a: any) => a && a.id_article && a.articleTitle)
        : [];
      setArticles(list);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [portalName]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const isDateRangeValid =
    dateFrom.trim() !== "" &&
    dateTo.trim() !== "" &&
    isValidDdMmYy(dateFrom) &&
    isValidDdMmYy(dateTo);

  const filteredAndSorted = (() => {
    let list = articles;
    if (selectedFilter === "title" && filterValue.trim()) {
      const q = filterValue.trim().toLowerCase();
      list = list.filter((a) => (a.articleTitle || "").toLowerCase().includes(q));
    } else if (selectedFilter === "company" && filterValue.trim()) {
      const q = filterValue.trim().toLowerCase();
      list = list.filter((a) => (a.company || "").toLowerCase().includes(q));
    } else if (selectedFilter === "date" && isDateRangeValid) {
      const fromIso = ddMmYyToIso(dateFrom);
      const toIso = ddMmYyToIso(dateTo);
      list = list.filter((a) => {
        const d = (a.date || "").slice(0, 10);
        return d >= fromIso && d <= toIso;
      });
    }
    const positionOrder = HIGHLIGHT_POSITIONS;
    return [...list].sort((a, b) => {
      const posA = articleIdToPosition.get(a.id_article);
      const posB = articleIdToPosition.get(b.id_article);
      const idxA = posA ? positionOrder.indexOf(posA) : 999;
      const idxB = posB ? positionOrder.indexOf(posB) : 999;
      if (idxA !== idxB) return idxA - idxB;
      return 0;
    });
  })();

  const handleSelectPosition = (position: string) => {
    if (!selectedArticleId) return;
    const currentPos = articleIdToPosition.get(selectedArticleId);
    if (currentPos && currentPos !== position) {
      setConfirmReplace({ fromPosition: currentPos, toPosition: position });
      return;
    }
    doSetPosition(position);
  };

  const doSetPosition = async (position: string) => {
    if (!selectedArticleId) return;
    setSubmitLoading(true);
    try {
      await ArticleService.setHighlightedArticleForPosition(
        portalId,
        position,
        selectedArticleId
      );
      setConfirmReplace(null);
      onSuccess();
    } catch (e: any) {
      alert(e?.message || e?.data?.message || "Error updating position");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleConfirmReplace = () => {
    if (!selectedArticleId || !confirmReplace) return;
    doSetPosition(confirmReplace.toPosition);
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    const parts = d.slice(0, 10).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
    return d;
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="select-article-modal-title"
      >
        <div
          className="bg-white rounded-xl shadow-xl flex flex-col max-w-4xl w-full mx-4 max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 id="select-article-modal-title" className="text-xl font-semibold text-gray-900">
              Change article for {targetPosition} — {portalName}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 overflow-auto flex-1">
            {/* Filter */}
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3">Filter</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {(["date", "title", "company"] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setSelectedFilter(f);
                      setFilterValue("");
                      setDateFrom("");
                      setDateTo("");
                    }}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      selectedFilter === f
                        ? "bg-blue-950 text-white border-blue-950"
                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {f === "date" ? "By date" : f === "title" ? "By title" : "By company"}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedFilter === "date" && (
                  <>
                    <input
                      type="text"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      placeholder="dd/mm/yy"
                      maxLength={8}
                      className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20"
                    />
                    <span className="text-gray-500 text-sm">to</span>
                    <input
                      type="text"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      placeholder="dd/mm/yy"
                      maxLength={8}
                      className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20"
                    />
                  </>
                )}
                {selectedFilter === "title" && (
                  <input
                    type="text"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder="Type a title to filter"
                    className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20"
                  />
                )}
                {selectedFilter === "company" && (
                  <input
                    type="text"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder="Type a company to filter"
                    className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950/20"
                  />
                )}
              </div>
            </div>

            {/* Table */}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              {loading ? (
                <div className="py-12 text-center text-gray-500">Loading articles...</div>
              ) : filteredAndSorted.length === 0 ? (
                <div className="py-12 text-center text-gray-500">No articles match the filter.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Image</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Highlighted position?</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSorted.map((a) => {
                      const isSelected = a.id_article === selectedArticleId;
                      const posLabel = getHighlightLabel(a.id_article);
                      return (
                        <tr
                          key={a.id_article}
                          onClick={() => setSelectedArticleId(a.id_article)}
                          className={`cursor-pointer transition-colors ${isSelected ? "bg-blue-100" : "hover:bg-gray-50"}`}
                        >
                          <td className="px-3 py-2 align-middle w-20">
                            {a.article_main_image_url ? (
                              <img
                                src={a.article_main_image_url}
                                alt=""
                                className="w-14 h-14 object-cover rounded border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{a.articleTitle || "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{a.company || "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(a.date)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{posLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Select for target position + Cancel */}
            {selectedArticleId && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectPosition(targetPosition)}
                  disabled={submitLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-950 text-white hover:bg-blue-950/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {targetPosition === "Main article"
                    ? "Select as Main Article"
                    : `Select as position ${POSITION_BUTTON_LABELS[targetPosition] ?? targetPosition}`}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm replace modal */}
      {confirmReplace && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => setConfirmReplace(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm change</h3>
            <p className="text-sm text-gray-600 mb-4">
              Alert, this change will make the former article in position &quot;{confirmReplace.fromPosition}&quot; to become a
              non-highlighted article. Are you sure you want to change it?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmReplace(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReplace}
                disabled={submitLoading}
                className="px-4 py-2 text-sm bg-blue-950 text-white rounded-lg hover:bg-blue-950/90 disabled:opacity-50"
              >
                {submitLoading ? "Confirming…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SelectArticleModal;
