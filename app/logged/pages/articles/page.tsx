"use client";

import { FC, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import ArticleMiniature from "./article_components/ArticleMiniature";
import ArticleFilter from "./article_components/ArticleFilter";
import { ArticleService } from "@/app/service/ArticleService";
import { PortalService } from "@/app/service/PortalService";

interface ArticlesContentProps {}

const ArticlesContent: FC<ArticlesContentProps> = ({}) => {
  const searchParams = useSearchParams();
  const portalNamesParam = searchParams.get("portalNames") ?? "";
  const portalNames = portalNamesParam ? portalNamesParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const [allArticles, setAllArticles] = useState<any[]>([]);
  const [portals, setPortals] = useState<{ id: number; name: string }[]>([]);
  const [highlightedByPortal, setHighlightedByPortal] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<number | null>(null);
  const [changeModal, setChangeModal] = useState<{ portalId: number; highlightPosition: string } | null>(null);
  const [changeArticleId, setChangeArticleId] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);

  const fetchArticles = async () => {
    try {
      const [apiArticles, portalsList] = await Promise.all([
        ArticleService.getAllArticles({
          withHighlightInfo: true,
          portalNames: portalNames.length > 0 ? portalNames : undefined,
        }),
        PortalService.getAllPortals(),
      ]);
      const validArticles = Array.isArray(apiArticles)
        ? apiArticles.filter((art: any) => art && art.id_article && art.articleTitle)
        : [];
      setAllArticles(validArticles);
      const plist = Array.isArray(portalsList) ? portalsList.map((p: any) => ({ id: p.id, name: p.name ?? String(p.key ?? p.id) })) : [];
      setPortals(plist);
      if (plist.length > 0 && mainTab === null) setMainTab(plist[0].id);
    } catch (error: unknown) {
      const msg =
        typeof error === "string"
          ? error
          : (error as { message?: string })?.message ||
            (error as { data?: { message?: string } })?.data?.message ||
            ((error as { status?: number })?.status != null ? `HTTP ${(error as { status?: number }).status}` : "Unknown error");
      console.error("Error fetching articles:", msg, error);
      setAllArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHighlightedForPortal = async (portalId: number) => {
    try {
      const rows = await ArticleService.getHighlightedArticlesByPortal(portalId);
      setHighlightedByPortal((prev) => ({ ...prev, [portalId]: Array.isArray(rows) ? rows : [] }));
    } catch {
      setHighlightedByPortal((prev) => ({ ...prev, [portalId]: [] }));
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [portalNamesParam]);

  useEffect(() => {
    portals.forEach((p) => fetchHighlightedForPortal(p.id));
  }, [portals.map((p) => p.id).join(",")]);

  const handleChangeConfirm = async () => {
    if (!changeModal || !changeArticleId.trim()) return;
    setChangeLoading(true);
    try {
      await ArticleService.setHighlightedArticleForPosition(
        changeModal.portalId,
        changeModal.highlightPosition,
        changeArticleId.trim()
      );
      setChangeModal(null);
      setChangeArticleId("");
      await fetchHighlightedForPortal(changeModal.portalId);
      window.location.reload();
    } catch (e: any) {
      alert(e?.message || e?.data?.message || "Error changing article");
    } finally {
      setChangeLoading(false);
    }
  };

  const filteredArticles = allArticles;

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white">
        <p className="text-2xl">Article Management</p>
        <Link
          href="/logged/pages/articles/create"
          className="bg-blue-950 text-white text-xs px-4 py-1 rounded-xl shadow cursor-pointer w-26 mx-auto mt-2 hover:bg-blue-950/80 inline-block"
        >
          Create article
        </Link>
      </div>

      {/* Main Article Management */}
      <div className="px-36 mx-7 mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Main Article Management</h2>
        {portals.length === 0 ? (
          <p className="text-gray-500 text-sm">No portals found.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-2">
              {portals.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setMainTab(p.id)}
                  className={`px-4 py-2 text-sm rounded-lg ${
                    mainTab === p.id ? "bg-blue-950 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            {mainTab != null && (
              <div className="overflow-x-auto border border-gray-300 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                        Highlighted position
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                        Article title
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300" style={{ width: 80 }}>
                        Image
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {["Main article", "Position1", "Position2", "Position3", "Position4", "Position5"].map((pos) => {
                      const row = (highlightedByPortal[mainTab] || []).find((r: any) => r.highlightPosition === pos);
                      return (
                        <tr key={pos}>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">{pos}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                            {row?.articleTitle || "—"}
                          </td>
                          <td className="px-3 py-2 border-b border-gray-200 align-middle" style={{ width: 80, verticalAlign: "middle" }}>
                            {row?.article_main_image_url ? (
                              <img
                                src={row.article_main_image_url}
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
                          <td className="px-4 py-3 border-b border-gray-200">
                            <button
                              type="button"
                              onClick={() => setChangeModal({ portalId: mainTab, highlightPosition: pos })}
                              className="px-3 py-1 text-xs rounded-lg bg-blue-950 text-white hover:bg-blue-950/90"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Change modal */}
      {changeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => !changeLoading && setChangeModal(null)}>
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Change article for {changeModal.highlightPosition}</h3>
            <p className="text-sm text-gray-600 mb-2">Enter the article ID to assign to this position:</p>
            <input
              type="text"
              value={changeArticleId}
              onChange={(e) => setChangeArticleId(e.target.value)}
              placeholder="e.g. article_26_000000001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-950"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !changeLoading && setChangeModal(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChangeConfirm}
                disabled={changeLoading || !changeArticleId.trim()}
                className="px-4 py-2 text-sm bg-blue-950 text-white rounded-lg hover:bg-blue-950/90 disabled:opacity-50"
              >
                {changeLoading ? "Confirming…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Articles */}
      <div className="px-36 mx-7 mt-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">All Articles</h2>
        <ArticleFilter selectedPortalNames={portalNames} />

        <div className="flex flex-wrap py-5 gap-12 justify-center">
          {loading ? (
            <div className="text-center py-10 w-full">
              <p className="text-gray-500">Loading articles...</p>
            </div>
          ) : filteredArticles.filter((a: any) => a && a.id_article && a.articleTitle).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 w-full">
              <p className="text-gray-500 text-lg">No results found for your query</p>
            </div>
          ) : (
            filteredArticles
              .filter((a: any) => a && a.id_article && a.articleTitle)
              .map((a: any, index: number) => (
                <ArticleMiniature
                  key={a.id_article || index}
                  id_article={a.id_article || ""}
                  titulo={a.articleTitle || ""}
                  company={a.company || ""}
                  date={a.date || ""}
                  imageUrl={a.article_main_image_url || ""}
                  highlightByPortal={a.highlightByPortal || []}
                />
              ))
          )}
        </div>
      </div>
    </div>
  );
};

const Articles: FC = () => (
  <Suspense
    fallback={
      <div className="flex flex-col w-full bg-white min-h-[200px] items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }
  >
    <ArticlesContent />
  </Suspense>
);

export default Articles;
