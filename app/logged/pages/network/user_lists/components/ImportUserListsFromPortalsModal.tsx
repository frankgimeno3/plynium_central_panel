"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "@/app/apiClient";

export type PortalTab = { id: number; key: string; name: string };

type NewsletterListRow = {
  userList_id: string;
  userListName?: string;
  listUserIdsArray?: string[];
  portalId?: number | null;
  /** From API: column and/or linked campaign (see getUserListsFromRds). */
  newsletterListType?: "main" | "specific" | string;
};

function normalizedListType(row: NewsletterListRow): "main" | "specific" {
  const t = row.newsletterListType;
  return t === "main" ? "main" : "specific";
}

/**
 * Modal: one tab per portal; pick existing user lists by checkbox.
 * Confirm requires at least one list; merges member user UUIDs for the parent to pre-select in a table.
 */
export default function ImportUserListsFromPortalsModal({
  open,
  onClose,
  onConfirm,
  portals,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (userIds: string[]) => void;
  portals: PortalTab[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listsByPortal, setListsByPortal] = useState<Record<number, NewsletterListRow[]>>({});
  const [activePortalId, setActivePortalId] = useState<number | null>(null);
  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(() => new Set());
  const [listFilterName, setListFilterName] = useState("");
  const [listFilterId, setListFilterId] = useState("");
  /** "" = all types */
  const [listFilterType, setListFilterType] = useState<"" | "main" | "specific">("");

  const sortedPortals = useMemo(
    () => [...portals].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)),
    [portals]
  );

  const listById = useMemo(() => {
    const m = new Map<string, NewsletterListRow>();
    for (const pid of Object.keys(listsByPortal)) {
      const rows = listsByPortal[Number(pid)] ?? [];
      for (const row of rows) {
        if (row.userList_id) m.set(String(row.userList_id), row);
      }
    }
    return m;
  }, [listsByPortal]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelectedListIds(new Set());
    setListFilterName("");
    setListFilterId("");
    setListFilterType("");
    setListsByPortal({});
    if (sortedPortals.length === 0) {
      setActivePortalId(null);
      return;
    }
    setActivePortalId(Number(sortedPortals[0].id));
    setLoading(true);
    (async () => {
      try {
        const entries = await Promise.all(
          sortedPortals.map(async (p) => {
            const res = await apiClient.get<NewsletterListRow[]>("/api/v1/user-lists", {
              params: { portal_id: p.id },
            });
            const rows = Array.isArray(res.data) ? res.data : [];
            return [p.id, rows] as const;
          })
        );
        const next: Record<number, NewsletterListRow[]> = {};
        for (const [id, rows] of entries) {
          next[Number(id)] = rows;
        }
        setListsByPortal(next);
      } catch (e: unknown) {
        const message =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Failed to load user lists";
        setError(message);
        setListsByPortal({});
      } finally {
        setLoading(false);
      }
    })();
  }, [open, sortedPortals]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    setListFilterName("");
    setListFilterId("");
    setListFilterType("");
  }, [activePortalId]);

  const toggleList = useCallback((listId: string) => {
    setSelectedListIds((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) next.delete(listId);
      else next.add(listId);
      return next;
    });
  }, []);

  const confirmDisabled = selectedListIds.size === 0;

  const handleConfirm = useCallback(() => {
    if (confirmDisabled) return;
    const idSet = new Set<string>();
    for (const lid of selectedListIds) {
      const row = listById.get(lid);
      for (const uid of row?.listUserIdsArray ?? []) {
        const s = String(uid).trim();
        if (s) idSet.add(s);
      }
    }
    onConfirm([...idSet]);
    onClose();
  }, [confirmDisabled, listById, onClose, onConfirm, selectedListIds]);

  const activeLists =
    activePortalId != null ? (listsByPortal[activePortalId] ?? []) : [];

  const filteredActiveLists = useMemo(() => {
    const nameQ = listFilterName.trim().toLowerCase();
    const idQ = listFilterId.trim().toLowerCase();
    return activeLists.filter((l) => {
      const nm = String(l.userListName ?? "").toLowerCase();
      const id = String(l.userList_id ?? "").toLowerCase();
      const typeOk =
        listFilterType === "" || normalizedListType(l) === listFilterType;
      return (
        typeOk &&
        (!nameQ || nm.includes(nameQ)) &&
        (!idQ || id.includes(idQ))
      );
    });
  }, [activeLists, listFilterName, listFilterId, listFilterType]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-user-lists-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 id="import-user-lists-title" className="text-lg font-semibold text-gray-900">
            Import users from other lists
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="px-4 pt-3 border-b border-gray-100 flex flex-wrap gap-1 shrink-0">
          {sortedPortals.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePortalId(Number(p.id))}
              className={`px-3 py-2 text-sm font-medium rounded-t-md border border-b-0 transition-colors ${
                activePortalId === Number(p.id)
                  ? "bg-white text-blue-950 border-gray-200 -mb-px z-10"
                  : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100"
              }`}
            >
              {p.key}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          <p className="text-sm text-gray-600 mb-3">
            Select one or more existing lists. Their members will be checked in the user table (you can
            uncheck anyone before continuing). Press Esc or Cancel to close without importing.
          </p>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          {loading ? (
            <p className="text-sm text-gray-500">Loading lists…</p>
          ) : sortedPortals.length === 0 ? (
            <p className="text-sm text-gray-500">No portals available.</p>
          ) : activePortalId == null ? (
            <p className="text-sm text-gray-500">Select a portal tab.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                <div>
                  <label htmlFor="import-list-filter-name" className="block text-xs text-gray-600 mb-1">
                    Filter by list name
                  </label>
                  <input
                    id="import-list-filter-name"
                    type="text"
                    value={listFilterName}
                    onChange={(e) => setListFilterName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contains…"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="import-list-filter-id" className="block text-xs text-gray-600 mb-1">
                    Filter by list ID
                  </label>
                  <input
                    id="import-list-filter-id"
                    type="text"
                    value={listFilterId}
                    onChange={(e) => setListFilterId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="Contains…"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="import-list-filter-type" className="block text-xs text-gray-600 mb-1">
                    List type
                  </label>
                  <select
                    id="import-list-filter-type"
                    value={listFilterType}
                    onChange={(e) => {
                      const v = e.target.value;
                      setListFilterType(v === "main" || v === "specific" ? v : "");
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">All types</option>
                    <option value="main">Main only</option>
                    <option value="specific">Specific only</option>
                  </select>
                </div>
              </div>
              {activeLists.length === 0 ? (
                <p className="text-sm text-gray-500">No user lists for this portal.</p>
              ) : filteredActiveLists.length === 0 ? (
                <p className="text-sm text-gray-500">No lists match the current filters.</p>
              ) : (
                <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  {filteredActiveLists.map((l) => {
                const id = String(l.userList_id);
                const checked = selectedListIds.has(id);
                const listType = normalizedListType(l);
                const typeBadgeClass =
                  listType === "main"
                    ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
                    : "bg-violet-50 text-violet-900 ring-violet-200";
                    return (
                      <li key={id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-950 focus:ring-blue-500 shrink-0"
                          checked={checked}
                          onChange={() => toggleList(id)}
                          id={`import-list-${id}`}
                        />
                        <label htmlFor={`import-list-${id}`} className="flex-1 min-w-0 cursor-pointer">
                          <div className="flex flex-wrap items-center gap-2 gap-y-1">
                            <span className="text-sm font-medium text-gray-900">
                              {l.userListName?.trim() || "Untitled list"}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ring-1 ring-inset ${typeBadgeClass}`}
                            >
                              {listType === "main" ? "Main" : "Specific"}
                            </span>
                          </div>
                          <span className="block text-xs font-mono text-gray-500 mt-1">{id}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled || loading}
            className="px-4 py-2 text-sm rounded-lg bg-blue-950 text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm import
          </button>
        </div>
      </div>
    </div>
  );
}
