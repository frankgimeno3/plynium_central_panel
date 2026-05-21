"use client";

import React, { FC, use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import MediatecaModal from "@/app/logged/logged_components/modals/MediatecaModal";
import ArticleRelateModal, {
  type ArticleRelateRow,
} from "@/app/logged/logged_components/modals/ArticleRelateModal";
import ProjectSelectModal, {
  type ProjectRow,
} from "@/app/logged/logged_components/modals/ProjectSelectModal";
import {
  advertSlotMaterialsMediatecaPath,
  articleSlotMaterialsMediatecaPath,
  coverAdvertMaterialsMediatecaPath,
} from "@/app/contents/mediatecaPaths";
import { FlatplanBulkDeleteModal } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/FlatplanTab/flatplan_tab_components/FlatplanBulkDeleteModal";
import {
  articleBuilderHref,
  findPublicationArticleForSlot,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/articleBuilderNavigation";
import { SlotArticlePreviewSection } from "./slot_detail_components/SlotArticlePreviewSection";
import {
  DEFAULT_SLOT_CONTENT_TYPE,
  effectiveSlotTableContentTypes,
  flatplanEntryKeyFromSlot,
  isFlatplanSlotBulkDeletable,
  isPaddingSlot,
  normalizeSlotContentType,
  type SlotContentTypeOption,
  SLOT_CONTENT_TYPE_OPTIONS,
  type SlotRow,
} from "@/app/logged/pages/production/publications/publication_components/_shared";
import { isPdfMediaUrl } from "@/lib/media/isPdfMediaUrl";

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

/** Shape returned by `GET /api/v1/articles/:id` (see ArticleService.toApiArticle). */
type RelatedArticleApi = {
  id_article: string;
  articleTitle?: string;
  articleSubtitle?: string | null;
  article_main_image_url?: string | null;
  company?: string;
  article_company_names_array?: string[];
  article_company_id_array?: string[];
  date?: string | null;
  is_article_event?: boolean;
  event_id?: string;
};

const ARTICLE_NETWORK_BASE = "/logged/pages/network/contents/articles";
const BASE = "/logged/pages/production/publications/issues";
const COVER_SLOT_KEY = "cover";
const COVER_SLOT_POSITION = -1;
const REGULAR_SLOT_POSITION = 0;

/** Type dropdown value while `slot_state` is padding — not a saved `slot_content_type` until user picks advert/article. */
const TYPE_SELECT_PENDING_PLACEHOLDER = "pending";

function pickFirstUrl(objects: unknown[]): string | null {
  if (!Array.isArray(objects)) return null;
  for (const obj of objects) {
    if (obj && typeof obj === "object") {
      // New Contents Manager shape uses `advert_media_src`; legacy rows used
      // `url`. Honour both so the preview keeps working across the migration.
      const advertSrc = (obj as { advert_media_src?: unknown }).advert_media_src;
      if (typeof advertSrc === "string" && advertSrc) return advertSrc;
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
  const router = useRouter();
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
  const [relatedArticleDetail, setRelatedArticleDetail] = useState<RelatedArticleApi | null>(null);
  const [relatedArticleDetailLoading, setRelatedArticleDetailLoading] = useState(false);
  const [relatedArticleDetailError, setRelatedArticleDetailError] = useState<string | null>(null);
  const [linkedPublicationArticleId, setLinkedPublicationArticleId] = useState<string | null>(null);
  const [slotDeleteModalOpen, setSlotDeleteModalOpen] = useState(false);
  const [slotDeleteModalPhase, setSlotDeleteModalPhase] = useState<"review" | "confirm">("review");
  const [slotDeleteModalVisibleIds, setSlotDeleteModalVisibleIds] = useState<number[]>([]);
  const [slotDeleteModalCheckedIds, setSlotDeleteModalCheckedIds] = useState<number[]>([]);
  const [slotDeletePendingIds, setSlotDeletePendingIds] = useState<number[]>([]);
  const [slotDeleteConfirmInput, setSlotDeleteConfirmInput] = useState("");
  const [slotDeleteBusy, setSlotDeleteBusy] = useState(false);
  const [slotDeleteError, setSlotDeleteError] = useState<string | null>(null);

  const isCoverSlot = slot?.slot_key === COVER_SLOT_KEY;
  const advertPosition = isCoverSlot ? COVER_SLOT_POSITION : REGULAR_SLOT_POSITION;

  /** Advert preview: `publication_slots_db.slot_media_url` (legacy rows may still list contents). */
  const advertImageUrl = useMemo(() => {
    const fromSlot = slot?.slot_media_url?.trim();
    if (fromSlot) return fromSlot;
    const matching = contents.find(
      (c) =>
        Number(c.publication_slot_position) === Number(advertPosition) &&
        String(c.slot_content_format).toLowerCase() === "advert"
    );
    if (matching) {
      const url = pickFirstUrl(matching.slot_content_object_array || []);
      if (url) return url;
    }
    if (isCoverSlot && publication?.publication_main_image_url) {
      return publication.publication_main_image_url;
    }
    return null;
  }, [slot?.slot_media_url, contents, advertPosition, isCoverSlot, publication?.publication_main_image_url]);

  const relatedArticleId = useMemo(() => {
    if (slot?.slot_article_id) return slot.slot_article_id;
    const articleContent = contents.find((c) => c.article_id);
    return articleContent?.article_id ?? null;
  }, [contents, slot?.slot_article_id]);

  /** Must run every render (before any early return) — same rules as `resolvedContentType` / type select below. */
  const mediatecaPath = useMemo(() => {
    const edition = publication?.publication_edition_name ?? "";
    if (!slot) {
      return advertSlotMaterialsMediatecaPath(edition, slotIdNum);
    }
    if (isCoverSlot) {
      return coverAdvertMaterialsMediatecaPath(edition);
    }
    if (isPaddingSlot(slot)) {
      return advertSlotMaterialsMediatecaPath(edition, slotIdNum);
    }
    const allowedTypes = effectiveSlotTableContentTypes(slot);
    const storedType = normalizeSlotContentType(slot.slot_content_type);
    const resolvedType = allowedTypes.includes(storedType) ? storedType : "advert";
    if (resolvedType === "article" && relatedArticleId) {
      return articleSlotMaterialsMediatecaPath(edition, relatedArticleId, slotIdNum);
    }
    return advertSlotMaterialsMediatecaPath(edition, slotIdNum);
  }, [slot, relatedArticleId, publication?.publication_edition_name, slotIdNum, isCoverSlot]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [slotRes, contentRes, pubRes, publicationArticlesRes] = await Promise.all([
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
        fetch(`/api/v1/publications/${encodeURIComponent(id_publication)}/publication-articles`, {
          cache: "no-store",
          credentials: "include",
        }),
      ]);
      if (!slotRes.ok) throw new Error("Failed to load slot");
      const rawSlot = (await slotRes.json()) as Record<string, unknown>;
      const publication_page =
        rawSlot.publication_page != null && Number.isFinite(Number(rawSlot.publication_page))
          ? Number(rawSlot.publication_page)
          : 0;
      const slot_ordinal =
        rawSlot.slot_ordinal != null && Number.isFinite(Number(rawSlot.slot_ordinal))
          ? Number(rawSlot.slot_ordinal)
          : publication_page + 1;
      const slotData = { ...rawSlot, publication_page, slot_ordinal } as SlotRow;
      const contentData = contentRes.ok ? ((await contentRes.json()) as SlotContentRow[]) : [];
      const pubData = pubRes.ok ? ((await pubRes.json()) as PublicationDbRow) : null;
      const contentRows = Array.isArray(contentData) ? contentData : [];
      const relatedArticleIdForLink =
        slotData.slot_article_id ??
        contentRows.find((c) => c.article_id)?.article_id ??
        null;
      const publicationArticlesJson = publicationArticlesRes.ok
        ? ((await publicationArticlesRes.json()) as {
            items?: { publication_article_id: string; article_id: string; publication_slots_id_array: number[] }[];
          })
        : { items: [] };
      const publicationArticles = Array.isArray(publicationArticlesJson.items)
        ? publicationArticlesJson.items
        : [];
      const publicationArticleMatch = findPublicationArticleForSlot(
        publicationArticles,
        slotIdNum,
        relatedArticleIdForLink
      );

      setSlot(slotData);
      setContents(contentRows);
      setPublication(pubData);
      setLinkedPublicationArticleId(publicationArticleMatch?.publication_article_id ?? null);

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
      setLinkedPublicationArticleId(null);
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
    const id = relatedArticleId?.trim();
    if (!id) {
      setRelatedArticleDetail(null);
      setRelatedArticleDetailError(null);
      setRelatedArticleDetailLoading(false);
      return;
    }
    let cancelled = false;
    setRelatedArticleDetailLoading(true);
    setRelatedArticleDetailError(null);
    void (async () => {
      try {
        const res = await fetch(`/api/v1/articles/${encodeURIComponent(id)}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as RelatedArticleApi;
        if (!cancelled) setRelatedArticleDetail(data);
      } catch {
        if (!cancelled) {
          setRelatedArticleDetail(null);
          setRelatedArticleDetailError("Could not load article details.");
        }
      } finally {
        if (!cancelled) setRelatedArticleDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [relatedArticleId]);

  const slotCanBulkDelete = useMemo(() => {
    if (!slot) return false;
    const pub = slot.publication_id != null ? String(slot.publication_id) : "";
    if (pub && pub !== String(id_publication)) return false;
    const s = slot as SlotRow;
    return isFlatplanSlotBulkDeletable(s, flatplanEntryKeyFromSlot(s));
  }, [slot, id_publication]);

  const slotsForDeleteModal = useMemo(
    () => (slot ? ([slot] as SlotRow[]) : []),
    [slot]
  );

  useEffect(() => {
    const label = slot ? `Slot ${slot.slot_key}` : `Slot #${slotIdNum}`;
    setPageMeta({
      pageTitle: label,
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: BASE },
        { label: "Issues", href: BASE },
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

  const closeSlotDeleteModal = useCallback(() => {
    setSlotDeleteModalOpen(false);
    setSlotDeleteModalPhase("review");
    setSlotDeleteModalVisibleIds([]);
    setSlotDeleteModalCheckedIds([]);
    setSlotDeletePendingIds([]);
    setSlotDeleteConfirmInput("");
    setSlotDeleteBusy(false);
    setSlotDeleteError(null);
  }, []);

  const openSlotDeleteModal = useCallback(() => {
    if (!slot) return;
    const sid = slot.publication_slot_id;
    setSlotDeleteError(null);
    setSlotDeleteModalVisibleIds([sid]);
    setSlotDeleteModalCheckedIds([sid]);
    setSlotDeleteModalPhase("review");
    setSlotDeletePendingIds([]);
    setSlotDeleteConfirmInput("");
    setSlotDeleteModalOpen(true);
  }, [slot]);

  const toggleSlotDeleteModalId = useCallback(
    (id: number) => {
      setSlotDeleteModalCheckedIds((prev) => {
        if (!slotDeleteModalVisibleIds.includes(id)) return prev;
        return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      });
    },
    [slotDeleteModalVisibleIds]
  );

  const onSlotDeleteModalYes = useCallback(() => {
    setSlotDeletePendingIds([...slotDeleteModalCheckedIds]);
    setSlotDeleteModalPhase("confirm");
    setSlotDeleteConfirmInput("");
  }, [slotDeleteModalCheckedIds]);

  const onSlotDeleteModalFinal = useCallback(async () => {
    if (slotDeleteConfirmInput.trim().toLowerCase() !== "confirm") return;
    const ids = slotDeletePendingIds;
    if (ids.length === 0) return;
    setSlotDeleteBusy(true);
    setSlotDeleteError(null);
    try {
      const res = await fetch(
        `/api/v1/publications-db/${encodeURIComponent(id_publication)}/slots/bulk-delete`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ publication_slot_ids: ids }),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let message = txt || "Failed to delete slot.";
        try {
          const j = JSON.parse(txt);
          if (j?.message) message = String(j.message);
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      closeSlotDeleteModal();
      router.push(`${BASE}/${encodeURIComponent(id_publication)}`);
    } catch (e: unknown) {
      setSlotDeleteError((e as Error)?.message ?? "Failed to delete slot.");
    } finally {
      setSlotDeleteBusy(false);
    }
  }, [
    id_publication,
    slotDeleteConfirmInput,
    slotDeletePendingIds,
    router,
    closeSlotDeleteModal,
  ]);

  const handleTypeChange = useCallback(
    async (nextTypeRaw: string) => {
      if (!slot) return;
      if (nextTypeRaw === TYPE_SELECT_PENDING_PLACEHOLDER) return;
      const nextType = nextTypeRaw as SlotContentTypeOption;
      const wasPadding = isPaddingSlot(slot);
      const previous = normalizeSlotContentType(slot.slot_content_type);
      if (!wasPadding && previous === nextType) return;
      const allowedTypes = effectiveSlotTableContentTypes(slot);
      if (!allowedTypes.includes(nextType)) {
        setTypeError(`Type '${nextType}' is not allowed for slot ${slot.slot_key}.`);
        return;
      }
      setTypeError(null);
      setTypeSaving(true);
      if (nextType !== "article") {
        setArticleModalOpen(false);
      }
      const leavePadding =
        isPaddingSlot(slot) && (nextType === "advert" || nextType === "article");
      const patchBody: Record<string, unknown> = { slot_content_type: nextType };
      if (leavePadding) {
        patchBody.slot_state = "pending";
      }
      setSlot((prev) =>
        prev
          ? {
              ...prev,
              slot_content_type: nextType,
              ...(leavePadding ? { slot_state: "pending" } : {}),
            }
          : prev
      );
      try {
        const updated = await patchSlot(patchBody);
        setSlot(updated);
      } catch (e: unknown) {
        setTypeError((e as Error)?.message ?? "Failed to update type");
        setSlot((prev) =>
          prev ? { ...prev, slot_content_type: previous, slot_state: slot.slot_state } : prev
        );
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

  const isPadding = isPaddingSlot(slot);
  const allowedTypes = effectiveSlotTableContentTypes(slot);
  const storedType = normalizeSlotContentType(slot.slot_content_type);
  const displayedContentType: SlotContentTypeOption = allowedTypes.includes(storedType)
    ? storedType
    : DEFAULT_SLOT_CONTENT_TYPE;
  /** Saved content type for previews / article tools; `null` while slot_state is padding (type not chosen yet). */
  const resolvedContentType: SlotContentTypeOption | null = isPadding ? null : displayedContentType;
  const typeSelectValue = isPadding ? TYPE_SELECT_PENDING_PLACEHOLDER : displayedContentType;
  const typeSelectLocked = !isPadding && allowedTypes.length === 1;
  const invalidStoredType = !isPadding && storedType !== displayedContentType;
  const openArticleBuilderHref = linkedPublicationArticleId
    ? articleBuilderHref(id_publication, linkedPublicationArticleId)
    : null;
  const articleNetworkHref = relatedArticleId
    ? `${ARTICLE_NETWORK_BASE}/${encodeURIComponent(relatedArticleId)}`
    : null;

  const relatedArticleCompaniesLabel = (() => {
    if (!relatedArticleDetail) return "";
    const names = relatedArticleDetail.article_company_names_array;
    if (Array.isArray(names) && names.length > 0) {
      const joined = names.map((n) => String(n).trim()).filter(Boolean).join(", ");
      if (joined) return joined;
    }
    const c = relatedArticleDetail.company?.trim();
    return c || "";
  })();

  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
          <div className="p-6 space-y-6">
            {slotCanBulkDelete ? (
              <div className="flex flex-row justify-end">
                <button
                  type="button"
                  onClick={openSlotDeleteModal}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-900 hover:bg-red-100 transition"
                >
                  Delete slot
                </button>
              </div>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase">Slot key</p>
                <p className="font-medium text-gray-900">{slot.slot_key}</p>
                <p className="text-xs text-gray-400 mt-0.5">#{slot.publication_slot_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Type</p>
                <select
                  value={typeSelectValue}
                  onChange={(e) => void handleTypeChange(e.target.value)}
                  disabled={typeSaving || typeSelectLocked}
                  className="mt-1 w-full max-w-xs px-2 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPadding ? (
                    <>
                      <option value={TYPE_SELECT_PENDING_PLACEHOLDER}>pending</option>
                      <option value="advert">advert</option>
                      <option value="article">article</option>
                    </>
                  ) : (
                    allowedTypes.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))
                  )}
                </select>
                {isPadding ? (
                  <p className="mt-1 text-xs text-gray-500">
                    Parity padding: choose <span className="font-mono">advert</span> or{" "}
                    <span className="font-mono">article</span>; slot state becomes{" "}
                    <span className="font-mono">pending</span> after you choose.
                  </p>
                ) : null}
                {typeSelectLocked ? (
                  <p className="mt-1 text-xs text-gray-500">
                    This slot type is locked by its slot key.
                  </p>
                ) : null}
                {invalidStoredType ? (
                  <p className="mt-1 text-xs text-amber-700">
                    {`Saved type "${storedType}" is not allowed here; the UI treats it as advert.`}
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
                {customer?.name ? (
                  <>
                    <p className="text-gray-800 text-sm">{customer.name}</p>
                    <p className="text-xs font-mono text-gray-500">{slot.customer_id ?? "—"}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Select a project from a contract first; the customer appears here once this
                      slot is linked to that project.
                    </p>
                    {slot.customer_id ? (
                      <p className="text-xs font-mono text-gray-500 mt-1">{slot.customer_id}</p>
                    ) : null}
                  </>
                )}
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
              {resolvedContentType === "article" ? (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Article</p>
                  <div className="mt-1 flex flex-col gap-2">
                    {!relatedArticleId ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setArticleModalOpen(true)}
                          disabled={articleSaving}
                          className="w-fit px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {articleSaving ? "Saving…" : "Relate to article"}
                        </button>
                        <p className="text-xs text-gray-500">No article linked to this slot yet.</p>
                      </>
                    ) : (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 max-w-md shadow-sm">
                        {relatedArticleDetailLoading ? (
                          <p className="text-xs text-gray-600">Loading article…</p>
                        ) : null}
                        {relatedArticleDetailError && !relatedArticleDetailLoading ? (
                          <div className="space-y-1">
                            <p className="text-xs text-amber-800">{relatedArticleDetailError}</p>
                            <p className="text-xs font-mono text-gray-600 break-all">{relatedArticleId}</p>
                          </div>
                        ) : null}
                        {relatedArticleDetail && !relatedArticleDetailLoading ? (
                          <div className="flex gap-3">
                            {relatedArticleDetail.article_main_image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element -- small thumbnail from external/mediateca URLs
                              <img
                                src={relatedArticleDetail.article_main_image_url}
                                alt=""
                                className="h-16 w-24 shrink-0 rounded-md object-cover border border-emerald-100 bg-white"
                              />
                            ) : (
                              <div className="h-16 w-24 shrink-0 rounded-md border border-dashed border-emerald-200 bg-white/80" />
                            )}
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="text-sm font-semibold text-emerald-950 leading-snug">
                                {relatedArticleDetail.articleTitle?.trim() ||
                                  relatedArticleDetail.id_article}
                              </p>
                              {relatedArticleDetail.articleSubtitle?.trim() ? (
                                <p className="text-xs text-gray-700 line-clamp-2">
                                  {relatedArticleDetail.articleSubtitle}
                                </p>
                              ) : null}
                              {relatedArticleDetail.date ? (
                                <p className="text-[10px] uppercase tracking-wide text-gray-500">
                                  Date: {relatedArticleDetail.date}
                                </p>
                              ) : null}
                              {relatedArticleCompaniesLabel ? (
                                <p className="text-xs text-gray-800">
                                  <span className="font-medium text-emerald-900">
                                    Customers / companies:{" "}
                                  </span>
                                  <span>{relatedArticleCompaniesLabel}</span>
                                </p>
                              ) : null}
                              {relatedArticleDetail.is_article_event && relatedArticleDetail.event_id ? (
                                <p className="text-[10px] text-gray-600">
                                  Event-linked ·{" "}
                                  <span className="font-mono">{relatedArticleDetail.event_id}</span>
                                </p>
                              ) : null}
                              <div className="flex flex-wrap gap-2 pt-1">
                                {articleNetworkHref ? (
                                  <Link
                                    href={articleNetworkHref}
                                    className="inline-flex items-center rounded-md bg-emerald-800 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-900"
                                  >
                                    View in Network
                                  </Link>
                                ) : null}
                                {openArticleBuilderHref ? (
                                  <Link
                                    href={openArticleBuilderHref}
                                    className="inline-flex items-center rounded-md border border-emerald-700 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100/80"
                                  >
                                    Open article builder
                                  </Link>
                                ) : null}
                              </div>
                              <p className="text-[10px] font-mono text-gray-500 pt-0.5 break-all">
                                {relatedArticleDetail.id_article}
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                    {articleError ? (
                      <p className="text-xs text-red-600">{articleError}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Preview area changes shape based on the slot content type. */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">Preview</p>
                <span className="text-xs text-gray-500">Type: {typeSelectValue}</span>
              </div>

              {resolvedContentType === null ? (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 p-8 text-center text-sm text-gray-800">
                  <p className="font-semibold text-amber-950 tracking-wide uppercase text-xs">
                    pending
                  </p>
                  <p className="mt-3 text-gray-700 max-w-md mx-auto">
                    Choose <span className="font-mono">advert</span> or{" "}
                    <span className="font-mono">article</span> in the type field above. No preview
                    until then.
                  </p>
                </div>
              ) : null}

              {resolvedContentType === "advert" ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 flex flex-col items-center gap-4">
                  <div className="w-full max-w-sm aspect-[4/5] rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                    {advertImageUrl ? (
                      isPdfMediaUrl(advertImageUrl) ? (
                        <iframe
                          src={advertImageUrl}
                          title="Advert PDF preview"
                          className="w-full h-full min-h-[280px] border-0"
                        />
                      ) : (
                        <img
                          src={advertImageUrl}
                          alt="Advert preview"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )
                    ) : (
                      <span className="text-sm text-gray-400">No advert media yet</span>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full max-w-sm">
                    <button
                      type="button"
                      onClick={() => setMediatecaOpen(true)}
                      disabled={imageSaving}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/50 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {imageSaving ? "Saving…" : "Update media"}
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

              {resolvedContentType === "article" ? (
                linkedPublicationArticleId ? (
                  <SlotArticlePreviewSection
                    publicationId={id_publication}
                    publicationArticleId={linkedPublicationArticleId}
                    slotId={slotIdNum}
                    flatplanImageUrl={slot.slot_flatplan_image_url}
                    currentMagazinePage={
                      slot.publication_page != null &&
                      Number.isFinite(Number(slot.publication_page))
                        ? Math.round(Number(slot.publication_page))
                        : null
                    }
                  />
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 flex flex-col items-center gap-4 text-center">
                    <p className="text-sm text-gray-700 max-w-md">
                      Relate a network article to this slot, then provision it in the publication
                      contents so the page preview and Article Builder are available.
                    </p>
                  </div>
                )
              ) : null}

              {resolvedContentType === "summary" ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                  This slot is reserved for the magazine <strong>summary</strong>. No advert
                  preview is available.
                </div>
              ) : null}

              {resolvedContentType === "index" ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                  This slot is reserved for the advertiser <strong>index</strong>. No advert
                  preview is available.
                </div>
              ) : null}
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
        allowPdfSelection
        ensureSlotMediatecaFolder={{
          publicationId: id_publication,
          slotId: slotIdNum,
        }}
      />

      <ArticleRelateModal
        open={articleModalOpen}
        onClose={() => setArticleModalOpen(false)}
        onSelectArticle={(article) => void handleArticleSelected(article)}
        currentArticleId={relatedArticleId}
      />

      <FlatplanBulkDeleteModal
        open={slotDeleteModalOpen}
        phase={slotDeleteModalPhase}
        slots={slotsForDeleteModal}
        modalVisibleSlotIds={slotDeleteModalVisibleIds}
        modalCheckedSlotIds={slotDeleteModalCheckedIds}
        onToggleModalId={toggleSlotDeleteModalId}
        confirmInput={slotDeleteConfirmInput}
        onConfirmInputChange={setSlotDeleteConfirmInput}
        onClose={closeSlotDeleteModal}
        onYes={onSlotDeleteModalYes}
        onFinalDelete={() => void onSlotDeleteModalFinal()}
        busy={slotDeleteBusy}
        error={slotDeleteError}
      />
    </PageContentSection>
  );
};

export default SlotDetailPage;
