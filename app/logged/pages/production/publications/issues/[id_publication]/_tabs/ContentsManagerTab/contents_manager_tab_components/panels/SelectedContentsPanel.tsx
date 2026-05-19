"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProjectSelectModal, {
  type ProjectRow,
} from "@/app/logged/logged_components/modals/ProjectSelectModal";
import PublicationSlotPickerModal, {
  type PublicationSlotPickerRow,
} from "@/app/logged/logged_components/modals/PublicationSlotPickerModal";
import { FlatplanAddSlotModal } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/FlatplanTab/flatplan_tab_components/FlatplanAddSlotModal";
import { editorialPublicationPageBoundsInclusive } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/FlatplanTab/flatplan_tab_components/flatplanInsertPlacement";
import {
  BASE,
  comparePublicationSlotsFlatplanOrder,
  type SlotRow,
} from "@/app/logged/pages/production/publications/publication_components/_shared";

export type SelectedContentsPanelProps = {
  publicationId: string;
};

type SelectedContentRow = {
  publication_article_id: string;
  publication_id: string;
  article_id: string;
  publication_slots_id_array: number[];
  desired_page_count: number;
  chunks_count: number;
  publication_article_created_at: string | null;
  publication_article_updated_at: string | null;
  article: {
    article_title: string;
    article_subtitle: string | null;
    article_main_image_url: string | null;
    article_date: string | null;
  } | null;
};

type PublicationSlotRow = {
  publication_slot_id: number;
  slot_key: string;
  publication_page?: number | null;
  slot_content_type?: string | null;
  project_id: string | null;
  project_contract_id: string | null;
  customer_name: string | null;
};

const STANDALONE_ARTICLE_PREFIX = "local_standalone:";

function isStandaloneMagazineArticle(articleId: string): boolean {
  return String(articleId ?? "").startsWith(STANDALONE_ARTICLE_PREFIX);
}

function slotKeyLabel(key: string | null | undefined, publicationPage?: number | null): string {
  const k = String(key ?? "").trim().toLowerCase();
  if (!k) return "—";
  if (k === "cover") return "Cover";
  if (k === "inside_cover" || k === "inside cover") return "Inside cover";
  if (k === "end" || k === "end_page" || k === "end page") return "End page";
  if (k === "regular_page") return "Regular page";
  if (
    k === "preferential_page" &&
    publicationPage != null &&
    Number.isFinite(Number(publicationPage))
  ) {
    return `Preferential ${Math.round(Number(publicationPage))}`;
  }
  const n = Number(k);
  if (Number.isFinite(n)) return `Page ${n}`;
  return String(key ?? "");
}

/** One-line magazine place for a linked slot (cover / inside / end / page number). */
function linkedPublicationSlotPlaceTitle(
  slot: PublicationSlotRow | undefined,
  publicationSlotId: number
): string {
  if (!slot) return `Slot #${publicationSlotId} (missing)`;
  const k = String(slot.slot_key ?? "").trim().toLowerCase();
  const pp = slot.publication_page;
  const pageNum =
    pp != null && Number.isFinite(Number(pp)) ? Math.round(Number(pp)) : null;
  if (k === "cover") return "Cover";
  if (k === "inside_cover" || k === "inside cover") return "Inside cover";
  if (k === "end" || k === "end_page" || k === "end page") return "End";
  if (k === "preferential_page" && pageNum != null) return `Preferential page ${pageNum}`;
  if (pageNum != null) return `Page ${pageNum}`;
  return slotKeyLabel(slot.slot_key, slot.publication_page);
}

function slotsAssignmentMismatch(
  row: SelectedContentRow,
  slotsById: Map<number, PublicationSlotRow>
): boolean {
  const want = Number(row.desired_page_count);
  const ids = Array.isArray(row.publication_slots_id_array) ? row.publication_slots_id_array : [];
  if (ids.length !== want) return true;
  for (let i = 0; i < ids.length; i++) {
    const sid = Number(ids[i]);
    if (!Number.isFinite(sid)) return true;
    const slot = slotsById.get(sid);
    if (!slot) return true;
    if (!isArticleRegularPageSlotRow(slot)) return true;
  }
  return false;
}

function isArticleRegularPageSlotRow(slot: PublicationSlotRow | undefined): boolean {
  if (!slot) return false;
  return (
    String(slot.slot_key ?? "").trim().toLowerCase() === "regular_page" &&
    String(slot.slot_content_type ?? "").trim().toLowerCase() === "article"
  );
}

/** Pages (0..desired-1) still missing a valid article `regular_page` slot, or all `desired` if id count ≠ desired. */
function countUnassignedArticleSlotPages(
  row: SelectedContentRow,
  slotsById: Map<number, PublicationSlotRow>
): number {
  const desired = Math.max(0, Math.round(Number(row.desired_page_count)) || 0);
  if (desired < 1) return 0;
  const slotIds = Array.isArray(row.publication_slots_id_array)
    ? row.publication_slots_id_array.map(Number).filter((n) => Number.isFinite(n))
    : [];
  if (slotIds.length !== desired) return desired;
  let n = 0;
  for (let i = 0; i < desired; i++) {
    const sid = slotIds[i];
    const slot = sid != null ? slotsById.get(sid) : undefined;
    if (!isArticleRegularPageSlotRow(slot)) n += 1;
  }
  return n;
}

export function SelectedContentsPanel({ publicationId }: SelectedContentsPanelProps) {
  const [items, setItems] = useState<SelectedContentRow[]>([]);
  const [slots, setSlots] = useState<PublicationSlotRow[]>([]);
  const [publicationFormat, setPublicationFormat] = useState<string>("flipbook");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyPublicationArticleId, setBusyPublicationArticleId] = useState<string | null>(null);
  /** `${publication_article_id}:${pageIndex}` while PATCH-coercing slot type + reload */
  const [busyFixSlotTypeKey, setBusyFixSlotTypeKey] = useState<string | null>(null);

  const [provisionRow, setProvisionRow] = useState<SelectedContentRow | null>(null);
  const [provisionStartPage, setProvisionStartPage] = useState("10");
  const [provisionBusy, setProvisionBusy] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  /** True: all magazine pages already have valid article slots — dialog edits starting publication_page only. */
  const [provisionRelocateMode, setProvisionRelocateMode] = useState(false);

  const [slotPickCtx, setSlotPickCtx] = useState<{
    publicationArticleId: string;
    pageIndex: number;
  } | null>(null);

  const [addSlotCtx, setAddSlotCtx] = useState<{
    publicationArticleId: string;
    pageIndex: number;
    initialPublicationPage: number;
  } | null>(null);

  const [projectPickerForPublicationArticleId, setProjectPickerForPublicationArticleId] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [contentsRes, slotsRes, pubRes] = await Promise.all([
        fetch(`/api/v1/publications/${encodeURIComponent(publicationId)}/publication-articles`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}`, {
          cache: "no-store",
          credentials: "include",
        }),
      ]);
      if (!contentsRes.ok) {
        const txt = await contentsRes.text().catch(() => "");
        throw new Error(txt || "Failed to load selected contents");
      }
      const contentsJson = (await contentsRes.json()) as { items?: SelectedContentRow[] };
      setItems(Array.isArray(contentsJson?.items) ? contentsJson.items : []);
      if (slotsRes.ok) {
        const slotJson = (await slotsRes.json()) as PublicationSlotRow[];
        setSlots(Array.isArray(slotJson) ? slotJson : []);
      } else {
        setSlots([]);
      }
      if (pubRes.ok) {
        const pubJson = (await pubRes.json()) as { publication_format?: string };
        setPublicationFormat(String(pubJson?.publication_format ?? "flipbook"));
      }
    } catch (e: unknown) {
      setItems([]);
      setSlots([]);
      setLoadError(e instanceof Error ? e.message : "Failed to load selected contents");
    } finally {
      setLoading(false);
    }
  }, [publicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const slotsById = useMemo(() => {
    const map = new Map<number, PublicationSlotRow>();
    for (const slot of slots) {
      map.set(Number(slot.publication_slot_id), slot);
    }
    return map;
  }, [slots]);

  const sortedSlotsForBounds = useMemo(() => {
    return [...(slots as SlotRow[])].sort(comparePublicationSlotsFlatplanOrder);
  }, [slots]);

  const editorialBounds = useMemo(
    () => editorialPublicationPageBoundsInclusive(sortedSlotsForBounds),
    [sortedSlotsForBounds]
  );

  const closeProvisionDialog = useCallback(() => {
    setProvisionRow(null);
    setProvisionRelocateMode(false);
  }, []);

  const provisionPageSelectOptions = useMemo(() => {
    if (!editorialBounds) return [];
    const list: number[] = [];
    for (let p = editorialBounds.minPage; p <= editorialBounds.maxPage; p++) {
      list.push(p);
    }
    return list;
  }, [editorialBounds]);

  useEffect(() => {
    if (provisionRow == null) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (!provisionBusy) closeProvisionDialog();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [provisionRow, provisionBusy, closeProvisionDialog]);

  const slotPickRow = useMemo(
    () => items.find((row) => row.publication_article_id === slotPickCtx?.publicationArticleId) ?? null,
    [items, slotPickCtx]
  );

  const projectPickerRow = useMemo(
    () =>
      items.find((row) => row.publication_article_id === projectPickerForPublicationArticleId) ?? null,
    [items, projectPickerForPublicationArticleId]
  );

  const projectPickerCurrentProjectId = useMemo(() => {
    if (!projectPickerRow) return null;
    const slotId = projectPickerRow.publication_slots_id_array?.[0];
    if (!slotId) return null;
    return slotsById.get(slotId)?.project_id ?? null;
  }, [projectPickerRow, slotsById]);

  const articleBuilderHref = useCallback(
    (publicationArticleId: string) =>
      `${BASE}/${encodeURIComponent(publicationId)}/article_builder/${encodeURIComponent(
        publicationArticleId
      )}`,
    [publicationId]
  );

  const assignSlotPage = useCallback(
    async (publicationArticleId: string, pageIndex: number, publicationSlotId: number) => {
      setActionMessage(null);
      setActionError(null);
      setBusyPublicationArticleId(publicationArticleId);
      try {
        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/slot-page`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              page_index: pageIndex,
              publication_slot_id: publicationSlotId,
            }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          let msg = txt || "Failed to assign slot";
          try {
            const j = JSON.parse(txt) as { message?: string };
            if (j?.message) msg = String(j.message);
          } catch {
            /* ignore */
          }
          throw new Error(msg);
        }
        setActionMessage("Slot assignment updated.");
        setSlotPickCtx(null);
        setAddSlotCtx(null);
        await load();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to assign slot");
      } finally {
        setBusyPublicationArticleId(null);
      }
    },
    [load]
  );

  const fixSlotTypeKey = (publicationArticleId: string, pageIndex: number) =>
    `${publicationArticleId}:${pageIndex}`;

  const handleFixRegularPageSlotToArticle = useCallback(
    async (row: SelectedContentRow, pageIndex: number) => {
      const key = fixSlotTypeKey(row.publication_article_id, pageIndex);
      setActionMessage(null);
      setActionError(null);
      setBusyFixSlotTypeKey(key);
      try {
        const arr = Array.isArray(row.publication_slots_id_array)
          ? row.publication_slots_id_array.map(Number).filter((n) => Number.isFinite(n))
          : [];
        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(row.publication_article_id)}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ publication_slots_id_array: arr }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          let msg = txt || "Failed to fix slot type";
          try {
            const j = JSON.parse(txt) as { message?: string };
            if (j?.message) msg = String(j.message);
          } catch {
            /* ignore */
          }
          throw new Error(msg);
        }
        window.location.reload();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to fix slot type");
      } finally {
        setBusyFixSlotTypeKey(null);
      }
    },
    []
  );

  const handlePickExistingConfirm = useCallback(
    async (slotIds: number[]) => {
      if (!slotPickCtx || slotIds.length !== 1) return;
      await assignSlotPage(slotPickCtx.publicationArticleId, slotPickCtx.pageIndex, slotIds[0]);
    },
    [slotPickCtx, assignSlotPage]
  );

  const handleProvisionConfirm = useCallback(async () => {
    if (!provisionRow) return;
    const wasRelocate = provisionRelocateMode;
    const parsed = Number(provisionStartPage.trim());
    if (!Number.isInteger(parsed)) {
      setProvisionError(
        wasRelocate ? "Choose a valid publication page from the list." : "Enter a whole number for the starting publication page."
      );
      return;
    }
    if (!editorialBounds) {
      setProvisionError("Could not read editorial page bounds (missing end slot).");
      return;
    }
    if (parsed < editorialBounds.minPage || parsed > editorialBounds.maxPage) {
      setProvisionError(
        `Starting page must be between ${editorialBounds.minPage} and ${editorialBounds.maxPage} (inclusive).`
      );
      return;
    }

    setProvisionBusy(true);
    setProvisionError(null);
    setBusyPublicationArticleId(provisionRow.publication_article_id);
    try {
      const res = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(
          provisionRow.publication_article_id
        )}/provision-consecutive-slots`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ start_publication_page: parsed }),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let msg = txt || (wasRelocate ? "Failed to move slot block" : "Failed to assign slots");
        try {
          const j = JSON.parse(txt) as { message?: string };
          if (j?.message) msg = String(j.message);
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      setActionMessage(
        wasRelocate
          ? "Editorial block moved: the first page uses your chosen publication_page; further article pages use the following consecutive publication pages (same rules as Assign slots)."
          : "Slots assigned consecutively. Existing free article slots were reused where possible; otherwise new slots were inserted and later pages shifted forward (same rules as Flatplan “Add slot”)."
      );
      closeProvisionDialog();
      await load();
    } catch (e: unknown) {
      setProvisionError(e instanceof Error ? e.message : "Failed to assign slots");
    } finally {
      setProvisionBusy(false);
      setBusyPublicationArticleId(null);
    }
  }, [provisionRow, provisionStartPage, provisionRelocateMode, editorialBounds, load, closeProvisionDialog]);

  const handleLinkProject = useCallback(
    async (project: ProjectRow) => {
      const row = projectPickerRow;
      if (!row) return;
      const slotId = row.publication_slots_id_array?.[0];
      if (!slotId) {
        setActionError("Assign at least one magazine slot before linking a project.");
        setProjectPickerForPublicationArticleId(null);
        return;
      }
      setActionMessage(null);
      setActionError(null);
      setBusyPublicationArticleId(row.publication_article_id);
      try {
        const res = await fetch(`/api/v1/publication-slots/${slotId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ project_id: project.id_project }),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to link project");
        }
        setActionMessage(`Project ${project.id_project} linked to slot #${slotId}.`);
        setProjectPickerForPublicationArticleId(null);
        await load();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to link project");
      } finally {
        setBusyPublicationArticleId(null);
      }
    },
    [projectPickerRow, load]
  );

  const handleRemoveContent = useCallback(
    async (publicationArticleId: string) => {
      if (!publicationArticleId) return;
      const confirmed = window.confirm(
        "Remove this publication article? Linked chunks will be deleted; slots remain in the flatplan."
      );
      if (!confirmed) return;
      setActionMessage(null);
      setActionError(null);
      setBusyPublicationArticleId(publicationArticleId);
      try {
        const res = await fetch(`/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to remove");
        }
        setActionMessage("Publication article removed.");
        await load();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to remove");
      } finally {
        setBusyPublicationArticleId(null);
      }
    },
    [load]
  );

  const isSlotSelectable = useCallback((slot: PublicationSlotPickerRow) => {
    const key = String(slot.slot_key ?? "").trim().toLowerCase();
    const type = String(slot.slot_content_type ?? "").trim().toLowerCase();
    return key === "regular_page" && type === "article";
  }, []);

  const openProvisionForRow = useCallback(
    (row: SelectedContentRow) => {
      setProvisionError(null);
      setProvisionRow(row);
      const desired = Math.max(0, Math.round(Number(row.desired_page_count)) || 0);
      const unassigned = countUnassignedArticleSlotPages(row, slotsById);
      const fullyAssigned = desired > 0 && unassigned === 0;

      if (fullyAssigned && editorialBounds) {
        const slotArr = Array.isArray(row.publication_slots_id_array)
          ? row.publication_slots_id_array.map(Number).filter((n) => Number.isFinite(n))
          : [];
        const firstSid = slotArr[0];
        const firstSlot = firstSid != null ? slotsById.get(firstSid) : undefined;
        const pp =
          firstSlot?.publication_page != null && Number.isFinite(Number(firstSlot.publication_page))
            ? Math.round(Number(firstSlot.publication_page))
            : editorialBounds.minPage;
        const clamped = Math.min(editorialBounds.maxPage, Math.max(editorialBounds.minPage, pp));
        setProvisionRelocateMode(true);
        setProvisionStartPage(String(clamped));
      } else {
        setProvisionRelocateMode(false);
        const hint =
          editorialBounds != null
            ? String(Math.min(editorialBounds.maxPage, Math.max(editorialBounds.minPage, 10)))
            : "10";
        setProvisionStartPage(hint);
      }
    },
    [editorialBounds, slotsById]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Magazine articles selected for this publication. Assign one editorial slot per desired page.
        </p>
        <Link
          href={`${BASE}/${encodeURIComponent(publicationId)}/article_builder/new`}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Create new article
        </Link>
      </div>

      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {actionError}
        </div>
      ) : null}
      {actionMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {actionMessage}
        </div>
      ) : null}

      {loadError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {loadError}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Loading selected contents…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          No publication articles yet. Use{" "}
          <span className="font-medium text-gray-700">Create new article</span> or pick a portal article from{" "}
          <span className="font-medium text-gray-700">Available portal articles</span>.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-600 bg-slate-950 text-white">
          <table className="min-w-[1120px] w-full text-sm text-white">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-white">publication_article_id</th>
                <th className="px-3 py-2 text-left font-medium text-white">Publication slots</th>
                <th className="px-3 py-2 text-left font-medium text-white">pages</th>
                <th className="px-3 py-2 text-left font-medium text-white">Article chunks</th>
                <th className="px-3 py-2 text-left font-medium text-white">Portal article relations</th>
                <th className="px-3 py-2 text-left font-medium text-white">Project / contract</th>
                <th className="px-3 py-2 text-right font-medium text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const busy = busyPublicationArticleId === row.publication_article_id;
                const slotIds = Array.isArray(row.publication_slots_id_array)
                  ? row.publication_slots_id_array.map(Number).filter((n) => Number.isFinite(n))
                  : [];
                const mismatch = slotsAssignmentMismatch(row, slotsById);
                const desiredSlotPages = Math.max(0, Math.round(Number(row.desired_page_count)) || 0);
                const unassignedSlotPages = countUnassignedArticleSlotPages(row, slotsById);
                const fullyAssignedValid =
                  desiredSlotPages > 0 && unassignedSlotPages === 0;
                const primarySlotId = slotIds[0];
                const primarySlot = primarySlotId != null ? slotsById.get(primarySlotId) : null;
                const standalone = isStandaloneMagazineArticle(row.article_id);

                return (
                  <tr
                    key={row.publication_article_id}
                    className="border-t border-slate-700 hover:bg-slate-900/80 align-top"
                  >
                    <td className="px-3 py-3 font-mono text-[11px] text-white break-all max-w-[200px]">
                      {row.publication_article_id}
                    </td>
                    <td className="px-3 py-3 min-w-[220px] max-w-[300px] align-top">
                      <div className="space-y-2">
                        {slotIds.length > 0 ? (
                          <div className="flex flex-wrap items-end gap-y-2">
                            {slotIds.map((sid, idx) => {
                              const slot = slotsById.get(sid);
                              const title = linkedPublicationSlotPlaceTitle(slot, sid);
                              return (
                                <React.Fragment key={`${row.publication_article_id}-ps-${sid}`}>
                                  {idx > 0 ? (
                                    <span
                                      className="mx-1 self-center text-sm font-medium text-white"
                                      aria-hidden
                                    >
                                      ,
                                    </span>
                                  ) : null}
                                  <div className="inline-flex max-w-[148px] flex-col rounded-md border border-slate-600 bg-slate-900/90 px-2.5 py-1.5 shadow-sm">
                                    <p className="text-[11px] font-semibold leading-snug text-white">
                                      {title}
                                    </p>
                                    <p className="mt-0.5 font-mono text-[10px] text-white">#{sid}</p>
                                  </div>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-white">—</p>
                        )}
                        {mismatch ? (
                          <p className="text-[11px] leading-snug text-white">
                            After changing desired pages in Article Builder, slot assignments can fall out of
                            sync. Use the control below (
                            <span className="font-semibold">Needs slot assignment [X/Y] → Assign slots</span>) for
                            a consecutive block (reuses free article pages when possible, otherwise inserts and
                            shifts like Flatplan). For the first page only, you can also use{" "}
                            <span className="font-semibold">Pick existing slot</span> or{" "}
                            <span className="font-semibold">Create slot</span> in the{" "}
                            <span className="font-semibold">pages</span> column; further pages then follow in
                            order.
                          </p>
                        ) : null}
                        <button
                          type="button"
                          disabled={busy || !editorialBounds}
                          onClick={() => openProvisionForRow(row)}
                          className={`flex w-full max-w-md flex-wrap items-center justify-start gap-x-1.5 gap-y-1 rounded-lg border px-3 py-2 text-left text-xs font-medium transition disabled:opacity-40 ${
                            mismatch
                              ? "border-amber-500/60 bg-amber-950/45 text-white hover:bg-amber-950/60"
                              : fullyAssignedValid
                                ? "border-violet-500/50 bg-violet-950/40 text-white hover:bg-violet-900/55"
                                : "border-sky-400/50 bg-sky-950/50 text-white hover:bg-sky-900/60"
                          }`}
                        >
                          <span className="font-semibold text-white">
                            {unassignedSlotPages > 0 ? "Needs slot assignment" : "Slots"}
                          </span>
                          <span className="font-mono text-[11px] text-white opacity-95">
                            [{unassignedSlotPages}/{desiredSlotPages}]
                          </span>
                          <span className="text-white" aria-hidden>
                            →
                          </span>
                          <span className="font-semibold text-white">
                            {fullyAssignedValid ? "Edit slot location" : "Assign slots"}
                          </span>
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 min-w-[280px]">
                      <div className="space-y-2">
                        <span className="text-[11px] uppercase tracking-wide text-white">
                          {row.desired_page_count} page{row.desired_page_count === 1 ? "" : "s"} desired
                        </span>
                        <div className="flex flex-col gap-2 pt-1">
                          {Array.from({ length: row.desired_page_count }, (_, pageIndex) => {
                            const sid = slotIds[pageIndex];
                            const slot = sid != null ? slotsById.get(sid) : undefined;
                            const valid = isArticleRegularPageSlotRow(slot);
                            const slotIdPresent = sid != null && Number.isFinite(Number(sid));
                            const slotLinked = slotIdPresent && slot != null;
                            const curLen = slotIds.length;
                            const canInteract =
                              pageIndex <= curLen &&
                              (pageIndex === curLen || pageIndex < curLen);
                            const showPickCreate = pageIndex === 0 && !valid;

                            return (
                              <div
                                key={`slot-${row.publication_article_id}-${pageIndex}`}
                                className="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2"
                              >
                                <p className="text-xs font-semibold text-white">
                                  Page {pageIndex + 1}
                                  {valid && sid != null ? (
                                    <span className="ml-2 font-mono text-[11px] font-normal text-white">
                                      #{sid} ·{" "}
                                      {slotKeyLabel(slot?.slot_key, slot?.publication_page)}
                                      {slot?.publication_page != null && Number.isFinite(Number(slot.publication_page))
                                        ? ` · pub.page ${Math.round(Number(slot.publication_page))}`
                                        : ""}
                                    </span>
                                  ) : slotLinked ? (
                                    <span className="ml-2 block font-mono text-[11px] font-normal text-white">
                                      <span>
                                        #{sid} ·{" "}
                                        {slotKeyLabel(slot?.slot_key, slot?.publication_page)}
                                        {slot?.publication_page != null &&
                                        Number.isFinite(Number(slot.publication_page))
                                          ? ` · pub.page ${Math.round(Number(slot.publication_page))}`
                                          : ""}
                                      </span>
                                      <span className="mt-1 block text-[10px] font-normal leading-snug text-white">
                                        Linked in <span className="font-semibold">Publication slots</span>, but
                                        this row must be{" "}
                                        <span className="font-semibold">regular_page</span> +{" "}
                                        <span className="font-semibold">article</span> to count here (currently{" "}
                                        <span className="font-semibold">
                                          {String(slot?.slot_key ?? "—").trim() || "—"}
                                        </span>{" "}
                                        /{" "}
                                        <span className="font-semibold">
                                          {String(slot?.slot_content_type ?? "—").trim() || "—"}
                                        </span>
                                        ). Use <span className="font-semibold">Assign slots</span> or fix the slot
                                        type.
                                      </span>
                                      {String(slot?.slot_key ?? "").trim().toLowerCase() === "regular_page" &&
                                      String(slot?.slot_content_type ?? "").trim().toLowerCase() !==
                                        "article" ? (
                                        <button
                                          type="button"
                                          disabled={
                                            busy ||
                                            provisionBusy ||
                                            busyFixSlotTypeKey ===
                                              fixSlotTypeKey(row.publication_article_id, pageIndex)
                                          }
                                          onClick={() =>
                                            void handleFixRegularPageSlotToArticle(row, pageIndex)
                                          }
                                          className="mt-2 rounded border border-amber-500/70 bg-amber-950/70 px-2.5 py-1.5 text-left text-[11px] font-medium text-white hover:bg-amber-900/60 disabled:opacity-40"
                                        >
                                          Set slot to editorial (article) and reload
                                        </button>
                                      ) : null}
                                    </span>
                                  ) : slotIdPresent && !slot ? (
                                    <span className="ml-2 font-mono text-[11px] font-normal text-white">
                                      {`#${sid} — slot not found in this issue's slot list (reload or check DB).`}
                                    </span>
                                  ) : (
                                    <span className="ml-2 text-[11px] font-normal text-white">
                                      — not assigned yet
                                    </span>
                                  )}
                                </p>
                                {showPickCreate ? (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={busy || !canInteract}
                                      title={
                                        pageIndex > curLen
                                          ? "Assign earlier magazine pages first (no gaps)."
                                          : undefined
                                      }
                                      onClick={() =>
                                        setSlotPickCtx({
                                          publicationArticleId: row.publication_article_id,
                                          pageIndex,
                                        })
                                      }
                                      className="rounded border border-slate-500 bg-slate-800 px-2 py-1 text-[11px] text-white hover:bg-slate-700 disabled:opacity-40"
                                    >
                                      Pick existing slot
                                    </button>
                                    <button
                                      type="button"
                                      disabled={busy || !canInteract || !editorialBounds}
                                      title={
                                        pageIndex > curLen
                                          ? "Assign earlier magazine pages first (no gaps)."
                                          : undefined
                                      }
                                      onClick={() =>
                                        setAddSlotCtx({
                                          publicationArticleId: row.publication_article_id,
                                          pageIndex,
                                          initialPublicationPage: editorialBounds
                                            ? Math.min(
                                                editorialBounds.maxPage,
                                                Math.max(editorialBounds.minPage, 10)
                                              )
                                            : 10,
                                        })
                                      }
                                      className="rounded border border-emerald-600/50 bg-emerald-950/40 px-2 py-1 text-[11px] text-white hover:bg-emerald-900/50 disabled:opacity-40"
                                    >
                                      Create slot (Flatplan-style)
                                    </button>
                                  </div>
                                ) : null}
                                {!valid && pageIndex > 0 && !slotLinked ? (
                                  <p className="mt-2 text-[10px] leading-snug text-white">
                                    Additional pages use the next consecutive slots — use{" "}
                                    <span className="font-semibold text-white">Assign slots</span> in
                                    Publication slots, or complete page 1 first.
                                  </p>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-white tabular-nums align-top">{row.chunks_count}</td>
                    <td className="px-3 py-3 min-w-[220px]">
                      {standalone ? (
                        <div className="rounded-lg border border-slate-600 bg-slate-900/40 px-3 py-2">
                          <p className="text-xs font-medium text-white">Not related to any portal article</p>
                          <p className="mt-1 text-[11px] text-white">
                            This magazine article was created from scratch. You can still build pages and chunks
                            in the Article Builder.
                          </p>
                        </div>
                      ) : row.article ? (
                        <div className="flex items-start gap-3">
                          {row.article.article_main_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.article.article_main_image_url}
                              alt={row.article.article_title ?? row.article_id}
                              className="h-12 w-16 shrink-0 rounded-md border border-slate-600 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-500 bg-slate-900 text-[10px] text-white">
                              No image
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold leading-snug text-white line-clamp-2">
                              {row.article.article_title || row.article_id}
                            </p>
                            {row.article.article_subtitle ? (
                              <p className="text-xs text-white line-clamp-2">{row.article.article_subtitle}</p>
                            ) : null}
                            <p className="mt-1 font-mono text-[10px] text-white truncate">{row.article_id}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-slate-600 bg-slate-900/40 px-3 py-2">
                          <p className="text-xs text-white">
                            Portal metadata missing for <span className="font-mono">{row.article_id}</span>
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {primarySlot?.project_id ? (
                        <div className="space-y-1">
                          <p className="text-xs text-white">
                            Linked project:{" "}
                            <span className="font-mono font-medium">{primarySlot.project_id}</span>
                          </p>
                          {primarySlot.project_contract_id ? (
                            <p className="text-[11px] text-white">
                              Contract: {primarySlot.project_contract_id}
                            </p>
                          ) : null}
                          {primarySlot.customer_name ? (
                            <p className="text-[11px] text-white">{primarySlot.customer_name}</p>
                          ) : null}
                          <button
                            type="button"
                            onClick={() =>
                              setProjectPickerForPublicationArticleId(row.publication_article_id)
                            }
                            disabled={busy}
                            className="rounded-lg border border-slate-500 bg-slate-800 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                          >
                            Change project / contract
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setProjectPickerForPublicationArticleId(row.publication_article_id)
                          }
                          disabled={busy || primarySlotId == null}
                          title={primarySlotId == null ? "Assign page 1 slot before linking a project." : undefined}
                          className="rounded-lg border border-slate-500 bg-slate-800 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Link project / contract
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void handleRemoveContent(row.publication_article_id)}
                          disabled={busy}
                          className="rounded-lg border border-red-400/60 bg-red-950/40 px-3 py-1 text-xs font-medium text-white hover:bg-red-950/70 disabled:opacity-50"
                        >
                          Remove
                        </button>
                        <Link
                          href={articleBuilderHref(row.publication_article_id)}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500"
                        >
                          Open Article Builder
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {provisionRow ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !provisionBusy) closeProvisionDialog();
          }}
        >
          <div
            className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 pr-10 pt-10 text-gray-900 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-slots-dialog-title"
          >
            <button
              type="button"
              aria-label="Close dialog"
              disabled={provisionBusy}
              onClick={() => {
                if (!provisionBusy) closeProvisionDialog();
              }}
              className="absolute right-2 top-2 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40"
            >
              <span className="text-2xl leading-none" aria-hidden>
                ×
              </span>
            </button>
            <h2 id="assign-slots-dialog-title" className="text-lg font-semibold pr-6">
              {provisionRelocateMode ? "Edit slot location" : "Assign slots"}
            </h2>
            {provisionRelocateMode ? (
              <>
                <p className="mt-2 text-xs leading-relaxed text-gray-600">
                  This article uses <span className="font-semibold">{provisionRow.desired_page_count}</span>{" "}
                  consecutive editorial page{provisionRow.desired_page_count === 1 ? "" : "s"}. Only the{" "}
                  <span className="font-semibold">first</span> magazine page maps to the{" "}
                  <span className="font-semibold">publication_page</span> you choose below; the other pages use
                  the following consecutive publication pages in order (same backend as Assign slots).
                </p>
                <p className="mt-2 text-xs text-gray-700">
                  Current starting <span className="font-mono">publication_page</span>:{" "}
                  <span className="font-semibold font-mono">
                    {(() => {
                      const sid = provisionRow.publication_slots_id_array?.[0];
                      if (sid == null || !Number.isFinite(Number(sid))) return "—";
                      const sl = slotsById.get(Number(sid));
                      if (sl?.publication_page == null || !Number.isFinite(Number(sl.publication_page))) {
                        return "—";
                      }
                      return String(Math.round(Number(sl.publication_page)));
                    })()}
                  </span>
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                Creates or reuses <span className="font-semibold">{provisionRow.desired_page_count}</span>{" "}
                consecutive <span className="font-mono">regular_page</span> slots with type{" "}
                <span className="font-semibold">article</span>, starting at the publication page you choose.
                When a page is missing an eligible slot, new rows are inserted and later editorial pages shift
                forward — matching Flatplan &quot;Add editorial slot&quot; behaviour. If a page only has
                non-article editorial slots, you will get an error and should pick another starting page.
              </p>
            )}
            {editorialBounds ? (
              <p className="mt-2 text-xs text-gray-500">
                Allowed range: <span className="font-semibold">{editorialBounds.minPage}</span>–
                <span className="font-semibold">{editorialBounds.maxPage}</span>.
              </p>
            ) : (
              <p className="mt-2 text-xs text-amber-700">Could not resolve editorial page bounds.</p>
            )}
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              {provisionRelocateMode
                ? "New starting publication_page (first magazine page)"
                : "Starting publication_page"}
            </label>
            {provisionRelocateMode ? (
              <select
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 disabled:opacity-50"
                value={
                  provisionPageSelectOptions.includes(Number(provisionStartPage))
                    ? provisionStartPage
                    : String(provisionPageSelectOptions[0] ?? "")
                }
                disabled={provisionBusy || provisionPageSelectOptions.length === 0}
                onChange={(e) => setProvisionStartPage(e.target.value)}
              >
                {provisionPageSelectOptions.map((p) => (
                  <option key={p} value={String(p)}>
                    Publication page {p}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                inputMode="numeric"
                value={provisionStartPage}
                onChange={(e) => setProvisionStartPage(e.target.value.replace(/\D/g, ""))}
                disabled={provisionBusy}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono disabled:opacity-50"
              />
            )}
            {provisionError ? (
              <p className="mt-2 text-sm text-red-600">{provisionError}</p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={provisionBusy}
                onClick={() => {
                  if (!provisionBusy) closeProvisionDialog();
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={provisionBusy || !editorialBounds}
                onClick={() => void handleProvisionConfirm()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {provisionBusy
                  ? provisionRelocateMode
                    ? "Applying…"
                    : "Assigning…"
                  : provisionRelocateMode
                    ? "Apply new location"
                    : "Assign slots"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <PublicationSlotPickerModal
        open={slotPickCtx !== null}
        onClose={() => setSlotPickCtx(null)}
        publicationId={publicationId}
        mode="single"
        title={
          slotPickRow && slotPickCtx
            ? `Pick article slot for page ${slotPickCtx.pageIndex + 1} · ${
                slotPickRow.article?.article_title ?? slotPickRow.article_id
              }`
            : "Pick article slot"
        }
        confirmLabel="Use this slot"
        initialSelectedSlotIds={[]}
        isSlotSelectable={isSlotSelectable}
        onConfirm={handlePickExistingConfirm}
      />

      <FlatplanAddSlotModal
        open={addSlotCtx !== null}
        onClose={() => setAddSlotCtx(null)}
        publicationId={publicationId}
        publicationFormat={publicationFormat}
        initialPublicationPage={addSlotCtx?.initialPublicationPage ?? 10}
        editorialPageBounds={editorialBounds}
        reloadDocumentAfterCreate={false}
        onCreated={async (info) => {
          const sid = info?.publication_slot_id;
          const ctx = addSlotCtx;
          if (ctx != null && sid != null && Number.isFinite(Number(sid))) {
            await assignSlotPage(ctx.publicationArticleId, ctx.pageIndex, Number(sid));
          } else {
            await load();
          }
        }}
      />

      <ProjectSelectModal
        open={projectPickerForPublicationArticleId !== null}
        onClose={() => setProjectPickerForPublicationArticleId(null)}
        onSelectProject={(project) => {
          void handleLinkProject(project);
        }}
        confirmLabel="Link project / contract"
        currentProjectId={projectPickerCurrentProjectId}
      />
    </div>
  );
}
