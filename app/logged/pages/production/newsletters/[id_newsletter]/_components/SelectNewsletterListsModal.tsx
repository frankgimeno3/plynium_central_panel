"use client";

import React, { useEffect, useMemo, useState } from "react";
import apiClient from "@/app/apiClient";
import type { NewsletterListRow } from "@/app/logged/logged_components/modals/SelectNewsletterListModal";

type SelectNewsletterListsModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (lists: NewsletterListRow[]) => void;
  assignedListIds: string[];
  portalIdFilter?: number | null;
};

export default function SelectNewsletterListsModal({
  open,
  onClose,
  onConfirm,
  assignedListIds,
  portalIdFilter = null,
}: SelectNewsletterListsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lists, setLists] = useState<NewsletterListRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState({ id: "", name: "", usersSummary: "", topic: "" });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSelectedIds(new Set());
    const params =
      portalIdFilter != null && Number.isFinite(Number(portalIdFilter))
        ? { portal_id: Number(portalIdFilter) }
        : {};
    apiClient
      .get("/api/v1/user-lists", { params })
      .then((res) => setLists(Array.isArray(res.data) ? (res.data as NewsletterListRow[]) : []))
      .catch((e: unknown) => {
        const message =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Error loading newsletter lists";
        setError(message);
        setLists([]);
      })
      .finally(() => setLoading(false));
  }, [open, portalIdFilter]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const assignedSet = useMemo(() => new Set(assignedListIds.map((id) => String(id))), [assignedListIds]);

  const filtered = useMemo(() => {
    const idQ = filter.id.trim().toLowerCase();
    const nameQ = filter.name.trim().toLowerCase();
    const usersQ = filter.usersSummary.trim().toLowerCase();
    const topicQ = filter.topic.trim().toLowerCase();
    return lists.filter((list) => {
      const id = String(list.userList_id ?? "").toLowerCase();
      const name = String(list.userListName ?? "").toLowerCase();
      const usersSummary = String(list.userListPortal ?? "").toLowerCase();
      const topic = String(list.userListTopic ?? "").toLowerCase();
      return (
        (!idQ || id.includes(idQ)) &&
        (!nameQ || name.includes(nameQ)) &&
        (!usersQ || usersSummary.includes(usersQ)) &&
        (!topicQ || topic.includes(topicQ))
      );
    });
  }, [lists, filter]);

  const toggleList = (listId: string) => {
    if (assignedSet.has(listId)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) next.delete(listId);
      else next.add(listId);
      return next;
    });
  };

  const selectedLists = useMemo(
    () => lists.filter((list) => selectedIds.has(list.userList_id)),
    [lists, selectedIds]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Select user newsletter lists</h3>
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

        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ID</label>
              <input
                value={filter.id}
                onChange={(event) => setFilter((prev) => ({ ...prev, id: event.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filter by id"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input
                value={filter.name}
                onChange={(event) => setFilter((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filter by name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Users</label>
              <input
                value={filter.usersSummary}
                onChange={(event) => setFilter((prev) => ({ ...prev, usersSummary: event.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filter by user count"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Topic</label>
              <input
                value={filter.topic}
                onChange={(event) => setFilter((prev) => ({ ...prev, topic: event.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filter by topic"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="text-sm text-gray-500">Loading lists…</p>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                        No lists found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((list) => {
                      const alreadyAssigned = assignedSet.has(list.userList_id);
                      const checked = selectedIds.has(list.userList_id);
                      return (
                        <tr key={list.userList_id} className={alreadyAssigned ? "bg-gray-50" : undefined}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={alreadyAssigned}
                              onChange={() => toggleList(list.userList_id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-950 disabled:opacity-40"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{list.userListName ?? "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{list.userListPortal ?? "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{list.userListTopic ?? "—"}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-900">{list.userList_id}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedLists)}
            disabled={selectedLists.length === 0}
            className="px-4 py-2 text-sm rounded-lg bg-blue-950 text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add selected
          </button>
        </div>
      </div>
    </div>
  );
}
