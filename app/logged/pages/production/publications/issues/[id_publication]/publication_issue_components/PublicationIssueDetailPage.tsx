"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import MoveContentTypeModal, {
  MovableContentType,
} from "@/app/logged/logged_components/modals/MoveContentTypeModal";
import {
  BASE,
  comparePublicationSlotsFlatplanOrder,
  COVER_MARGIN_ARTICLE_COUNT,
  CoverMarginArticleMiniature,
  expandFlatplanBulkDeleteSlotIds,
  FLATPLAN_BUFFER_KEY,
  flatplanEntryKeyFromSlot,
  flatplanLeftColumnCount,
  toggleFlatplanBulkDeleteSlotIds,
  preferentialPublicationPageFromSlot,
  MagazineApiRow,
  normalizeSlotContentType,
  PreferentialSlotApiRow,
  PublicationDbRow,
  SlotRow,
  TabId,
} from "@/app/logged/pages/production/publications/publication_components/_shared";
import {
  ContentsManagerTab,
  ISSUE_CONTENTS_MANAGER_SUBTAB_QUERY_PARAM,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/ContentsManagerTab";
import { DataTab } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/DataTab";
import { FlatplanTab } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/FlatplanTab";
import { FlatplanAddSlotModal } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/FlatplanTab/flatplan_tab_components/FlatplanAddSlotModal";
import type { FlatplanAddSlotPlacement } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/FlatplanTab/flatplan_tab_components/flatplanInsertPlacement";
import {
  editorialPublicationPageBoundsInclusive,
  placementNeighbors,
  suggestInitialEditorialPublicationPage,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/FlatplanTab/flatplan_tab_components/flatplanInsertPlacement";
import { CoverMarginArticleSelectModal } from "./publication_issue_detail_components/CoverMarginArticleSelectModal";
import {
  DELETE_CONFIRM_WORD,
  DeletePublicationModal,
} from "./publication_issue_detail_components/DeletePublicationModal";
import { IssueDetailTabBar } from "./publication_issue_detail_components/IssueDetailTabBar";
import { PublishMagazineModal } from "./publication_issue_detail_components/PublishMagazineModal";

/** Query `?tab=` on the issue detail route; default tab omits the param. */
function parseIssueDetailTabParam(raw: string | null): TabId {
  if (raw === "flatplan" || raw === "contentsManager" || raw === "data") return raw;
  return "data";
}

export const PublicationIssueDetailPage: FC<{ publicationId: string }> = ({ publicationId }) => {
  const { setPageMeta } = usePageContent();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabQuery = searchParams.get("tab");
  const activeTab = useMemo(() => parseIssueDetailTabParam(tabQuery), [tabQuery]);

  const navigateToTab = React.useCallback(
    (tab: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "data") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      if (tab !== "contentsManager") {
        params.delete(ISSUE_CONTENTS_MANAGER_SUBTAB_QUERY_PARAM);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );
  const [publication, setPublication] = useState<PublicationDbRow | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [preferentialSlots, setPreferentialSlots] = useState<PreferentialSlotApiRow[]>([]);
  const [magazine, setMagazine] = useState<MagazineApiRow | null>(null);
  /** Flatplan tab: slots panel docked to 1/4 width with reduced table. */
  const [slotsReduced, setSlotsReduced] = useState(false);
  const [hoveredSlotId, setHoveredSlotId] = useState<number | null>(null);
  const [flatplanBulkDeleteSelectMode, setFlatplanBulkDeleteSelectMode] = useState(false);
  const [flatplanBulkDeleteSelectedIds, setFlatplanBulkDeleteSelectedIds] = useState<number[]>([]);
  const [flatplanBulkDeleteModalOpen, setFlatplanBulkDeleteModalOpen] = useState(false);
  const [flatplanBulkDeleteModalPhase, setFlatplanBulkDeleteModalPhase] = useState<
    "review" | "confirm"
  >("review");
  const [flatplanBulkDeleteModalVisibleSlotIds, setFlatplanBulkDeleteModalVisibleSlotIds] = useState<
    number[]
  >([]);
  const [flatplanBulkDeleteModalCheckedSlotIds, setFlatplanBulkDeleteModalCheckedSlotIds] = useState<
    number[]
  >([]);
  const [flatplanBulkDeletePendingIds, setFlatplanBulkDeletePendingIds] = useState<number[]>([]);
  const [flatplanBulkDeleteConfirmInput, setFlatplanBulkDeleteConfirmInput] = useState("");
  const [flatplanBulkDeleteBusy, setFlatplanBulkDeleteBusy] = useState(false);
  const [flatplanBulkDeleteError, setFlatplanBulkDeleteError] = useState<string | null>(null);
  const flatplanAutoCollapseTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Active "Change Summary/Index Location" modal state. Holds the content type
   * being moved and an optional initial target.
   */
  const [moveContentTypeModal, setMoveContentTypeModal] = useState<{
    contentType: MovableContentType;
    initialTarget: string | null;
  } | null>(null);
  const [deletePublicationModalOpen, setDeletePublicationModalOpen] = useState(false);
  const [deletePublicationConfirmInput, setDeletePublicationConfirmInput] = useState("");
  const [publishMagazineModalOpen, setPublishMagazineModalOpen] = useState(false);
  const [flatplanAddSlotModalOpen, setFlatplanAddSlotModalOpen] = useState(false);
  const [flatplanAddSlotMeta, setFlatplanAddSlotMeta] = useState<{
    initialPublicationPage: number;
    reloadDocumentAfterCreate?: boolean;
  }>({ initialPublicationPage: 10 });
  const [coverMarginArticleModalPosition, setCoverMarginArticleModalPosition] =
    useState<number | null>(null);
  const [coverMarginMiniatures, setCoverMarginMiniatures] = useState<
    CoverMarginArticleMiniature[]
  >(() =>
    Array.from({ length: COVER_MARGIN_ARTICLE_COUNT }, (_, index) => ({
      position: index + 1,
      article: null,
      currentContent: "",
      draftContent: "",
      editing: false,
    }))
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pubRes, slotsRes, prefRes] = await Promise.all([
        fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/v1/publications/${encodeURIComponent(publicationId)}/preferential-slots`, {
          cache: "no-store",
          credentials: "include",
        }),
      ]);
      if (!pubRes.ok) throw new Error("Failed to load issue");
      const pub = (await pubRes.json()) as PublicationDbRow;
      const rawSlots = slotsRes.ok ? ((await slotsRes.json()) as unknown[]) : [];
      const slotList = (Array.isArray(rawSlots) ? rawSlots : []).map((raw) => {
        const s = raw as Record<string, unknown>;
        const publication_page =
          s.publication_page != null && Number.isFinite(Number(s.publication_page))
            ? Number(s.publication_page)
            : 0;
        const slot_ordinal =
          s.slot_ordinal != null && Number.isFinite(Number(s.slot_ordinal))
            ? Number(s.slot_ordinal)
            : publication_page + 1;
        return { ...s, publication_page, slot_ordinal } as SlotRow;
      });
      setPublication(pub);
      setSlots(slotList);
      if (prefRes.ok) {
        const prefJson = (await prefRes.json()) as { slots?: PreferentialSlotApiRow[] };
        setPreferentialSlots(Array.isArray(prefJson?.slots) ? prefJson.slots : []);
      } else {
        setPreferentialSlots([]);
      }
      if (pub.magazine_id) {
        try {
          const magRes = await fetch(
            `/api/v1/magazines/${encodeURIComponent(pub.magazine_id)}`,
            { cache: "no-store", credentials: "include" }
          );
          setMagazine(magRes.ok ? ((await magRes.json()) as MagazineApiRow) : null);
        } catch {
          setMagazine(null);
        }
      } else {
        setMagazine(null);
      }
    } catch (e: unknown) {
      setPublication(null);
      setSlots([]);
      setPreferentialSlots([]);
      setMagazine(null);
      setError(e instanceof Error ? e.message : "Failed to load issue");
    } finally {
      setLoading(false);
    }
  }, [publicationId]);

  const closeFlatplanBulkDeleteModal = React.useCallback(() => {
    setFlatplanBulkDeleteModalOpen(false);
    setFlatplanBulkDeleteModalPhase("review");
    setFlatplanBulkDeleteModalVisibleSlotIds([]);
    setFlatplanBulkDeleteModalCheckedSlotIds([]);
    setFlatplanBulkDeletePendingIds([]);
    setFlatplanBulkDeleteConfirmInput("");
    setFlatplanBulkDeleteBusy(false);
    setFlatplanBulkDeleteSelectMode(false);
    setFlatplanBulkDeleteSelectedIds([]);
    setFlatplanBulkDeleteError(null);
  }, []);

  const onFlatplanBulkDeleteToggleSlot = React.useCallback(
    (id: number) => {
      setFlatplanBulkDeleteSelectedIds((prev) => toggleFlatplanBulkDeleteSlotIds(slots, prev, id));
    },
    [slots]
  );

  const onFlatplanBulkDeleteButtonClick = React.useCallback(() => {
    setFlatplanBulkDeleteError(null);
    if (!flatplanBulkDeleteSelectMode) {
      setFlatplanBulkDeleteSelectMode(true);
      setFlatplanBulkDeleteSelectedIds([]);
      return;
    }
    if (flatplanBulkDeleteSelectedIds.length === 0) {
      setFlatplanBulkDeleteSelectMode(false);
      return;
    }
    const sorted = expandFlatplanBulkDeleteSlotIds(slots, flatplanBulkDeleteSelectedIds);
    setFlatplanBulkDeleteModalVisibleSlotIds(sorted);
    setFlatplanBulkDeleteModalCheckedSlotIds([...sorted]);
    setFlatplanBulkDeleteModalPhase("review");
    setFlatplanBulkDeletePendingIds([]);
    setFlatplanBulkDeleteConfirmInput("");
    setFlatplanBulkDeleteModalOpen(true);
  }, [flatplanBulkDeleteSelectMode, flatplanBulkDeleteSelectedIds, slots]);

  const onFlatplanBulkDeleteModalToggleSlot = React.useCallback(
    (id: number) => {
      setFlatplanBulkDeleteModalCheckedSlotIds((prev) =>
        toggleFlatplanBulkDeleteSlotIds(slots, prev, id)
      );
    },
    [slots]
  );

  const onFlatplanBulkDeleteModalYes = React.useCallback(() => {
    setFlatplanBulkDeletePendingIds([...flatplanBulkDeleteModalCheckedSlotIds]);
    setFlatplanBulkDeleteModalPhase("confirm");
    setFlatplanBulkDeleteConfirmInput("");
  }, [flatplanBulkDeleteModalCheckedSlotIds]);

  const onFlatplanBulkDeleteModalFinal = React.useCallback(async () => {
    if (flatplanBulkDeleteConfirmInput.trim().toLowerCase() !== "confirm") return;
    const ids = expandFlatplanBulkDeleteSlotIds(slots, flatplanBulkDeletePendingIds);
    if (ids.length === 0) return;
    setFlatplanBulkDeleteBusy(true);
    setFlatplanBulkDeleteError(null);
    try {
      const res = await fetch(
        `/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots/bulk-delete`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ publication_slot_ids: ids }),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let message = txt || "Failed to delete slots.";
        try {
          const j = JSON.parse(txt);
          if (j?.message) message = String(j.message);
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      await load();
      closeFlatplanBulkDeleteModal();
    } catch (e: unknown) {
      setFlatplanBulkDeleteError(
        e instanceof Error ? e.message : "Failed to delete slots."
      );
    } finally {
      setFlatplanBulkDeleteBusy(false);
    }
  }, [
    publicationId,
    slots,
    flatplanBulkDeleteConfirmInput,
    flatplanBulkDeletePendingIds,
    load,
    closeFlatplanBulkDeleteModal,
  ]);

  const flatplanBulkDeleteButtonLabel = React.useMemo(() => {
    if (!flatplanBulkDeleteSelectMode) return "Delete elements";
    if (flatplanBulkDeleteSelectedIds.length >= 1) return "Click again to delete";
    return "Select elements to delete";
  }, [flatplanBulkDeleteSelectMode, flatplanBulkDeleteSelectedIds.length]);

  const flatplanBulkDeleteShowSelectedCount =
    flatplanBulkDeleteSelectMode && flatplanBulkDeleteSelectedIds.length >= 1;

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Swap the publication slot that owns the reserved `content_type`
   * (summary / index) with the publication slot at `targetPosition`.
   */
  const moveReservedContentType = React.useCallback(
    async (
      contentType: MovableContentType,
      targetPosition: string,
      displacedPosition?: string | null
    ) => {
      const payload: {
        content_type: MovableContentType;
        target_position: string;
        displaced_position?: string;
      } = {
        content_type: contentType,
        target_position: targetPosition,
      };
      if (displacedPosition) {
        payload.displaced_position = displacedPosition;
      }
      const res = await fetch(
        `/api/v1/publications/${encodeURIComponent(publicationId)}/preferential-slots/move-content-type`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let message = txt || `Failed to move ${contentType} location.`;
        try {
          const j = JSON.parse(txt);
          if (j?.message) message = String(j.message);
        } catch {}
        throw new Error(message);
      }
      await load();
    },
    [publicationId, load]
  );

  useEffect(() => {
    if (coverMarginArticleModalPosition == null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCoverMarginArticleModalPosition(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [coverMarginArticleModalPosition]);

  const selectPlaceholderCoverMarginArticle = React.useCallback((position: number) => {
    setCoverMarginMiniatures((prev) =>
      prev.map((row) => {
        if (row.position !== position) return row;
        const article = {
          id: `placeholder-article-${position}`,
          title: `Placeholder article ${position}`,
        };
        const content = `Display content for ${article.title}.`;
        return {
          ...row,
          article,
          currentContent: content,
          draftContent: content,
          editing: false,
        };
      })
    );
    setCoverMarginArticleModalPosition(null);
  }, []);

  const removeCoverMarginArticle = React.useCallback((position: number) => {
    setCoverMarginMiniatures((prev) =>
      prev.map((row) =>
        row.position === position
          ? {
              ...row,
              article: null,
              currentContent: "",
              draftContent: "",
              editing: false,
            }
          : row
      )
    );
  }, []);

  const startEditingCoverMarginContent = React.useCallback((position: number) => {
    setCoverMarginMiniatures((prev) =>
      prev.map((row) =>
        row.position === position
          ? { ...row, draftContent: row.currentContent, editing: true }
          : row
      )
    );
  }, []);

  const updateCoverMarginDraftContent = React.useCallback(
    (position: number, draftContent: string) => {
      setCoverMarginMiniatures((prev) =>
        prev.map((row) => (row.position === position ? { ...row, draftContent } : row))
      );
    },
    []
  );

  const saveCoverMarginDraftContent = React.useCallback((position: number) => {
    setCoverMarginMiniatures((prev) =>
      prev.map((row) =>
        row.position === position
          ? { ...row, currentContent: row.draftContent, editing: false }
          : row
      )
    );
  }, []);

  useEffect(() => {
    if (activeTab !== "flatplan") {
      if (flatplanAutoCollapseTimerRef.current != null) {
        clearTimeout(flatplanAutoCollapseTimerRef.current);
        flatplanAutoCollapseTimerRef.current = null;
      }
      setSlotsReduced(false);
      return;
    }
    if (flatplanAutoCollapseTimerRef.current != null) {
      clearTimeout(flatplanAutoCollapseTimerRef.current);
      flatplanAutoCollapseTimerRef.current = null;
    }
    setSlotsReduced(false);
    flatplanAutoCollapseTimerRef.current = setTimeout(() => {
      flatplanAutoCollapseTimerRef.current = null;
      setSlotsReduced(true);
    }, 120);
  }, [activeTab]);

  const [draftPub, setDraftPub] = useState<PublicationDbRow | null>(null);
  useEffect(() => {
    setDraftPub(publication ? { ...publication } : null);
    setSaveError(null);
  }, [publication?.publication_id]);

  const hasPubChanges = useMemo(() => {
    if (!publication || !draftPub) return false;
    return JSON.stringify(publication) !== JSON.stringify(draftPub);
  }, [publication, draftPub]);

  /**
   * Auto-save state machine. Replaces the previous "Save changes / Reset"
   * buttons by writing draft changes to the backend after a short debounce.
   */
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const autoSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFlashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const savePublication = React.useCallback(async () => {
    if (!draftPub) return;
    setAutoSaveStatus("saving");
    setSaveError(null);
    try {
      const res = await fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          magazine_id: draftPub.magazine_id,
          publication_year: draftPub.publication_year,
          publication_edition_name: draftPub.publication_edition_name,
          magazine_general_issue_number: draftPub.magazine_general_issue_number,
          magazine_this_year_issue: draftPub.magazine_this_year_issue,
          publication_expected_publication_month: draftPub.publication_expected_publication_month,
          real_publication_month_date: draftPub.real_publication_month_date,
          publication_materials_deadline: draftPub.publication_materials_deadline,
          is_special_edition: draftPub.is_special_edition,
          special_edition_subtitle: draftPub.special_edition_subtitle ?? "",
          publication_theme: draftPub.publication_theme,
          publication_status: draftPub.publication_status,
          publication_format: draftPub.publication_format,
          publication_main_image_url: draftPub.publication_main_image_url,
          publication_header_domain: draftPub.publication_header_domain ?? "",
          red_box_header: draftPub.red_box_header ?? "",
          red_box_body: draftPub.red_box_body ?? "",
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Failed to save changes");
      }
      setPublication((prev) => (prev ? { ...prev, ...draftPub } : prev));
      setAutoSaveStatus("saved");
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
      savedFlashTimerRef.current = setTimeout(() => {
        savedFlashTimerRef.current = null;
        setAutoSaveStatus((s) => (s === "saved" ? "idle" : s));
      }, 1500);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Failed to save changes");
      setAutoSaveStatus("error");
    }
  }, [draftPub, publicationId]);

  /**
   * Whenever the editable draft drifts from the persisted publication,
   * schedule an auto-save 600ms after the last keystroke (debounced).
   */
  useEffect(() => {
    if (!hasPubChanges) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      void savePublication();
    }, 600);
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [hasPubChanges, draftPub, savePublication]);

  useEffect(
    () => () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
    },
    []
  );

  const canDeletePublication =
    deletePublicationConfirmInput === DELETE_CONFIRM_WORD && Boolean(publication);

  const openDeletePublicationModal = React.useCallback(() => {
    setDeletePublicationConfirmInput("");
    setDeletePublicationModalOpen(true);
  }, []);

  const closeDeletePublicationModal = React.useCallback(() => {
    setDeletePublicationModalOpen(false);
    setDeletePublicationConfirmInput("");
  }, []);

  const openPublishMagazineModal = React.useCallback(() => {
    setPublishMagazineModalOpen(true);
  }, []);

  const unpublishPublication = React.useCallback(async () => {
    if (!publication) return;
    const ok = window.confirm(
      "Unpublish this publication? It will return to draft state."
    );
    if (!ok) return;
    try {
      const res = await fetch(
        `/api/v1/publications-db/${encodeURIComponent(publicationId)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ publication_status: "draft" }),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to unpublish publication");
      }
      const updated = (await res.json()) as PublicationDbRow;
      setPublication(updated);
      setDraftPub((prev) => (prev ? { ...prev, publication_status: "draft" } : prev));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to unpublish publication");
    }
  }, [publication, publicationId]);

  const handleFlatplanTabClick = React.useCallback(() => {
    if (activeTab !== "flatplan") {
      navigateToTab("flatplan");
      return;
    }
    setSlotsReduced(true);
  }, [activeTab, navigateToTab]);

  useEffect(() => {
    const title = publication?.publication_edition_name
      ? publication.publication_edition_name
      : `Issue ${publicationId}`;
    const status = String(publication?.publication_status ?? "")
      .trim()
      .toLowerCase();
    const isPublished = status === "published";
    setPageMeta({
      pageTitle: title,
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: BASE },
        { label: "Issues", href: BASE },
        { label: title },
      ],
      buttons: [
        { label: "Back to Issues", href: BASE },
        ...(isPublished
          ? [
              {
                label: "Read Publication",
                href: `${BASE}/${encodeURIComponent(publicationId)}/preview/0`,
              },
              {
                label: "Unpublish",
                onClick: unpublishPublication,
                variant: "danger" as const,
              },
            ]
          : [
              {
                label: "Preview magazine",
                href: `${BASE}/${encodeURIComponent(publicationId)}/preview/0`,
              },
              {
                label: "Delete Publication",
                onClick: openDeletePublicationModal,
                variant: "danger" as const,
              },
              {
                label: "Publish Magazine",
                onClick: openPublishMagazineModal,
                variant: "primary" as const,
              },
            ]),
      ],
    });
  }, [
    setPageMeta,
    publication?.publication_edition_name,
    publication?.publication_status,
    publicationId,
    openDeletePublicationModal,
    openPublishMagazineModal,
    unpublishPublication,
  ]);

  const slotByKey = useMemo(() => {
    const map = new Map<string, SlotRow>();
    for (const s of slots) {
      map.set(flatplanEntryKeyFromSlot(s), s);
    }
    return map;
  }, [slots]);

  /** publication_slots_db.publication_slot_id for slot_key='cover'. */
  const coverSlotId = useMemo(
    () => slotByKey.get("cover")?.publication_slot_id ?? null,
    [slotByKey]
  );

  const maxPreferentialInteriorPage = useMemo(() => {
    let m = 0;
    for (const s of slots) {
      const p = preferentialPublicationPageFromSlot(s);
      if (p != null && p > m) m = p;
    }
    return m;
  }, [slots]);

  const sortedSlotsForFlatplan = useMemo(() => {
    return [...slots].sort(comparePublicationSlotsFlatplanOrder);
  }, [slots]);

  const flatplanEditorialPageBounds = useMemo(
    () => editorialPublicationPageBoundsInclusive(sortedSlotsForFlatplan),
    [sortedSlotsForFlatplan]
  );

  const openFlatplanAddPlacement = React.useCallback(
    (
      placement: FlatplanAddSlotPlacement,
      options?: { reloadDocumentAfterCreate?: boolean }
    ) => {
      const bounds = editorialPublicationPageBoundsInclusive(sortedSlotsForFlatplan);
      const { prev, next } = placementNeighbors(sortedSlotsForFlatplan, placement);
      setFlatplanAddSlotMeta({
        initialPublicationPage: suggestInitialEditorialPublicationPage(prev, next, bounds),
        reloadDocumentAfterCreate: Boolean(options?.reloadDocumentAfterCreate),
      });
      setFlatplanAddSlotModalOpen(true);
    },
    [sortedSlotsForFlatplan]
  );

  const handleFlatplanRelocateArticle = React.useCallback(
    async (
      publicationArticleId: string,
      entryKey: string,
      side: "before" | "after"
    ) => {
      setFlatplanBulkDeleteError(null);
      const bounds = editorialPublicationPageBoundsInclusive(sortedSlotsForFlatplan);
      if (!bounds) {
        setFlatplanBulkDeleteError("Could not read editorial page bounds (missing end slot).");
        return;
      }
      const { prev, next } = placementNeighbors(sortedSlotsForFlatplan, {
        kind: "adjacent",
        entryKey,
        side,
      });
      const startPage = suggestInitialEditorialPublicationPage(prev, next, bounds);
      try {
        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/provision-consecutive-slots`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ start_publication_page: startPage }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          let msg = txt || "Failed to move article block";
          try {
            const j = JSON.parse(txt) as { message?: string };
            if (j?.message) msg = String(j.message);
          } catch {
            /* ignore */
          }
          throw new Error(msg);
        }
        await load();
        window.location.reload();
      } catch (e: unknown) {
        setFlatplanBulkDeleteError(
          e instanceof Error ? e.message : "Failed to move article in flatplan"
        );
      }
    },
    [sortedSlotsForFlatplan, load]
  );

  /**
   * One preview tile per DB slot row, same order as the Slots table (`sortedSlotsForFlatplan`).
   * Invisible buffers at start/end preserve the spread layout math.
   */
  const flatplanWorkingSplit = useMemo(() => {
    const inner = sortedSlotsForFlatplan.map((s) => flatplanEntryKeyFromSlot(s));
    const working = [FLATPLAN_BUFFER_KEY, ...inner, FLATPLAN_BUFFER_KEY];
    const n = working.length;
    const leftCount = flatplanLeftColumnCount(n);
    return {
      working,
      leftKeys: working.slice(0, leftCount),
      rightKeys: working.slice(leftCount),
      leftCount,
    };
  }, [sortedSlotsForFlatplan]);

  const slotKeyToWorkingIndex = useMemo(() => {
    const m = new Map<string, number>();
    flatplanWorkingSplit.working.forEach((k, i) => {
      if (k !== FLATPLAN_BUFFER_KEY) m.set(k, i);
    });
    return m;
  }, [flatplanWorkingSplit.working]);

  const handleSlotTypeChange = React.useCallback(
    async (slotId: number, newType: string) => {
      setSlots((prev) =>
        prev.map((s) =>
          s.publication_slot_id === slotId ? { ...s, slot_content_type: newType } : s
        )
      );
      try {
        const res = await fetch(`/api/v1/publication-slots/${slotId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ slot_content_type: newType }),
        });
        if (!res.ok) await load();
      } catch {
        await load();
      }
    },
    [load]
  );

  /**
   * Lookup table from `publication_slots_db.publication_slot_id` to its
   * canonical `position_in_magazine` (e.g. "Preferential page 4"). Used to
   * decide whether a Type select change in the Slots editable table requires
   * the swap modal.
   */
  const positionByPublicationSlotId = useMemo(() => {
    const m = new Map<number, string>();
    preferentialSlots.forEach((p) => {
      if (p.publication_slot_id != null) {
        m.set(Number(p.publication_slot_id), String(p.position_in_magazine));
      }
    });
    return m;
  }, [preferentialSlots]);

  const SWAPPABLE_PREFERENTIAL_POSITIONS = useMemo(
    () =>
      new Set(["Preferential page 2", "Preferential page 4", "Preferential page 6"]),
    []
  );

  /**
   * Wrapper around the Slots editable table Type select. Whenever a change
   * involves `summary` or `index` and the slot maps to one of the swappable
   * preferential positions (2 / 4 / 6), open the move modal instead of
   * patching directly.
   */
  const handleSlotsTableTypeChange = React.useCallback(
    (slot: SlotRow, newType: string) => {
      const oldType = normalizeSlotContentType(slot.slot_content_type);
      const next = String(newType ?? "").trim().toLowerCase();
      if (next === oldType) return;

      const slotPosition =
        slot.publication_slot_id != null
          ? positionByPublicationSlotId.get(Number(slot.publication_slot_id)) ?? null
          : null;

      if (next === "summary" || next === "index") {
        if (slotPosition && SWAPPABLE_PREFERENTIAL_POSITIONS.has(slotPosition)) {
          setMoveContentTypeModal({
            contentType: next as MovableContentType,
            initialTarget: slotPosition,
          });
          return;
        }
      }

      if (
        (oldType === "summary" || oldType === "index") &&
        slotPosition &&
        SWAPPABLE_PREFERENTIAL_POSITIONS.has(slotPosition)
      ) {
        setMoveContentTypeModal({
          contentType: oldType as MovableContentType,
          initialTarget: null,
        });
        return;
      }

      void handleSlotTypeChange(slot.publication_slot_id, next);
    },
    [positionByPublicationSlotId, SWAPPABLE_PREFERENTIAL_POSITIONS, handleSlotTypeChange]
  );

  if (loading) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Loading issue…</div>
      </PageContentSection>
    );
  }

  if (!publication) {
    return (
      <PageContentSection>
        <div className="p-6 text-center">
          <p className="text-gray-600">{error ?? "Issue not found."}</p>
          <Link
            href={BASE}
            className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Issues
          </Link>
        </div>
      </PageContentSection>
    );
  }

  const title = publication.publication_edition_name || `Issue ${publication.publication_id}`;

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <IssueDetailTabBar
            activeTab={activeTab}
            onSelectData={() => navigateToTab("data")}
            onSelectFlatplan={handleFlatplanTabClick}
            onSelectContentsManager={() => navigateToTab("contentsManager")}
            slotsCount={slots.length}
            showAutoSaveStatus={activeTab === "data"}
            autoSaveStatus={autoSaveStatus}
            hasPubChanges={hasPubChanges}
          />

          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              {activeTab === "data" && (
                <DataTab
                  publicationId={publicationId}
                  publication={publication}
                  draftPub={draftPub}
                  setDraftPub={setDraftPub}
                  saveError={saveError}
                  magazine={magazine}
                  preferentialSlots={preferentialSlots}
                  title={title}
                  coverSlotId={coverSlotId}
                  coverMarginMiniatures={coverMarginMiniatures}
                  setCoverMarginArticleModalPosition={setCoverMarginArticleModalPosition}
                  removeCoverMarginArticle={removeCoverMarginArticle}
                  startEditingCoverMarginContent={startEditingCoverMarginContent}
                  updateCoverMarginDraftContent={updateCoverMarginDraftContent}
                  saveCoverMarginDraftContent={saveCoverMarginDraftContent}
                  setMoveContentTypeModal={setMoveContentTypeModal}
                  onRefreshPublication={load}
                />
              )}

              {activeTab === "flatplan" && (
                <FlatplanTab
                  publicationId={publicationId}
                  slots={slots}
                  sortedSlotsForFlatplan={sortedSlotsForFlatplan}
                  slotByKey={slotByKey}
                  slotKeyToWorkingIndex={slotKeyToWorkingIndex}
                  flatplanWorkingSplit={flatplanWorkingSplit}
                  maxPreferentialInteriorPage={maxPreferentialInteriorPage}
                  slotsReduced={slotsReduced}
                  setSlotsReduced={setSlotsReduced}
                  hoveredSlotId={hoveredSlotId}
                  setHoveredSlotId={setHoveredSlotId}
                  handleSlotsTableTypeChange={handleSlotsTableTypeChange}
                  flatplanBulkDeleteSelectMode={flatplanBulkDeleteSelectMode}
                  flatplanBulkDeleteSelectedIds={flatplanBulkDeleteSelectedIds}
                  onFlatplanBulkDeleteToggleSlot={onFlatplanBulkDeleteToggleSlot}
                  flatplanBulkDeleteButtonLabel={flatplanBulkDeleteButtonLabel}
                  onFlatplanBulkDeleteButtonClick={onFlatplanBulkDeleteButtonClick}
                  flatplanBulkDeleteShowSelectedCount={flatplanBulkDeleteShowSelectedCount}
                  flatplanBulkDeleteError={flatplanBulkDeleteError}
                  flatplanBulkDeleteModalOpen={flatplanBulkDeleteModalOpen}
                  flatplanBulkDeleteModalPhase={flatplanBulkDeleteModalPhase}
                  flatplanBulkDeleteModalVisibleSlotIds={flatplanBulkDeleteModalVisibleSlotIds}
                  flatplanBulkDeleteModalCheckedSlotIds={flatplanBulkDeleteModalCheckedSlotIds}
                  onFlatplanBulkDeleteModalToggleSlot={onFlatplanBulkDeleteModalToggleSlot}
                  flatplanBulkDeleteConfirmInput={flatplanBulkDeleteConfirmInput}
                  onFlatplanBulkDeleteConfirmInputChange={setFlatplanBulkDeleteConfirmInput}
                  onFlatplanBulkDeleteModalClose={closeFlatplanBulkDeleteModal}
                  onFlatplanBulkDeleteModalYes={onFlatplanBulkDeleteModalYes}
                  onFlatplanBulkDeleteModalFinal={onFlatplanBulkDeleteModalFinal}
                  flatplanBulkDeleteBusy={flatplanBulkDeleteBusy}
                  onFlatplanAddSlotToolbar={() => openFlatplanAddPlacement({ kind: "toolbar" })}
                  onFlatplanAddSlotAfterNine={() => openFlatplanAddPlacement({ kind: "after_numeric_9" })}
                  onFlatplanAddSlotBeforeEnd={() => openFlatplanAddPlacement({ kind: "before_end" })}
                  onFlatplanAddSlotAdjacent={(entryKey, side, opts) =>
                    openFlatplanAddPlacement({ kind: "adjacent", entryKey, side }, opts)
                  }
                  onFlatplanRelocateArticle={handleFlatplanRelocateArticle}
                />
              )}

              {activeTab === "contentsManager" && (
                <ContentsManagerTab
                  publicationId={publicationId}
                  magazine={magazine}
                  magazineId={publication.magazine_id}
                />
              )}
            </div>
          </div>
        </div>
      </PageContentSection>
      <FlatplanAddSlotModal
        open={flatplanAddSlotModalOpen && Boolean(publication)}
        onClose={() => {
          setFlatplanAddSlotModalOpen(false);
          setFlatplanAddSlotMeta({ initialPublicationPage: 10 });
        }}
        publicationId={publicationId}
        publicationFormat={String(publication?.publication_format ?? "flipbook")}
        initialPublicationPage={flatplanAddSlotMeta.initialPublicationPage}
        editorialPageBounds={flatplanEditorialPageBounds}
        reloadDocumentAfterCreate={Boolean(flatplanAddSlotMeta.reloadDocumentAfterCreate)}
        onCreated={load}
      />
      <DeletePublicationModal
        open={deletePublicationModalOpen}
        onClose={closeDeletePublicationModal}
        title={title}
        publicationId={publication.publication_id}
        confirmInput={deletePublicationConfirmInput}
        onConfirmInputChange={setDeletePublicationConfirmInput}
        canDelete={canDeletePublication}
      />
      <PublishMagazineModal
        open={publishMagazineModalOpen}
        onClose={() => setPublishMagazineModalOpen(false)}
        title={title}
        publication={publication}
        slots={slots}
      />
      <CoverMarginArticleSelectModal
        open={coverMarginArticleModalPosition != null}
        position={coverMarginArticleModalPosition ?? 0}
        onClose={() => setCoverMarginArticleModalPosition(null)}
        onSelectPlaceholder={selectPlaceholderCoverMarginArticle}
      />
      <MoveContentTypeModal
        open={moveContentTypeModal !== null}
        contentType={moveContentTypeModal?.contentType ?? "summary"}
        initialTarget={moveContentTypeModal?.initialTarget ?? null}
        preferentialSlots={preferentialSlots}
        onClose={() => setMoveContentTypeModal(null)}
        onConfirm={async (targetPosition, displacedPosition) => {
          if (moveContentTypeModal) {
            await moveReservedContentType(
              moveContentTypeModal.contentType,
              targetPosition,
              displacedPosition
            );
          }
        }}
      />
    </>
  );
};
