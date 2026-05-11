"use client";

import type { ArticleFilterState, ArticleRelateRow } from "./types";

type Props = {
  articleFilter: ArticleFilterState;
  onArticleFilterChange: (next: ArticleFilterState) => void;
  filteredArticles: ArticleRelateRow[];
  selectedArticle: ArticleRelateRow | null;
  onSelectArticleRow: (article: ArticleRelateRow | null) => void;
  onBack: () => void;
  onCancel: () => void;
  onRelate: () => void;
  currentArticleId?: string | null;
};

export function ArticleRelatePhase3({
  articleFilter,
  onArticleFilterChange,
  filteredArticles,
  selectedArticle,
  onSelectArticleRow,
  onBack,
  onCancel,
  onRelate,
  currentArticleId = null,
}: Props) {
  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          value={articleFilter.id}
          onChange={(e) => onArticleFilterChange({ ...articleFilter, id: e.target.value })}
          placeholder="Filter by article ID"
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
        />
        <input
          type="text"
          value={articleFilter.title}
          onChange={(e) => onArticleFilterChange({ ...articleFilter, title: e.target.value })}
          placeholder="Filter by article title"
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
        />
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-medium text-gray-600 mb-2">Publication date</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(["from", "to"] as const).map((side) => (
            <div key={side} className="flex items-center gap-2">
              <span className="w-10 text-xs uppercase text-gray-500">{side}</span>
              {(["day", "month", "year"] as const).map((part) => (
                <input
                  key={part}
                  type="text"
                  inputMode="numeric"
                  value={articleFilter[side][part]}
                  onChange={(e) =>
                    onArticleFilterChange({
                      ...articleFilter,
                      [side]: { ...articleFilter[side], [part]: e.target.value.replace(/\D/g, "") },
                    })
                  }
                  placeholder={part === "day" ? "dd" : part === "month" ? "mm" : "yyyy"}
                  maxLength={part === "year" ? 4 : 2}
                  className="w-16 px-2 py-2 text-sm border border-gray-300 rounded-lg"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[240px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Article ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredArticles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                  No articles found for this company and portal.
                </td>
              </tr>
            ) : (
              filteredArticles.map((article) => {
                const selected = selectedArticle?.id_article === article.id_article;
                return (
                  <tr
                    key={article.id_article}
                    onClick={() => onSelectArticleRow(article)}
                    className={`cursor-pointer ${selected ? "bg-blue-100" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-3 py-2">
                      {article.article_main_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote article thumbnails
                        <img
                          src={article.article_main_image_url}
                          alt=""
                          className="w-12 h-12 object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{article.articleTitle || "—"}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{article.id_article}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{article.date || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center border-t border-gray-200 pt-3">
        <button type="button" onClick={onBack} className="text-sm text-gray-600 hover:text-gray-900">
          Back
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedArticle}
            onClick={onRelate}
            className="px-4 py-2 text-sm rounded-lg bg-blue-950 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentArticleId && selectedArticle?.id_article === currentArticleId
              ? "Keep selected article"
              : "Relate article"}
          </button>
        </div>
      </div>
    </div>
  );
}
