"use client";

import React, { useEffect, useMemo, useState } from "react";
import apiClient from "@/app/apiClient";

export type NewsletterListRow = {
  userList_id: string;
  userListName?: string;
  userListPortal?: string;
  userListTopic?: string;
};

export default function SelectNewsletterListModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (list: NewsletterListRow) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lists, setLists] = useState<NewsletterListRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  const [filter, setFilter] = useState({
    id: "",
    name: "",
    portal: "",
    topic: "",
  });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSelectedId("");
    apiClient
      .get("/api/v1/user-lists")
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
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const idQ = filter.id.trim().toLowerCase();
    const nameQ = filter.name.trim().toLowerCase();
    const portalQ = filter.portal.trim().toLowerCase();
    const topicQ = filter.topic.trim().toLowerCase();
    return lists.filter((l) => {
      const id = String(l.userList_id ?? "").toLowerCase();
      const nm = String(l.userListName ?? "").toLowerCase();
      const portal = String(l.userListPortal ?? "").toLowerCase();
      const topic = String(l.userListTopic ?? "").toLowerCase();
      return (
        (!idQ || id.includes(idQ)) &&
        (!nameQ || nm.includes(nameQ)) &&
        (!portalQ || portal.includes(portalQ)) &&
        (!topicQ || topic.includes(topicQ))
      );
    });
  }, [lists, filter]);

  const selected = useMemo(
    () => lists.find((l) => l.userList_id === selectedId) ?? null,
    [lists, selectedId]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Select newsletter list</h3>
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
                onChange={(e) => setFilter((f) => ({ ...f, id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filter by id"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input
                value={filter.name}
                onChange={(e) => setFilter((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filter by name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Portal</label>
              <input
                value={filter.portal}
                onChange={(e) => setFilter((f) => ({ ...f, portal: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filter by portal"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Topic</label>
              <input
                value={filter.topic}
                onChange={(e) => setFilter((f) => ({ ...f, topic: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filter by topic"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="text-sm text-gray-500">Loading lists...</p>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Portal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Topic
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                        No lists found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((l) => (
                      <tr
                        key={l.userList_id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedId(l.userList_id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(l.userList_id);
                          }
                        }}
                        aria-selected={selectedId === l.userList_id}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selectedId === l.userList_id ? "bg-blue-50 ring-1 ring-blue-200" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">{l.userListName ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{l.userListPortal ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{l.userListTopic ?? "—"}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">{l.userList_id}</td>
                      </tr>
                    ))
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
            onClick={() => (selected ? onConfirm(selected) : null)}
            disabled={!selectedId || !selected}
            className="px-4 py-2 text-sm rounded-lg bg-blue-950 text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

