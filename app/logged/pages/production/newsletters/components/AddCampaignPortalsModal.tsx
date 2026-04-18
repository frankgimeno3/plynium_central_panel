"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { PortalService } from "@/app/service/PortalService";

type PortalRow = { id: number; key: string; name: string };

export default function AddCampaignPortalsModal({
  open,
  existingPortalIds,
  onClose,
  onAdd,
}: {
  open: boolean;
  existingPortalIds: number[];
  onClose: () => void;
  onAdd: (portalIds: number[]) => Promise<void> | void;
}) {
  const [portals, setPortals] = useState<PortalRow[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const existingSet = useMemo(() => new Set(existingPortalIds), [existingPortalIds]);
  const newSelected = useMemo(() => selected.filter((id) => !existingSet.has(id)), [selected, existingSet]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    PortalService.getAllPortals()
      .then((list) => {
        const arr = Array.isArray(list) ? (list as PortalRow[]) : [];
        setPortals(arr);
        // Preselect existing portals
        setSelected(existingPortalIds.slice());
      })
      .catch(() => {
        setPortals([]);
        setSelected(existingPortalIds.slice());
      })
      .finally(() => setLoading(false));
  }, [open, existingPortalIds]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const toggle = (id: number) => {
    if (existingSet.has(id)) return;
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const handleAdd = async () => {
    if (newSelected.length === 0) return;
    await onAdd(newSelected);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-campaign-portals-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="add-campaign-portals-title" className="text-xl font-semibold text-gray-900">
            Add portals to campaign
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-2xl leading-none text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-gray-600">
            Existing portals are already selected and can’t be changed here. Select at least one new portal to enable{" "}
            <span className="font-medium">Add</span>.
          </p>

          <div className="mt-4 max-h-[50vh] overflow-y-auto rounded-lg border border-gray-200">
            {loading ? (
              <div className="p-4 text-sm text-gray-500">Loading portals…</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {portals.map((p) => {
                  const isExisting = existingSet.has(p.id);
                  const checked = selected.includes(p.id) || isExisting;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggle(p.id)}
                      className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left ${
                        isExisting ? "bg-gray-50" : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{p.key}</p>
                        <p className="truncate text-sm text-gray-500">{p.name}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isExisting}
                        readOnly
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 disabled:opacity-50"
                      />
                    </button>
                  );
                })}
                {portals.length === 0 && <div className="p-4 text-sm text-gray-500">No portals found.</div>}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={newSelected.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

