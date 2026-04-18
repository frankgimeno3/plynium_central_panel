"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import apiClient from "@/app/apiClient";
import { PortalService } from "@/app/service/PortalService";

type PortalRow = { id: number; key: string; name: string };

type TopicRow = {
  topic_id: number;
  topic_name: string;
  topic_description?: string;
};

/** User list row from /api/v1/user-lists; member UUIDs come from user_list_subscriptions (aggregated). */
type UserList = {
  userList_id: string;
  userListName: string;
  userListPortal: string;
  portalId?: number | null;
  portalKey?: string;
  userListTopic: string;
  listUserIdsArray?: string[];
};

const LISTS_DETAIL_BASE = "/logged/pages/network/users/lists";

const UserListsPage: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [portals, setPortals] = useState<PortalRow[]>([]);
  const [activePortalId, setActivePortalId] = useState<number | null>(null);
  const [portalsReady, setPortalsReady] = useState(false);

  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [topicsForPortal, setTopicsForPortal] = useState<TopicRow[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [listsFilter, setListsFilter] = useState({
    userListName: "",
    userList_id: "",
  });
  /** Empty = all topics; otherwise exact topic_name from topics_db (portal via topic_portals). */
  const [selectedTopicName, setSelectedTopicName] = useState("");

  const portalTabs = useMemo(
    () => [...portals].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)),
    [portals]
  );

  const loadPortalData = useCallback(async (portalId: number | null) => {
    if (portalId == null) {
      setUserLists([]);
      setTopicsForPortal([]);
      setListsLoading(false);
      return;
    }
    setListsLoading(true);
    setTopicsLoading(true);
    setLoadError(null);
    try {
      const [listsRes, topicsRes] = await Promise.all([
        apiClient.get<UserList[]>("/api/v1/user-lists", { params: { portal_id: portalId } }),
        apiClient.get<TopicRow[]>("/api/v1/topics", { params: { portal_id: portalId } }),
      ]);
      setUserLists(Array.isArray(listsRes.data) ? listsRes.data : []);
      setTopicsForPortal(Array.isArray(topicsRes.data) ? topicsRes.data : []);
    } catch (e: unknown) {
      setUserLists([]);
      setTopicsForPortal([]);
      setLoadError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setListsLoading(false);
      setTopicsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const plist = await PortalService.getAllPortals();
        if (cancelled) return;
        const sorted = [...(Array.isArray(plist) ? plist : [])].sort(
          (a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)
        ) as PortalRow[];
        setPortals(sorted);
        setActivePortalId((prev) => {
          if (prev != null && sorted.some((p) => Number(p.id) === prev)) return prev;
          return sorted[0]?.id != null ? Number(sorted[0].id) : null;
        });
      } catch {
        if (!cancelled) {
          setPortals([]);
          setActivePortalId(null);
        }
      } finally {
        if (!cancelled) setPortalsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!portalsReady || activePortalId == null) return;
    void loadPortalData(activePortalId);
  }, [portalsReady, activePortalId, loadPortalData]);

  useEffect(() => {
    if (!portalsReady) return;
    const raw = searchParams.get("portal_id");
    if (raw == null || raw === "") return;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) return;
    if (portals.some((p) => Number(p.id) === n)) {
      setActivePortalId(n);
    }
  }, [searchParams, portalsReady, portals]);

  useEffect(() => {
    setSelectedTopicName("");
    setListsFilter({ userListName: "", userList_id: "" });
  }, [activePortalId]);

  const filteredUserLists = useMemo(() => {
    let list = [...userLists];
    if (listsFilter.userListName.trim()) {
      const q = listsFilter.userListName.toLowerCase();
      list = list.filter((l) => l.userListName?.toLowerCase().includes(q));
    }
    if (listsFilter.userList_id.trim()) {
      const q = listsFilter.userList_id.toLowerCase();
      list = list.filter((l) => l.userList_id?.toLowerCase().includes(q));
    }
    if (selectedTopicName.trim()) {
      const needle = selectedTopicName.trim().toLowerCase();
      list = list.filter(
        (l) => (l.userListTopic ?? "").trim().toLowerCase() === needle
      );
    }
    return list;
  }, [userLists, listsFilter, selectedTopicName]);

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "User Lists",
      breadcrumbs: [{ label: "User Lists" }],
      buttons: [],
    });
  }, [setPageMeta]);

  const refresh = useCallback(() => {
    if (activePortalId != null) void loadPortalData(activePortalId);
  }, [activePortalId, loadPortalData]);

  const rowClass =
    "group hover:bg-gray-700 transition-colors cursor-pointer";

  return (
    <PageContentSection className="p-0 overflow-hidden flex flex-col flex-1 min-h-0">
      <div className="mt-12 flex flex-col w-full">
        <div className="bg-white rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col border border-gray-200">
          <div className="flex border-b border-gray-200 bg-gray-50 flex-wrap shrink-0">
            {portalTabs.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePortalId(Number(p.id))}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                  activePortalId === Number(p.id)
                    ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {p.key}
              </button>
            ))}
            {portalTabs.length === 0 && (
              <span className="text-sm text-gray-500 py-3 px-4">No portals configured.</span>
            )}
            <div className="flex-1 min-w-[1rem]" />
            {activePortalId != null && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/logged/pages/network/user_lists/create?portal_id=${encodeURIComponent(
                      String(activePortalId)
                    )}`
                  )
                }
                className="px-4 py-2 my-2 mr-2 text-sm font-medium text-white bg-blue-950 border border-blue-950 rounded-lg hover:bg-blue-900 self-center"
              >
                Create user list
              </button>
            )}
            <button
              type="button"
              onClick={refresh}
              className="px-4 py-2 my-2 mr-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 self-center"
            >
              Refresh
            </button>
          </div>

          <div className="p-6 flex-1 min-h-0 overflow-auto">
            {loadError && (
              <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {loadError}
              </div>
            )}
            <p className="text-sm text-gray-600 mb-4">
              Newsletter sending lists for the selected portal (from{" "}
              <code className="text-xs bg-gray-100 px-1 rounded">user_list_portal</code>
              ). Click a row to see assigned users and contacts.
            </p>

            {activePortalId == null ? (
              <p className="text-sm text-gray-500">Select a portal once portals are loaded.</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 w-full">
                  <div className="min-w-0">
                    <label className="block text-xs text-gray-600 mb-1">List</label>
                    <input
                      type="text"
                      value={listsFilter.userListName}
                      onChange={(e) => setListsFilter((f) => ({ ...f, userListName: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Filter by list name"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs text-gray-600 mb-1">ID</label>
                    <input
                      type="text"
                      value={listsFilter.userList_id}
                      onChange={(e) => setListsFilter((f) => ({ ...f, userList_id: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Filter by ID"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs text-gray-600 mb-1">Topic</label>
                    <select
                      value={selectedTopicName}
                      onChange={(e) => setSelectedTopicName(e.target.value)}
                      disabled={topicsLoading}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-60"
                    >
                      <option value="">All topics</option>
                      {topicsForPortal.map((t) => (
                        <option key={t.topic_id} value={t.topic_name}>
                          {t.topic_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {listsLoading ? (
                  <div className="py-10 text-center text-sm text-gray-500">Loading lists…</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                            List
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                            Users
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                            Topic
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userLists.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-sm text-gray-500">
                              No newsletter lists for this portal.
                            </td>
                          </tr>
                        ) : (
                          filteredUserLists.map((list) => {
                            const href = `${LISTS_DETAIL_BASE}/${encodeURIComponent(list.userList_id)}`;
                            return (
                              <tr
                                key={list.userList_id}
                                role="button"
                                tabIndex={0}
                                onClick={() => router.push(href)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    router.push(href);
                                  }
                                }}
                                className={rowClass}
                              >
                                <td className="px-6 py-3 text-sm border-b border-gray-200">
                                  <span className="block w-full text-left text-white py-1 -my-1">
                                    {list.userListName}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-sm border-b border-gray-200 font-mono">
                                  <span className="block w-full text-left text-white py-1 -my-1 whitespace-nowrap">
                                    {list.userList_id}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-sm border-b border-gray-200">
                                  <span className="block w-full text-left text-white py-1 -my-1 whitespace-nowrap">
                                    {list.userListPortal}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-sm border-b border-gray-200">
                                  <span className="block w-full text-left text-white py-1 -my-1 whitespace-nowrap">
                                    {list.userListTopic || "—"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                        {userLists.length > 0 && filteredUserLists.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-sm text-gray-500">
                              No results match the current filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PageContentSection>
  );
};

export default UserListsPage;
