"use client";

import React, { FC, use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import MediatecaModal from "@/app/logged/logged_components/modals/MediatecaModal";
import ArticleRelateModal, {
  type ArticleRelateRow,
} from "@/app/logged/logged_components/modals/ArticleRelateModal";
import ProjectSelectModal, {
  type ProjectRow,
} from "@/app/logged/logged_components/modals/ProjectSelectModal";
import { magazinePublicationMediaLibraryPath } from "@/app/contents/mediatecaPaths";

type SlotRow = {
  publication_slot_id: number;
  publication_id: string | null;
  publication_format: string;
  slot_key: string;
  slot_content_type: string;
  slot_state: string;
  customer_id: string | null;
  project_id: string | null;
  slot_media_url: string | null;
  slot_article_id: string | null;
  slot_created_at: string | null;
  slot_updated_at: string | null;
};

type SlotContentRow = {
  publication_slot_content_id: number;
  publication_id: string;
  publication_slot_id: number;
  publication_slot_position: number;
  slot_content_format: string;
  slot_content_object_array: unknown[];
  article_id: string | null;
};

type PublicationDbRow = {
  publication_id: string;
  publication_edition_name: string;
  publication_main_image_url: string;
};

type ProjectDetail = {
  id_project: string;
  id_contract: string;
  title: string;
  status: string;
  service: string;
  publication_date: string | null;
  publication_id: string | null;
};

type CustomerDetail = {
  id_customer: string;
  name: string;
};

const BASE = "/logged/pages/production/publications";
const COVER_SLOT_KEY = "cover";
const COVER_SLOT_POSITION = -1;
const REGULAR_SLOT_POSITION = 0;
const DEFAULT_ARTICLE_EDITOR = "magazine";
const LOCKED_ADVERT_SLOT_KEYS = new Set(["cover", "inside_cover", "inside cover", "end", "end_page", "end page"]);
const SUMMARY_INDEX_SLOT_KEYS = new Set(["2", "4", "6", "8"]);

const SLOT_CONTENT_TYPE_OPTIONS = ["advert", "article", "summary", "index"] as const;
type SlotContentTypeOption = (typeof SLOT_CONTENT_TYPE_OPTIONS)[number];
const DEFAULT_SLOT_CONTENT_TYPE: SlotContentTypeOption = "advert";

function normalizeSlotContentType(value: string | null | undefined): SlotContentTypeOption {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  return (SLOT_CONTENT_TYPE_OPTIONS as readonly string[]).includes(v)
    ? (v as SlotContentTypeOption)
    : DEFAULT_SLOT_CONTENT_TYPE;
}

function numericSlotKey(slotKey: string | null | undefined): number | null {
  const n = Number(String(slotKey ?? "").trim());
  return Number.isInteger(n) && n >= 1 ? n : null;
}

function allowedSlotContentTypes(slotKey: string | null | undefined): SlotContentTypeOption[] {
  const key = String(slotKey ?? "").trim().toLowerCase();
  if (LOCKED_ADVERT_SLOT_KEYS.has(key)) return ["advert"];
  const numeric = numericSlotKey(key);
  if (numeric != null && numeric >= 1 && numeric <= 9) {
    return SUMMARY_INDEX_SLOT_KEYS.has(String(numeric))
      ? ["advert", "summary", "index"]
      : ["advert"];
  }
  return ["advert", "article"];
}

function pickFirstUrl(objects: unknown[]): string | null {
  if (!Array.isArray(objects)) return null;
  for (const obj of objects) {
    if (obj && typeof obj === "object" && "url" in obj) {
      const url = (obj as { url?: unknown }).url;
      if (typeof url === "string" && url) return url;
    }
  }
  return null;
}

const SlotDetailPage: FC<{ params: Promise<{ id_publication: string; slot_id: string }> }> = ({
  params,
}) => {
  const { id_publication, slot_id } = use(params);
  const slotIdNum = Number(slot_id);
  const { setPageMeta } = usePageContent();

  const [slot, setSlot] = useState<SlotRow | null>(null);
  const [contents, setContents] = useState<SlotContentRow[]>([]);
  const [publication, setPublication] = useState<PublicationDbRow | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeSaving, setTypeSaving] = useState(false);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [mediatecaOpen, setMediatecaOpen] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [articleSaving, setArticleSaving] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);

  const isCoverSlot = slot?.slot_key === COVER_SLOT_KEY;
  const advertPosition = isCoverSlot ? COVER_SLOT_POSITION : REGULAR_SLOT_POSITION;

  /** Image rendered in the advert preview: comes from publication_slot_content. */
  const advertImageUrl = useMemo(() => {
    const matching = contents.find(
      (c) =>
        Number(c.publication_slot_position) === Number(advertPosition) &&
        String(c.slot_content_format).toLowerCase() === "advert"
    );
    if (matching) {
      const url = pickFirstUrl(matching.slot_content_object_array || []);
      if (url) return url;
    }
    // Cover slot: fall back to publications_db.publication_main_image_url for
    // historical rows that were saved before the slot_content sync existed.
    if (isCoverSlot && publication?.publication_main_image_url) {
      return publication.publication_main_image_url;
    }
    return null;
  }, [contents, advertPosition, isCoverSlot, publication?.publication_main_image_url]);

  const relatedArticleId = useMemo(() => {
    if (slot?.slot_article_id) return slot.slot_article_id;
    const articleContent = contents.find((c) => c.article_id);
    return articleContent?.article_id ?? null;
  }, [contents, slot?.slot_article_id]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [slotRes, contentRes, pubRes] = await Promise.all([
        fetch(`/api/v1/publication-slots/${slotIdNum}`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(
          `/api/v1/publications-db/${encodeURIComponent(id_publication)}/slots/${slotIdNum}/contents`,
          { cache: "no-store", credentials: "include" }
        ),
        fetch(`/api/v1/publications-db/${encodeURIComponent(id_publication)}`, {
          cache: "no-store",
          credentials: "include",
        }),
      ]);
      if (!slotRes.ok) throw new Error("Failed to load slot");
      const slotData = (await slotRes.json()) as SlotRow;
      const contentData = contentRes.ok ? ((await contentRes.json()) as SlotContentRow[]) : [];
      const pubData = pubRes.ok ? ((await pubRes.json()) as PublicationDbRow) : null;

      setSlot(slotData);
      setContents(Array.isArray(contentData) ? contentData : []);
      setPublication(pubData);

      // Hydrate project + customer details for the header summary.
      const projectId = slotData?.project_id ? String(slotData.project_id) : "";
      if (projectId) {
        try {
          const prRes = await fetch(`/api/v1/projects/${encodeURIComponent(projectId)}`, {
            cache: "no-store",
            credentials: "include",
          });
          setProject(prRes.ok ? ((await prRes.json()) as ProjectDetail) : null);
        } catch {
          setProject(null);
        }
      } else {
        setProject(null);
      }

      const customerId = slotData?.customer_id ? String(slotData.customer_id) : "";
      if (customerId) {
        try {
          const cuRes = await fetch(`/api/v1/customers/${encodeURIComponent(customerId)}`, {
            cache: "no-store",
            credentials: "include",
          });
          setCustomer(cuRes.ok ? ((await cuRes.json()) as CustomerDetail) : null);
        } catch {
          setCustomer(null);
        }
      } else {
        setCustomer(null);
      }
    } catch (e: unknown) {
      setSlot(null);
      setContents([]);
      setPublication(null);
      setProject(null);
      setCustomer(null);
      setError((e as Error)?.message ?? "Failed to load slot");
    } finally {
      setLoading(false);
    }
  }, [id_publication, slotIdNum]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const label = slot ? `Slot ${slot.slot_key}` : `Slot #${slotIdNum}`;
    setPageMeta({
      pageTitle: label,
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: `${BASE}/issues` },
        { label: "Issues", href: `${BASE}/issues` },
        { label: id_publication, href: `${BASE}/${encodeURIComponent(id_publication)}` },
        { label },
      ],
      buttons: [{ label: "Back to Flatplan", href: `${BASE}/${encodeURIComponent(id_publication)}` }],
    });
  }, [setPageMeta, slot, slotIdNum, id_publication]);

  const patchSlot = useCallback(
    async (patch: Record<string, unknown>) => {
      const res = await fetch(`/api/v1/publication-slots/${slotIdNum}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Failed to update slot");
      }
      return (await res.json()) as SlotRow;
    },
    [slotIdNum]
  );

  const handleTypeChange = useCallback(
    async (nextType: SlotContentTypeOption) => {
      if (!slot) return;
      const previous = normalizeSlotContentType(slot.slot_content_type);
      if (previous === nextType) return;
      const allowedTypes = allowedSlotContentTypes(slot.slot_key);
      if (!allowedTypes.includes(nextType)) {
        setTypeError(`Type '${nextType}' is not allowed for slot ${slot.slot_key}.`);
        return;
      }
      setTypeError(null);
      setTypeSaving(true);
      setSlot((prev) => (prev ? { ...prev, slot_content_type: nextType } : prev));
      try {
        const updated = await patchSlot({ slot_content_type: nextType });
        setSlot(updated);
      } catch (e: unknown) {
        setTypeError((e as Error)?.message ?? "Failed to update type");
        setSlot((prev) => (prev ? { ...prev, slot_content_type: previous } : prev));
      } finally {
        setTypeSaving(false);
      }
    },
    [slot, patchSlot]
  );

  const handleProjectSelected = useCallback(
    async (selected: ProjectRow) => {
      setProjectError(null);
      setProjectSaving(true);
      try {
        const updated = await patchSlot({ project_id: selected.id_project });
        setSlot(updated);
        await load();
      } catch (e: unknown) {
        setProjectError((e as Error)?.message ?? "Failed to assign project");
      } finally {
        setProjectSaving(false);
      }
    },
    [patchSlot, load]
  );

  const handleProjectClear = useCallback(async () => {
    if (!slot?.project_id) return;
    setProjectError(null);
    setProjectSaving(true);
    try {
      const updated = await patchSlot({ project_id: null });
      setSlot(updated);
      await load();
    } catch (e: unknown) {
      setProjectError((e as Error)?.message ?? "Failed to clear project");
    } finally {
      setProjectSaving(false);
    }
  }, [slot?.project_id, patchSlot, load]);

  const handleAdvertImageSelected = useCallback(
    async (imageUrl: string) => {
      if (!imageUrl || !slot) return;
      setImageError(null);
      setImageSaving(true);
      try {
        const res = await fetch(
          `/api/v1/publications-db/${encodeURIComponent(id_publication)}/slots/${slotIdNum}/contents`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              image_url: imageUrl,
              slot_content_format: "advert",
              publication_slot_position: advertPosition,
            }),
          }
        );
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || "Failed to save image");
        }
        await load();
      } catch (e: unknown) {
        setImageError((e as Error)?.message ?? "Failed to save image");
      } finally {
        setImageSaving(false);
      }
    },
    [id_publication, slotIdNum, slot, advertPosition, load]
  );

  const handleAdvertImageClear = useCallback(async () => {
    if (imageSaving) return;
    setImageError(null);
    setImageSaving(true);
    try {
      const res = await fetch(
        `/api/v1/publications-db/${encodeURIComponent(id_publication)}/slots/${slotIdNum}/contents?publication_slot_position=${advertPosition}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Failed to clear image");
      }
      await load();
    } catch (e: unknown) {
      setImageError((e as Error)?.message ?? "Failed to clear image");
    } finally {
      setImageSaving(false);
    }
  }, [id_publication, slotIdNum, advertPosition, imageSaving, load]);

  const handleArticleSelected = useCallback(
    async (article: ArticleRelateRow) => {
      if (!article?.id_article) return;
      setArticleError(null);
      setArticleSaving(true);
      try {
        const res = await fetch(
          `/api/v1/publications-db/${encodeURIComponent(id_publication)}/slots/${slotIdNum}/contents`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              article_id: article.id_article,
              slot_content_format: "article",
              publication_slot_position: REGULAR_SLOT_POSITION,
            }),
          }
        );
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || "Failed to relate article");
        }
        setArticleModalOpen(false);
        await load();
      } catch (e: unknown) {
        setArticleError((e as Error)?.message ?? "Failed to relate article");
      } finally {
        setArticleSaving(false);
      }
    },
    [id_publication, slotIdNum, load]
  );

  if (loading) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Loading slot…</div>
      </PageContentSection>
    );
  }

  if (!slot) {
    return (
      <PageContentSection>
        <div className="p-6 text-center">
          <p className="text-gray-600">{error ?? "Slot not found."}</p>
          <Link
            href={`${BASE}/${encodeURIComponent(id_publication)}`}
            className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Flatplan
          </Link>
        </div>
      </PageContentSection>
    );
  }

  const allowedTypes = allowedSlotContentTypes(slot.slot_key);
  const storedType = normalizeSlotContentType(slot.slot_content_type);
  const currentType = allowedTypes.includes(storedType) ? storedType : "advert";
  const typeSelectLocked = allowedTypes.length === 1;
  const invalidStoredType = storedType !== currentType;
  const articleEditorHref = `${BASE}/${encodeURIComponent(id_publication)}/slots/${encodeURIComponent(
    String(slotIdNum)
  )}/article_editor/${encodeURIComponent(DEFAULT_ARTICLE_EDITOR)}`;
  const mediatecaPath = magazinePublicationMediaLibraryPath(
    publication?.publication_edition_name ?? ""
  );

  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase">Slot key</p>
                <p className="font-medium text-gray-900">{slot.slot_key}</p>
                <p className="text-xs text-gray-400 mt-0.5">#{slot.publication_slot_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Type</p>
                <select
                  value={currentType}
                  onChange={(e) =>
                    void handleTypeChange(e.target.value as SlotContentTypeOption)
                  }
                  disabled={typeSaving || typeSelectLocked}
                  className="mt-1 w-full max-w-xs px-2 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {allowedTypes.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {typeSelectLocked ? (
                  <p className="mt-1 text-xs text-gray-500">
                    This slot type is locked by its slot key.
                  </p>
                ) : null}
                {invalidStoredType ? (
                  <p className="mt-1 text-xs text-amber-700">
                    Saved type "{storedType}" is not allowed here; the UI treats it as advert.
                  </p>
                ) : null}
                {typeError ? (
                  <p className="mt-1 text-xs text-red-600">{typeError}</p>
                ) : null}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">State</p>
                <p className="text-gray-800">{slot.slot_state || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Customer</p>
                <p className="text-gray-800 text-sm">
                  {customer?.name ? customer.name : "—"}
                </p>
                <p className="text-xs font-mono text-gray-500">{slot.customer_id ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Project</p>
                <div className="mt-1 flex flex-col gap-1">
                  {slot.project_id ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm">
                      <p className="font-medium text-gray-800">
                        {project?.title?.trim() ? project.title : "—"}
                      </p>
                      <p className="text-xs font-mono text-gray-500">{slot.project_id}</p>
                      {project?.id_contract ? (
                        <p className="text-[10px] uppercase tracking-wide text-gray-500 mt-1">
                          Contract:{" "}
                          <span className="font-mono text-gray-700 normal-case">
                            {project.id_contract}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No project assigned</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setProjectModalOpen(true)}
                      disabled={projectSaving}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {slot.project_id ? "Change project" : "Select project"}
                    </button>
                    {slot.project_id ? (
                      <button
                        type="button"
                        onClick={handleProjectClear}
                        disabled={projectSaving}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  {projectError ? (
                    <p className="text-xs text-red-600">{projectError}</p>
                  ) : null}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Article</p>
                <div className="mt-1 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setArticleModalOpen(true)}
                    disabled={articleSaving}
                    className="w-fit px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {articleSaving ? "Saving..." : "Relate to article"}
                  </button>
                  <p className="text-xs font-mono text-gray-500">
                    {relatedArticleId ?? "No article related"}
                  </p>
                  {articleError ? (
                    <p className="text-xs text-red-600">{articleError}</p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Preview area changes shape based on the slot content type. */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">Preview</p>
                <span className="text-xs text-gray-500">Type: {currentType}</span>
              </div>

              {currentType === "advert" ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 flex flex-col items-center gap-4">
                  <div className="w-full max-w-sm aspect-[4/5] rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                    {advertImageUrl ? (
                      <img
                        src={advertImageUrl}
                        alt="Advert preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-sm text-gray-400">No advert image yet</span>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full max-w-sm">
                    <button
                      type="button"
                      onClick={() => setMediatecaOpen(true)}
                      disabled={imageSaving}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/50 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {imageSaving ? "Saving…" : "Update image"}
                    </button>
                    {advertImageUrl ? (
                      <button
                        type="button"
                        onClick={handleAdvertImageClear}
                        disabled={imageSaving}
                        className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Clear image
                      </button>
                    ) : null}
                    {imageError ? (
                      <p className="text-xs text-red-600 text-center" role="alert">
                        {imageError}
                      </p>
                    ) : null}
                    <p className="text-[11px] text-gray-500 text-center">
                      Saved as <span className="font-mono">advert</span> at slot position{" "}
                      <span className="font-mono">{advertPosition}</span>.
                    </p>
                  </div>
                </div>
              ) : null}

              {currentType === "article" ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 flex flex-col items-center gap-4 text-center">
                  <p className="text-sm text-gray-700 max-w-md">
                    This slot will host a magazine article. Click below to open the article
                    editor.
                  </p>
                  <Link
                    href={articleEditorHref}
                    className="px-5 py-2.5 rounded-xl bg-blue-950 text-white font-semibold text-sm hover:bg-blue-900"
                  >
                    Open article editor
                  </Link>
                  <p className="text-[11px] text-gray-500 font-mono">{articleEditorHref}</p>
                </div>
              ) : null}

              {currentType === "summary" ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                  This slot is reserved for the magazine <strong>summary</strong>. No advert
                  preview is available.
                </div>
              ) : null}

              {currentType === "index" ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                  This slot is reserved for the advertiser <strong>index</strong>. No advert
                  preview is available.
                </div>
              ) : null}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Slot contents</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Position
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Format
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Object array (JSON)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-6 text-center text-sm text-gray-500"
                        >
                          No content entries found for this slot.
                        </td>
                      </tr>
                    ) : (
                      contents.map((c) => (
                        <tr key={c.publication_slot_content_id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {c.publication_slot_position}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {c.slot_content_format || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-[260px]">
                              {JSON.stringify(c.slot_content_object_array ?? [], null, 2)}
                            </pre>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProjectSelectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSelectProject={(p) => {
          setProjectModalOpen(false);
          void handleProjectSelected(p);
        }}
        currentProjectId={slot.project_id ?? null}
      />

      <MediatecaModal
        open={mediatecaOpen}
        onClose={() => setMediatecaOpen(false)}
        onSelectImage={(imageUrl) => {
          setMediatecaOpen(false);
          void handleAdvertImageSelected(imageUrl);
        }}
        initialPath={mediatecaPath}
      />

      <ArticleRelateModal
        open={articleModalOpen}
        onClose={() => setArticleModalOpen(false)}
        onSelectArticle={(article) => void handleArticleSelected(article)}
        currentArticleId={relatedArticleId}
      />
    </PageContentSection>
  );
};

export default SlotDetailPage;
