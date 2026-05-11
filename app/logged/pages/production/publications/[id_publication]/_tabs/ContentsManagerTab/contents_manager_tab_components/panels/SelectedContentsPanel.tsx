"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProjectSelectModal, {
  type ProjectRow,
} from "@/app/logged/logged_components/modals/ProjectSelectModal";
import PublicationSlotPickerModal, {
  type PublicationSlotPickerRow,
} from "@/app/logged/logged_components/modals/PublicationSlotPickerModal";
import { BASE } from "../../../../_shared";

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
  project_id: string | null;
  project_contract_id: string | null;
  customer_name: string | null;
};

function slotKeyLabel(key: string | null | undefined): string {
  const k = String(key ?? "").trim().toLowerCase();
  if (!k) return "—";
  if (k === "cover") return "Cover";
  if (k === "inside_cover" || k === "inside cover") return "Inside cover";
  if (k === "end" || k === "end_page" || k === "end page") return "End page";
  if (k === "regular_page") return "Regular page";
  const n = Number(k);
  if (Number.isFinite(n)) return `Page ${n}`;
  return key as string;
}

function formatSlotAssignment(
  slotIds: number[],
  slotsById: Map<number, PublicationSlotRow>
): string {
  if (!slotIds.length) return "";
  const labels = slotIds
    .map((slotId) => {
      const slot = slotsById.get(slotId);
      if (!slot) return `Article page #${slotId}`;
      return `${slotKeyLabel(slot.slot_key)} · #${slotId}`;
    })
    .filter(Boolean);
  return labels.join(", ");
}

export function SelectedContentsPanel({ publicationId }: SelectedContentsPanelProps) {
  const [items, setItems] = useState<SelectedContentRow[]>([]);
  const [slots, setSlots] = useState<PublicationSlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyPublicationArticleId, setBusyPublicationArticleId] = useState<string | null>(null);
  const [slotPickerForPublicationArticleId, setSlotPickerForPublicationArticleId] = useState<
    string | null
  >(null);
  const [projectPickerForPublicationArticleId, setProjectPickerForPublicationArticleId] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [contentsRes, slotsRes] = await Promise.all([
        fetch(
          `/api/v1/publications/${encodeURIComponent(publicationId)}/publication-articles`,
          { cache: "no-store", credentials: "include" }
        ),
        fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots`, {
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

  const slotPickerRow = useMemo(
    () => items.find((row) => row.publication_article_id === slotPickerForPublicationArticleId) ?? null,
    [items, slotPickerForPublicationArticleId]
  );

  useEffect(() => {
    if (!slotPickerForPublicationArticleId || !slotPickerRow) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(
            slotPickerRow.publication_article_id
          )}/sync-pages`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ desired_page_count: slotPickerRow.desired_page_count }),
          }
        );
        if (!cancelled && res.ok) {
          await load();
        }
      } catch {
        // Keep the picker usable even when sync fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slotPickerForPublicationArticleId, slotPickerRow, load]);

  const projectPickerRow = useMemo(
    () =>
      items.find((row) => row.publication_article_id === projectPickerForPublicationArticleId) ??
      null,
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
      `${BASE}/${encodeURIComponent(publicationId)}/manager/article_builder/${encodeURIComponent(
        publicationArticleId
      )}`,
    [publicationId]
  );

  const handleAssignSlots = useCallback(
    async (slotIds: number[]) => {
      const row = slotPickerRow;
      if (!row || slotIds.length === 0) return;
      setActionMessage(null);
      setActionError(null);
      setBusyPublicationArticleId(row.publication_article_id);
      try {
        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(row.publication_article_id)}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ publication_slots_id_array: slotIds }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to assign slots");
        }
        setActionMessage("Slots updated for this content.");
        setSlotPickerForPublicationArticleId(null);
        await load();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to assign slots");
      } finally {
        setBusyPublicationArticleId(null);
      }
    },
    [slotPickerRow, load]
  );

  const handleLinkProject = useCallback(
    async (project: ProjectRow) => {
      const row = projectPickerRow;
      if (!row) return;
      const slotId = row.publication_slots_id_array?.[0];
      if (!slotId) {
        setActionError("Assign a slot before linking a project or contract.");
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
        "Remove this content from the publication? Linked chunks will be deleted; assigned slots are not removed."
      );
      if (!confirmed) return;
      setActionMessage(null);
      setActionError(null);
      setBusyPublicationArticleId(publicationArticleId);
      try {
        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}`,
          { method: "DELETE", credentials: "include" }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to remove content");
        }
        setActionMessage("Content removed.");
        await load();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to remove content");
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

  return (
    <div className="space-y-4">
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
          No contents selected yet. Pick one from the Available unused articles tab.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Content</th>
                <th className="px-4 py-2 text-left font-medium">Pages</th>
                <th className="px-4 py-2 text-left font-medium">Chunks</th>
                <th className="px-4 py-2 text-left font-medium">Article pages</th>
                <th className="px-4 py-2 text-left font-medium">Project / contract</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const busy = busyPublicationArticleId === row.publication_article_id;
                const slotIds = Array.isArray(row.publication_slots_id_array)
                  ? row.publication_slots_id_array
                  : [];
                const primarySlotId = slotIds[0];
                const primarySlot = primarySlotId != null ? slotsById.get(primarySlotId) : null;
                const slotLabel = formatSlotAssignment(slotIds, slotsById);
                return (
                  <tr
                    key={row.publication_article_id}
                    className="border-t border-gray-200 hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {row.article?.article_main_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.article.article_main_image_url}
                            alt={row.article?.article_title ?? row.article_id}
                            className="h-12 w-16 object-cover rounded-md border border-gray-100"
                          />
                        ) : (
                          <div className="h-12 w-16 rounded-md border border-dashed border-gray-300 bg-gray-50 text-[10px] flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {row.article?.article_title ?? row.article_id}
                          </p>
                          {row.article?.article_subtitle ? (
                            <p className="text-xs text-gray-600 line-clamp-1">
                              {row.article.article_subtitle}
                            </p>
                          ) : null}
                          <p className="text-[10px] font-mono text-gray-500 truncate">
                            {row.article_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.desired_page_count}</td>
                    <td className="px-4 py-3 text-gray-700">{row.chunks_count}</td>
                    <td className="px-4 py-3">
                      {slotIds.length > 0 ? (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-700">
                            Article page assigned:{" "}
                            <span className="font-medium">{slotLabel}</span>
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Editorial pages appear at the end of the Flatplan preview.
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setSlotPickerForPublicationArticleId(row.publication_article_id)
                            }
                            disabled={busy}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reassign article pages
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setSlotPickerForPublicationArticleId(row.publication_article_id)
                          }
                          disabled={busy}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Assign article pages
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {primarySlot?.project_id ? (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-700">
                            Linked project:{" "}
                            <span className="font-mono font-medium">{primarySlot.project_id}</span>
                          </p>
                          {primarySlot.project_contract_id ? (
                            <p className="text-[11px] text-gray-500">
                              Contract: {primarySlot.project_contract_id}
                            </p>
                          ) : null}
                          {primarySlot.customer_name ? (
                            <p className="text-[11px] text-gray-500">{primarySlot.customer_name}</p>
                          ) : null}
                          <button
                            type="button"
                            onClick={() =>
                              setProjectPickerForPublicationArticleId(row.publication_article_id)
                            }
                            disabled={busy}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          disabled={busy}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Link project / contract
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveContent(row.publication_article_id)}
                          disabled={busy}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove
                        </button>
                        <Link
                          href={articleBuilderHref(row.publication_article_id)}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
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

      <PublicationSlotPickerModal
        open={slotPickerForPublicationArticleId !== null}
        onClose={() => setSlotPickerForPublicationArticleId(null)}
        publicationId={publicationId}
        mode="multi"
        title={
          slotPickerRow
            ? `Assign article pages for ${
                slotPickerRow.article?.article_title ?? slotPickerRow.article_id
              }`
            : "Assign article pages"
        }
        confirmLabel="Save article page assignment"
        initialSelectedSlotIds={slotPickerRow?.publication_slots_id_array ?? []}
        isSlotSelectable={isSlotSelectable}
        onConfirm={handleAssignSlots}
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
