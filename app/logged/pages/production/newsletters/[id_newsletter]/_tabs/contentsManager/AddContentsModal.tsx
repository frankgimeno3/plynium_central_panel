"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { articleInterface } from "@/app/contents/interfaces";
import MediatecaModal from "@/app/logged/logged_components/modals/MediatecaModal";
import ProjectSelectModal, { type ProjectRow } from "@/app/logged/logged_components/modals/ProjectSelectModal";
import { ArticleService } from "@/app/service/ArticleService";
import { PortalService } from "@/app/service/PortalService";
import type { AddContentSelection } from "./addContentTypes";

type PortalOption = { id: number; key: string; name: string };
type ContentMode = "article" | "sponsored" | "banner";

type AddContentsModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (selection: AddContentSelection) => void;
};

function articleSortDate(article: articleInterface): number {
  const value = Date.parse(article.date ?? "");
  return Number.isFinite(value) ? value : 0;
}

export function AddContentsModal({ open, onClose, onAdd }: AddContentsModalProps) {
  const [contentMode, setContentMode] = useState<ContentMode>("article");
  const [portals, setPortals] = useState<PortalOption[]>([]);
  const [selectedPortalId, setSelectedPortalId] = useState("");
  const [articles, setArticles] = useState<articleInterface[]>([]);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [loadingPortals, setLoadingPortals] = useState(false);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mediatecaOpen, setMediatecaOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerMediaId, setBannerMediaId] = useState("");
  const [bannerMediaName, setBannerMediaName] = useState("");
  const [bannerProject, setBannerProject] = useState<ProjectRow | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoadingPortals(true);
    setError(null);
    PortalService.getAllPortals()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setPortals(
          list
            .map((row) => ({
              id: Number((row as { id?: number }).id),
              key: String((row as { key?: string }).key ?? ""),
              name: String((row as { name?: string }).name ?? ""),
            }))
            .filter((row) => Number.isFinite(row.id))
        );
      })
      .catch(() => setPortals([]))
      .finally(() => setLoadingPortals(false));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setContentMode("article");
      setSelectedPortalId("");
      setArticles([]);
      setSelectedArticleIds([]);
      setBannerImageUrl("");
      setBannerMediaId("");
      setBannerMediaName("");
      setBannerProject(null);
      setError(null);
    }
  }, [open]);

  const selectedPortal = useMemo(
    () => portals.find((portal) => String(portal.id) === selectedPortalId) ?? null,
    [portals, selectedPortalId]
  );

  const isArticleMode = contentMode === "article" || contentMode === "sponsored";

  useEffect(() => {
    if (!open || !isArticleMode || !selectedPortal) {
      setArticles([]);
      setSelectedArticleIds([]);
      return;
    }

    setLoadingArticles(true);
    setError(null);
    const portalNames = [selectedPortal.name, selectedPortal.key].filter(Boolean);
    ArticleService.getAllArticles({ portalNames })
      .then((data) => {
        const rows = Array.isArray(data) ? (data as articleInterface[]) : [];
        rows.sort((a, b) => articleSortDate(a) - articleSortDate(b));
        setArticles(rows);
      })
      .catch((loadError: unknown) => {
        setArticles([]);
        setError(loadError instanceof Error ? loadError.message : "Failed to load articles");
      })
      .finally(() => setLoadingArticles(false));
  }, [open, isArticleMode, selectedPortal]);

  const toggleArticle = (articleId: string) => {
    setSelectedArticleIds((prev) =>
      prev.includes(articleId) ? prev.filter((id) => id !== articleId) : [...prev, articleId]
    );
  };

  const handleConfirm = () => {
    if (contentMode === "banner") {
      if (!bannerImageUrl || !bannerProject) return;
      onAdd({
        kind: "banner",
        imageUrl: bannerImageUrl,
        mediaId: bannerMediaId,
        mediaName: bannerMediaName,
        project: bannerProject,
      });
      onClose();
      return;
    }

    const selected = articles.filter((article) => selectedArticleIds.includes(article.id_article));
    if (selected.length === 0) return;
    onAdd({
      kind: contentMode === "sponsored" ? "sponsored" : "article",
      articles: selected,
    });
    onClose();
  };

  const canConfirm =
    contentMode === "banner"
      ? Boolean(bannerImageUrl && bannerProject)
      : selectedArticleIds.length > 0;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
          <div className="border-b border-gray-200 px-5 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Add contents</h3>
            <p className="text-sm text-gray-500">
              Choose a content type, then select articles or a mediateca banner with a project.
            </p>
          </div>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">Content type</label>
              <select
                value={contentMode}
                onChange={(event) => {
                  const value = event.target.value;
                  setContentMode(
                    value === "banner" || value === "sponsored" ? value : "article"
                  );
                  setSelectedArticleIds([]);
                  setError(null);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="article">Article</option>
                <option value="sponsored">Sponsored content</option>
                <option value="banner">Banner</option>
              </select>
            </div>

            {isArticleMode ? (
              <>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Portal</label>
                  <select
                    value={selectedPortalId}
                    onChange={(event) => setSelectedPortalId(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={loadingPortals}
                  >
                    <option value="">Select a portal</option>
                    {portals.map((portal) => (
                      <option key={portal.id} value={String(portal.id)}>
                        {portal.key || portal.name || portal.id}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPortal ? (
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-900">Articles (oldest to newest)</p>
                    {loadingArticles ? (
                      <p className="text-sm text-gray-500">Loading articles…</p>
                    ) : articles.length === 0 ? (
                      <p className="text-sm text-gray-500">No articles found for this portal.</p>
                    ) : (
                      <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2">
                        {articles.map((article) => (
                          <label
                            key={article.id_article}
                            className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-100 p-2 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedArticleIds.includes(article.id_article)}
                              onChange={() => toggleArticle(article.id_article)}
                              className="mt-1"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">{article.articleTitle}</p>
                              <p className="text-xs text-gray-500">{article.articleSubtitle}</p>
                              <p className="text-xs text-gray-400">{article.date}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Banner image</p>
                  <p className="text-xs text-gray-500">Pick an image from the mediateca.</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {bannerImageUrl ? (
                      <img
                        src={bannerImageUrl}
                        alt={bannerMediaName || "Selected banner"}
                        className="h-20 w-32 rounded object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="flex h-20 w-32 items-center justify-center rounded border border-dashed border-gray-300 text-xs text-gray-500">
                        No image
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setMediatecaOpen(true)}
                      className="px-3 py-2 text-sm font-medium text-blue-950 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      Select from mediateca
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">Project</p>
                  <p className="text-xs text-gray-500">Associate the banner with a project from contacts DB.</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                      {bannerProject ? (
                        <>
                          <p className="font-medium text-gray-900">{bannerProject.title}</p>
                          <p className="text-xs font-mono text-gray-500">{bannerProject.id_project}</p>
                        </>
                      ) : (
                        <p className="text-gray-500">No project selected</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setProjectModalOpen(true)}
                      className="px-3 py-2 text-sm font-medium text-blue-950 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      Select project
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add selected
            </button>
          </div>
        </div>
      </div>

      <MediatecaModal
        open={mediatecaOpen}
        onClose={() => setMediatecaOpen(false)}
        onSelectImage={(imageUrl, content) => {
          setBannerImageUrl(imageUrl);
          setBannerMediaId(content?.id ?? "");
          setBannerMediaName(content?.name ?? decodeURIComponent(imageUrl.split("/").pop() ?? "Banner"));
          setMediatecaOpen(false);
        }}
      />

      <ProjectSelectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        currentProjectId={bannerProject?.id_project ?? null}
        onSelectProject={(project) => {
          setBannerProject(project);
          setProjectModalOpen(false);
        }}
      />
    </>
  );
}
