"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MediatecaModal from "@/app/logged/logged_components/modals/MediatecaModal";
import PublicationSlotPickerModal, {
  PublicationSlotPickerRow,
} from "@/app/logged/logged_components/modals/PublicationSlotPickerModal";
import {
  advertSlotMaterialsMediatecaPath,
  magazinePublicationMediaLibraryPath,
} from "@/app/contents/mediatecaPaths";

export type ShouldBeInMagazinePanelProps = {
  publicationId: string;
};

type ContractedProjectRow = {
  project_id: string;
  contract_id: string;
  project_title: string;
  project_status: string;
  service_id: string;
  service_full_name: string | null;
  slot_content_format: string | null;
  service_format: string | null;
  service_unit_price: number | null;
  project_publication_date: string | null;
  publication_id: string | null;
  publication_slot_id: number | null;
  slot_key: string | null;
  publication_page?: number | null;
  slot_state: string | null;
  slot_media_url: string | null;
  customer: { customer_id: string; name: string } | null;
  contract: {
    contract_id: string;
    title: string;
    amount_eur: number | null;
  } | null;
};

const REGULAR_SLOT_POSITION = 1;
const COVER_SLOT_KEY = "cover";
const COVER_SLOT_POSITION = -1;

function isAdvertFormat(format: string | null | undefined): boolean {
  const f = String(format ?? "").trim().toLowerCase();
  return f === "advert" || f === "advertisement" || f === "ad";
}

function statusPillTone(status: string | null | undefined): string {
  const s = String(status ?? "").trim().toLowerCase();
  if (s === "completed" || s === "done") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "in_progress" || s === "ongoing")
    return "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "pending" || s === "todo" || s === "open")
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

function slotKeyLabel(key: string | null | undefined, publicationPage?: number | null): string {
  const k = String(key ?? "").trim().toLowerCase();
  if (!k) return "—";
  if (k === "cover") return "Cover";
  if (k === "inside_cover" || k === "inside cover") return "Inside cover";
  if (k === "end" || k === "end_page" || k === "end page") return "End page";
  if (k === "regular_page") return "Regular page";
  if (k === "preferential_page" && publicationPage != null && Number.isFinite(Number(publicationPage))) {
    return `Preferential ${Math.round(Number(publicationPage))}`;
  }
  const n = Number(k);
  if (Number.isFinite(n)) return `Page ${n}`;
  return String(key ?? "");
}

/**
 * "Should be in magazine" panel. Renders every project tied to this
 * publication so the user can see who owns what, jump to the project /
 * contract, assign the project to a publication slot, and attach media when
 * the slot expects an advert.
 */
export function ShouldBeInMagazinePanel({ publicationId }: ShouldBeInMagazinePanelProps) {
  const [items, setItems] = useState<ContractedProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publicationEditionName, setPublicationEditionName] = useState<string>("");

  const [slotPickerForProjectId, setSlotPickerForProjectId] = useState<string | null>(null);
  const [mediaPickerForProject, setMediaPickerForProject] = useState<ContractedProjectRow | null>(
    null
  );
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [projectsRes, pubRes] = await Promise.all([
        fetch(
          `/api/v1/publications/${encodeURIComponent(publicationId)}/contracted-projects`,
          { cache: "no-store", credentials: "include" }
        ),
        fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}`, {
          cache: "no-store",
          credentials: "include",
        }),
      ]);
      if (!projectsRes.ok) {
        const txt = await projectsRes.text().catch(() => "");
        throw new Error(txt || "Failed to load projects");
      }
      const json = (await projectsRes.json()) as { items?: ContractedProjectRow[] };
      setItems(Array.isArray(json?.items) ? json.items : []);
      if (pubRes.ok) {
        try {
          const pj = (await pubRes.json()) as { publication_edition_name?: string };
          setPublicationEditionName(pj?.publication_edition_name ?? "");
        } catch {
          setPublicationEditionName("");
        }
      }
    } catch (e: any) {
      setItems([]);
      setLoadError(e?.message ?? "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [publicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const mediatecaPath = useMemo(() => {
    const edition = publicationEditionName.trim();
    const sid = mediaPickerForProject?.publication_slot_id;
    if (edition && sid != null && Number.isFinite(Number(sid)) && Number(sid) > 0) {
      return advertSlotMaterialsMediatecaPath(edition, Number(sid));
    }
    return magazinePublicationMediaLibraryPath(publicationEditionName);
  }, [publicationEditionName, mediaPickerForProject?.publication_slot_id]);

  const slotPickerProject = useMemo(
    () => items.find((p) => p.project_id === slotPickerForProjectId) ?? null,
    [items, slotPickerForProjectId]
  );

  const isSlotPickerSlotSelectable = useCallback(
    (slot: PublicationSlotPickerRow) => {
      // Allow selecting any slot; the backend will swap project_id atomically
      // and update both projects_db and publication_slots_db. We still gray
      // out slots already linked to a different project so the user is
      // explicit about overriding.
      const otherProject = slot.project_id;
      if (!otherProject) return true;
      if (slotPickerProject && otherProject === slotPickerProject.project_id) return true;
      return true; // selectable but row will read as "currently used".
    },
    [slotPickerProject]
  );

  const handleAssignProjectToSlot = useCallback(
    async (slotIds: number[]) => {
      const project = slotPickerProject;
      if (!project || slotIds.length === 0) return;
      const slotId = slotIds[0];
      setActionError(null);
      setActionMessage(null);
      setBusyProjectId(project.project_id);
      try {
        const res = await fetch(`/api/v1/publication-slots/${slotId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ project_id: project.project_id }),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to assign project to slot");
        }
        setActionMessage(
          `Project ${project.project_id} assigned to slot #${slotId}.`
        );
        setSlotPickerForProjectId(null);
        await load();
      } catch (e: any) {
        setActionError(e?.message ?? "Failed to assign project to slot");
      } finally {
        setBusyProjectId(null);
      }
    },
    [slotPickerProject, load]
  );

  const handleAdvertMediaSelected = useCallback(
    async (imageUrl: string) => {
      const project = mediaPickerForProject;
      if (!project || !imageUrl) {
        setMediaPickerForProject(null);
        return;
      }
      const slotId = project.publication_slot_id;
      if (!slotId) {
        setActionError("This project has no publication slot to attach media to.");
        setMediaPickerForProject(null);
        return;
      }
      setActionError(null);
      setActionMessage(null);
      setBusyProjectId(project.project_id);
      try {
        const isCover = String(project.slot_key ?? "").trim().toLowerCase() === COVER_SLOT_KEY;
        const advertPosition = isCover ? COVER_SLOT_POSITION : REGULAR_SLOT_POSITION;
        const res = await fetch(
          `/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots/${slotId}/contents`,
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
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to save media");
        }
        setActionMessage(`Media attached to slot #${slotId}.`);
        setMediaPickerForProject(null);
        await load();
      } catch (e: any) {
        setActionError(e?.message ?? "Failed to save media");
      } finally {
        setBusyProjectId(null);
      }
    },
    [mediaPickerForProject, publicationId, load]
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Loading projects…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {loadError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {loadError}
        </div>
      ) : null}
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

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
          No projects are tied to this publication yet.
          <p className="mt-1 text-[11px] text-gray-400">
            Projects appear here once their <code>publication_id</code> is set to{" "}
            <span className="font-mono">{publicationId}</span>.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Customer</th>
                <th className="px-4 py-2 text-left font-medium">Project</th>
                <th className="px-4 py-2 text-left font-medium">Contract</th>
                <th className="px-4 py-2 text-left font-medium">Content</th>
                <th className="px-4 py-2 text-left font-medium">Slot</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const isAdvert = isAdvertFormat(row.slot_content_format ?? row.service_format);
                const projectHref = `/logged/pages/account-management/projects/${encodeURIComponent(
                  row.project_id
                )}`;
                const contractHref = row.contract_id
                  ? `/logged/pages/account-management/contracts/${encodeURIComponent(
                      row.contract_id
                    )}`
                  : null;
                const slotHref = row.publication_slot_id
                  ? `/logged/pages/production/publications/issues/${encodeURIComponent(
                      publicationId
                    )}/slots/${row.publication_slot_id}`
                  : null;
                const isBusy = busyProjectId === row.project_id;
                return (
                  <tr key={row.project_id} className="border-t border-gray-200 hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      {row.customer ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {row.customer.name || row.customer.customer_id}
                          </span>
                          <span className="text-[11px] font-mono text-gray-500">
                            {row.customer.customer_id}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={projectHref}
                        className="inline-flex flex-col group"
                      >
                        <span className="font-medium text-blue-700 group-hover:text-blue-900">
                          {row.project_title || row.project_id}
                        </span>
                        <span className="text-[11px] font-mono text-gray-500">
                          {row.project_id}
                        </span>
                      </Link>
                      {row.project_status ? (
                        <span
                          className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusPillTone(
                            row.project_status
                          )}`}
                        >
                          {row.project_status}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {contractHref && row.contract ? (
                        <Link
                          href={contractHref}
                          className="inline-flex flex-col group"
                        >
                          <span className="font-medium text-blue-700 group-hover:text-blue-900">
                            {row.contract.title || row.contract.contract_id}
                          </span>
                          <span className="text-[11px] font-mono text-gray-500">
                            {row.contract.contract_id}
                          </span>
                          {row.contract.amount_eur != null ? (
                            <span className="text-[11px] text-gray-500">
                              €{row.contract.amount_eur.toLocaleString()}
                            </span>
                          ) : null}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {row.service_full_name || row.service_id}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Format:{" "}
                        <span className="font-medium text-gray-700">
                          {row.slot_content_format || row.service_format || "—"}
                        </span>
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {row.publication_slot_id ? (
                        <div className="flex flex-col">
                          {slotHref ? (
                            <Link
                              href={slotHref}
                              className="font-medium text-blue-700 hover:text-blue-900"
                            >
                              {slotKeyLabel(row.slot_key, row.publication_page)}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-800">
                              {slotKeyLabel(row.slot_key, row.publication_page)}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-gray-500">
                            #{row.publication_slot_id}
                          </span>
                          {row.slot_state ? (
                            <span
                              className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusPillTone(
                                row.slot_state
                              )}`}
                            >
                              {row.slot_state}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setSlotPickerForProjectId(row.project_id)}
                          disabled={isBusy}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {row.publication_slot_id ? "Reassign slot" : "Assign to slot"}
                        </button>
                        {row.publication_slot_id && isAdvert ? (
                          <button
                            type="button"
                            onClick={() => setMediaPickerForProject(row)}
                            disabled={isBusy}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {row.slot_media_url ? "Replace media" : "Add media"}
                          </button>
                        ) : null}
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
        open={slotPickerForProjectId !== null}
        onClose={() => setSlotPickerForProjectId(null)}
        publicationId={publicationId}
        mode="single"
        title={
          slotPickerProject
            ? `Assign "${slotPickerProject.project_title || slotPickerProject.project_id}" to a slot`
            : "Assign project to a slot"
        }
        confirmLabel="Assign to slot"
        initialSelectedSlotIds={
          slotPickerProject?.publication_slot_id
            ? [slotPickerProject.publication_slot_id]
            : []
        }
        isSlotSelectable={isSlotPickerSlotSelectable}
        onConfirm={handleAssignProjectToSlot}
      />

      <MediatecaModal
        open={mediaPickerForProject !== null}
        onClose={() => setMediaPickerForProject(null)}
        onSelectImage={(imageUrl) => {
          void handleAdvertMediaSelected(imageUrl);
        }}
        initialPath={mediatecaPath}
        allowPdfSelection
        ensureSlotMediatecaFolder={
          mediaPickerForProject?.publication_slot_id != null &&
          Number(mediaPickerForProject.publication_slot_id) > 0
            ? {
                publicationId,
                slotId: Number(mediaPickerForProject.publication_slot_id),
              }
            : undefined
        }
      />
    </div>
  );
}
