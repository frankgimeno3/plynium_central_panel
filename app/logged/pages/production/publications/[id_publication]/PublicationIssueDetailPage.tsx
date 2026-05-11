"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import MoveContentTypeModal, {
  MovableContentType,
} from "@/app/logged/logged_components/modals/MoveContentTypeModal";
import {
  BASE,
  CoverMarginArticleMiniature,
  DEFAULT_SLOT_CONTENT_TYPE,
  FLATPLAN_BUFFER_KEY,
  flatplanSlotSortKey,
  isNumericSlotKey,
  MagazineApiRow,
  MIN_FLATPLAN_NUMERIC_KEYS,
  normalizeSlotContentType,
  PADDING_SLOT_STATE,
  paddingSlotsNeeded,
  PreferentialSlotApiRow,
  PublicationDbRow,
  SlotRow,
  TabId,
} from "./_shared";
import { ContentsManagerTab } from "./_tabs/ContentsManagerTab";
import { DataTab } from "./_tabs/DataTab";
import { FlatplanTab } from "./_tabs/FlatplanTab";

const DELETE_CONFIRM_WORD = "confirm";

export const PublicationIssueDetailPage: FC<{ publicationId: string }> = ({ publicationId }) => {
  const { setPageMeta } = usePageContent();

  const [activeTab, setActiveTab] = useState<TabId>("data");
  const [publication, setPublication] = useState<PublicationDbRow | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [preferentialSlots, setPreferentialSlots] = useState<PreferentialSlotApiRow[]>([]);
  const [magazine, setMagazine] = useState<MagazineApiRow | null>(null);
  /** Flatplan tab: slots panel docked to 1/4 width with reduced table. */
  const [slotsReduced, setSlotsReduced] = useState(false);
  const [hoveredSlotId, setHoveredSlotId] = useState<number | null>(null);
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
  const [coverMarginArticleModalPosition, setCoverMarginArticleModalPosition] =
    useState<number | null>(null);
  const [coverMarginMiniatures, setCoverMarginMiniatures] = useState<
    CoverMarginArticleMiniature[]
  >(() =>
    Array.from({ length: 6 }, (_, index) => ({
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
      const slotList = slotsRes.ok ? ((await slotsRes.json()) as SlotRow[]) : [];
      setPublication(pub);
      setSlots(Array.isArray(slotList) ? slotList : []);
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
    } catch (e: any) {
      setPublication(null);
      setSlots([]);
      setPreferentialSlots([]);
      setMagazine(null);
      setError(e?.message ?? "Failed to load issue");
    } finally {
      setLoading(false);
    }
  }, [publicationId]);

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
    }
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
    setSaving(true);
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
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save changes");
      setAutoSaveStatus("error");
    } finally {
      setSaving(false);
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

  useEffect(() => {
    const title = publication?.publication_edition_name
      ? publication.publication_edition_name
      : `Issue ${publicationId}`;
    setPageMeta({
      pageTitle: title,
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: `${BASE}/issues` },
        { label: "Issues", href: `${BASE}/issues` },
        { label: title },
      ],
      buttons: [
        { label: "Back to Issues", href: `${BASE}/issues` },
        {
          label: "Delete Publication",
          onClick: openDeletePublicationModal,
          variant: "danger",
        },
        {
          label: "Publish Magazine",
          onClick: openPublishMagazineModal,
          variant: "primary",
        },
      ],
    });
  }, [
    setPageMeta,
    publication?.publication_edition_name,
    publicationId,
    openDeletePublicationModal,
    openPublishMagazineModal,
  ]);

  const slotByKey = useMemo(() => {
    const map = new Map<string, SlotRow>();
    slots.forEach((s) => map.set(String(s.slot_key || ""), s));
    return map;
  }, [slots]);

  /** publication_slots_db.publication_slot_id for slot_key='cover'. */
  const coverSlotId = useMemo(
    () => slotByKey.get("cover")?.publication_slot_id ?? null,
    [slotByKey]
  );

  const numericSlotKeys = useMemo(() => {
    return slots
      .map((s) => String(s.slot_key || ""))
      .filter((k) => isNumericSlotKey(k))
      .sort((a, b) => Number(a) - Number(b));
  }, [slots]);

  const maxNumericSlotKey = useMemo(() => {
    let m = 0;
    for (const k of numericSlotKeys) {
      const n = Number(k);
      if (Number.isFinite(n) && n > m) m = n;
    }
    return m;
  }, [numericSlotKeys]);

  const sortedSlotsForFlatplan = useMemo(() => {
    return [...slots].sort(
      (a, b) => flatplanSlotSortKey(String(a.slot_key)) - flatplanSlotSortKey(String(b.slot_key))
    );
  }, [slots]);

  /**
   * `flatplan_position_working_list`: invisible buffers at start/end; real slots are slice(1, -1).
   * Split so the LEFT column always has one row more than the right (`L = R + 1`).
   */
  const flatplanWorkingSplit = useMemo(() => {
    const inner: string[] = [];
    if (slotByKey.has("cover")) inner.push("cover");
    if (slotByKey.has("inside_cover")) inner.push("inside_cover");
    numericSlotKeys.forEach((k) => inner.push(k));
    if (slotByKey.has("end")) inner.push("end");
    const working = [FLATPLAN_BUFFER_KEY, ...inner, FLATPLAN_BUFFER_KEY];
    const n = working.length;
    const leftCount = n === 0 ? 0 : Math.min(n, Math.ceil(n / 2) + 1);
    return {
      working,
      leftKeys: working.slice(0, leftCount),
      rightKeys: working.slice(leftCount),
      leftCount,
    };
  }, [slotByKey, numericSlotKeys]);

  const slotKeyToWorkingIndex = useMemo(() => {
    const m = new Map<string, number>();
    flatplanWorkingSplit.working.forEach((k, i) => {
      if (k !== FLATPLAN_BUFFER_KEY) m.set(k, i);
    });
    return m;
  }, [flatplanWorkingSplit.working]);

  const hasMinimalFlatplanSlots = useMemo(() => {
    if (!slotByKey.has("cover") || !slotByKey.has("inside_cover") || !slotByKey.has("end")) return false;
    for (const n of MIN_FLATPLAN_NUMERIC_KEYS) {
      if (!slotByKey.has(String(n))) return false;
    }
    return true;
  }, [slotByKey]);

  const ensureCoreSlots = React.useCallback(async () => {
    if (!publication) return;

    const createIfMissing = async (slot_key: string) => {
      if (slotByKey.has(slot_key)) return;
      await fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slot_key,
          publication_format: publication.publication_format,
          slot_content_type: DEFAULT_SLOT_CONTENT_TYPE,
          slot_state: "pending",
        }),
      });
    };

    const keysToEnsure = ["cover", "inside_cover", "end", ...MIN_FLATPLAN_NUMERIC_KEYS.map(String)];
    await Promise.all(keysToEnsure.map((k) => createIfMissing(k)));
  }, [publication, slotByKey, publicationId]);

  useEffect(() => {
    if (!publication) return;
    if (hasMinimalFlatplanSlots) return;
    ensureCoreSlots()
      .then(() => load())
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publication?.publication_id, hasMinimalFlatplanSlots]);

  /**
   * Add `count` artificial padding slots right before `end`.
   */
  const ensurePaddingSlots = React.useCallback(
    async (count: number) => {
      if (!publication || count <= 0) return;
      let nextKey = (maxNumericSlotKey || 0) + 1;
      const requests: Promise<unknown>[] = [];
      for (let i = 0; i < count; i++) {
        const keyForThisOne = String(nextKey);
        requests.push(
          fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              slot_key: keyForThisOne,
              publication_format: publication.publication_format,
              slot_content_type: DEFAULT_SLOT_CONTENT_TYPE,
              slot_state: PADDING_SLOT_STATE,
            }),
          })
        );
        nextKey++;
      }
      await Promise.all(requests);
    },
    [publication, publicationId, maxNumericSlotKey]
  );

  useEffect(() => {
    if (!publication || !hasMinimalFlatplanSlots) return;
    const need = paddingSlotsNeeded(numericSlotKeys.length);
    if (need <= 0) return;
    ensurePaddingSlots(need)
      .then(() => load())
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publication?.publication_id, hasMinimalFlatplanSlots, numericSlotKeys.length]);

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
      new Set([
        "Preferential page 2",
        "Preferential page 4",
        "Preferential page 6",
      ]),
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
    [
      positionByPublicationSlotId,
      SWAPPABLE_PREFERENTIAL_POSITIONS,
      handleSlotTypeChange,
    ]
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
            href={`${BASE}/issues`}
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
          <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveTab("data")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "data"
                  ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Data
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeTab !== "flatplan") {
                  if (flatplanAutoCollapseTimerRef.current != null) {
                    clearTimeout(flatplanAutoCollapseTimerRef.current);
                    flatplanAutoCollapseTimerRef.current = null;
                  }
                  setActiveTab("flatplan");
                  setSlotsReduced(false);
                  flatplanAutoCollapseTimerRef.current = setTimeout(() => {
                    flatplanAutoCollapseTimerRef.current = null;
                    setSlotsReduced(true);
                  }, 120);
                  return;
                }
                setSlotsReduced(true);
              }}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "flatplan"
                  ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Flatplan
              <span className="ml-2 text-xs text-gray-500">({slots.length} slots)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contentsManager")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "contentsManager"
                  ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Contents Manager
            </button>
            <div className="flex-1" />
            {activeTab === "data" && (
              <div className="flex items-center mr-3 text-xs">
                {autoSaveStatus === "saving" ? (
                  <span className="inline-flex items-center gap-1.5 text-gray-500">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Saving…
                  </span>
                ) : autoSaveStatus === "saved" ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Saved
                  </span>
                ) : autoSaveStatus === "error" ? (
                  <span className="inline-flex items-center gap-1.5 text-red-600">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                    Save failed
                  </span>
                ) : hasPubChanges ? (
                  <span className="inline-flex items-center gap-1.5 text-gray-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300" />
                    Pending…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-gray-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300" />
                    All changes saved
                  </span>
                )}
              </div>
            )}
          </div>

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
                  maxNumericSlotKey={maxNumericSlotKey}
                  slotsReduced={slotsReduced}
                  setSlotsReduced={setSlotsReduced}
                  hoveredSlotId={hoveredSlotId}
                  setHoveredSlotId={setHoveredSlotId}
                  handleSlotsTableTypeChange={handleSlotsTableTypeChange}
                />
              )}

              {activeTab === "contentsManager" && (
                <ContentsManagerTab publicationId={publicationId} />
              )}
            </div>
          </div>
        </div>
      </PageContentSection>
      {deletePublicationModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-publication-modal-title"
          onClick={closeDeletePublicationModal}
        >
          <div
            className="w-full max-w-lg mx-4 overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2
                id="delete-publication-modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                Delete publication
              </h2>
              <button
                type="button"
                onClick={closeDeletePublicationModal}
                className="text-2xl leading-none text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 px-6 py-5">
              <p className="text-sm text-gray-700">
                You are about to delete this publication.
              </p>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-xs uppercase tracking-wide text-red-700">
                  Publication
                </p>
                <p className="mt-1 font-medium text-red-950">{title}</p>
                <p className="mt-1 font-mono text-xs text-red-800 break-all">
                  {publication?.publication_id}
                </p>
              </div>
              <label className="block text-sm font-medium text-gray-700">
                Type <span className="font-mono text-gray-900">{DELETE_CONFIRM_WORD}</span> to enable
                deletion
                <input
                  type="text"
                  autoComplete="off"
                  value={deletePublicationConfirmInput}
                  onChange={(event) => setDeletePublicationConfirmInput(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={DELETE_CONFIRM_WORD}
                />
              </label>
              <p className="text-xs text-gray-500">
                Deletion logic can be connected here once the final deletion rules are confirmed.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={closeDeletePublicationModal}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={closeDeletePublicationModal}
                disabled={!canDeletePublication}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete publication
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {publishMagazineModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-magazine-modal-title"
          onClick={() => setPublishMagazineModalOpen(false)}
        >
          <div
            className="w-full max-w-lg mx-4 overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2
                id="publish-magazine-modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                Publish magazine
              </h2>
              <button
                type="button"
                onClick={() => setPublishMagazineModalOpen(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 px-6 py-5">
              <p className="text-sm text-gray-700">
                Review this publication before publishing the magazine issue.
              </p>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs uppercase tracking-wide text-blue-700">
                  Magazine issue
                </p>
                <p className="mt-1 font-medium text-blue-950">{title}</p>
                <p className="mt-1 text-xs text-blue-800">
                  Current status:{" "}
                  <span className="font-semibold">
                    {publication.publication_status || "—"}
                  </span>
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Publishing logic can be connected here once the final publication workflow is confirmed.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setPublishMagazineModalOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setPublishMagazineModalOpen(false)}
                className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900"
              >
                Publish magazine
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {coverMarginArticleModalPosition != null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cover-margin-article-modal-title"
          onClick={() => setCoverMarginArticleModalPosition(null)}
        >
          <div
            className="w-full max-w-xl mx-4 overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2
                id="cover-margin-article-modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                Select article from publication
              </h2>
              <button
                type="button"
                onClick={() => setCoverMarginArticleModalPosition(null)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
                vitae neque vitae justo congue luctus. This placeholder will be
                replaced by the publication article selector.
              </p>
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Target position
                </p>
                <p className="mt-1 font-mono text-sm text-gray-800">
                  {coverMarginArticleModalPosition}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setCoverMarginArticleModalPosition(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  selectPlaceholderCoverMarginArticle(coverMarginArticleModalPosition)
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Select placeholder article
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
