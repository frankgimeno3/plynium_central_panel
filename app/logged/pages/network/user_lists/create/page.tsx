"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { PortalService } from "@/app/service/PortalService";
import UserService from "@/app/service/UserSerivce.js";
import apiClient from "@/app/apiClient";
import ImportUserListsFromPortalsModal, {
  type PortalTab,
} from "../components/ImportUserListsFromPortalsModal";

const USER_LISTS_HREF = "/logged/pages/network/user_lists";
const PAGE_SIZE = 20;

type PortalRow = { id: number; key: string; name: string };
type ListType = "main" | "specific";

type ApiUser = {
  id?: string;
  id_user: string;
  user_full_name?: string;
  user_name?: string;
  user_role?: string;
  enabled?: boolean;
};

function portalLabel(p: PortalRow) {
  return p.key || p.name || String(p.id);
}

export default function CreateUserListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPageMeta } = usePageContent();

  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [portals, setPortals] = useState<PortalRow[]>([]);
  const [portalsReady, setPortalsReady] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPortalIds, setSelectedPortalIds] = useState<Set<number>>(() => new Set());
  const [listTypeByPortalId, setListTypeByPortalId] = useState<Map<number, ListType>>(() => new Map());

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(() => new Set());
  const [userFilter, setUserFilter] = useState("");
  const [userPage, setUserPage] = useState(0);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const returnPortalId = useMemo(() => {
    const raw = searchParams.get("portal_id");
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : null;
  }, [searchParams]);

  useEffect(() => {
    setPageMeta({
      pageTitle: "Create user list",
      breadcrumbs: [
        { label: "User Lists", href: USER_LISTS_HREF },
        { label: "Create" },
      ],
      buttons: [],
    });
  }, [setPageMeta]);

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
      } catch {
        if (!cancelled) setPortals([]);
      } finally {
        if (!cancelled) setPortalsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!portalsReady || returnPortalId == null) return;
    if (!portals.some((p) => Number(p.id) === returnPortalId)) return;
    setSelectedPortalIds((prev) => {
      const next = new Set(prev);
      next.add(returnPortalId);
      return next;
    });
  }, [portalsReady, returnPortalId, portals]);

  useEffect(() => {
    setListTypeByPortalId((prev) => {
      const next = new Map(prev);
      for (const pid of selectedPortalIds) {
        if (!next.has(pid)) next.set(pid, "specific");
      }
      for (const pid of next.keys()) {
        if (!selectedPortalIds.has(pid)) next.delete(pid);
      }
      return next;
    });
  }, [selectedPortalIds]);

  useEffect(() => {
    if (phase !== 2) return;
    let cancelled = false;
    setUsersLoading(true);
    setUsersError(null);
    (async () => {
      try {
        const data = await UserService.getAllUsers();
        if (cancelled) return;
        setUsers(Array.isArray(data) ? (data as ApiUser[]) : []);
      } catch (e: unknown) {
        if (!cancelled) {
          setUsers([]);
          setUsersError(e instanceof Error ? e.message : "Failed to load users");
        }
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase]);

  const sortedPortals = useMemo(
    () => [...portals].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)),
    [portals]
  );

  const togglePortal = useCallback((portalId: number) => {
    setSelectedPortalIds((prev) => {
      const next = new Set(prev);
      if (next.has(portalId)) next.delete(portalId);
      else next.add(portalId);
      return next;
    });
  }, []);

  const setPortalListType = useCallback((portalId: number, listType: ListType) => {
    setListTypeByPortalId((prev) => {
      const next = new Map(prev);
      next.set(portalId, listType);
      return next;
    });
  }, []);

  const filteredUsers = useMemo(() => {
    const q = userFilter.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const email = String(u.id_user ?? "").toLowerCase();
      const full = String(u.user_full_name ?? "").toLowerCase();
      const uname = String(u.user_name ?? "").toLowerCase();
      return email.includes(q) || full.includes(q) || uname.includes(q);
    });
  }, [users, userFilter]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  useEffect(() => {
    setUserPage((p) => Math.min(p, Math.max(0, totalUserPages - 1)));
  }, [totalUserPages, userFilter, filteredUsers.length]);

  const pagedUsers = useMemo(() => {
    const start = userPage * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, userPage]);

  const toggleUser = useCallback((userId: string) => {
    if (!userId) return;
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const onImportConfirm = useCallback((ids: string[]) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (id) next.add(String(id));
      }
      return next;
    });
    setImportModalOpen(false);
  }, []);

  const phase1Valid = name.trim().length > 0 && selectedPortalIds.size > 0;

  const portalTabsForModal: PortalTab[] = sortedPortals.map((p) => ({
    id: Number(p.id),
    key: p.key,
    name: p.name,
  }));

  const selectedPortalsOrdered = useMemo(() => {
    return sortedPortals.filter((p) => selectedPortalIds.has(Number(p.id)));
  }, [sortedPortals, selectedPortalIds]);

  const handleCreate = useCallback(async () => {
    setSubmitError(null);
    if (!phase1Valid) {
      setSubmitError("Name and at least one portal are required.");
      return;
    }
    const portalsPayload = selectedPortalsOrdered.map((p) => ({
      portalId: Number(p.id),
      listType: (listTypeByPortalId.get(Number(p.id)) ?? "specific") as ListType,
    }));
    const userIds = [...selectedUserIds].filter(Boolean);
    setSubmitting(true);
    try {
      await apiClient.post("/api/v1/user-lists", {
        name: name.trim(),
        description: description.trim(),
        portals: portalsPayload,
        userIds,
      });
      const firstPid = selectedPortalsOrdered[0] ? Number(selectedPortalsOrdered[0].id) : returnPortalId;
      const q =
        firstPid != null && Number.isInteger(firstPid)
          ? `?portal_id=${encodeURIComponent(String(firstPid))}`
          : "";
      router.push(`${USER_LISTS_HREF}${q}`);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Failed to create user list(s)";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    description,
    listTypeByPortalId,
    name,
    phase1Valid,
    returnPortalId,
    router,
    selectedPortalsOrdered,
    selectedUserIds,
  ]);

  return (
    <PageContentSection className="p-0 overflow-hidden flex flex-col flex-1 min-h-0">
      <div className="mt-12 flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span className={phase >= 1 ? "font-semibold text-blue-950" : ""}>1. Details & portals</span>
          <span aria-hidden>→</span>
          <span className={phase >= 2 ? "font-semibold text-blue-950" : ""}>2. Users</span>
          <span aria-hidden>→</span>
          <span className={phase >= 3 ? "font-semibold text-blue-950" : ""}>3. Review</span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
          {phase === 1 && (
            <>
              <div>
                <label htmlFor="ul-name" className="block text-sm font-medium text-gray-700 mb-1">
                  List name
                </label>
                <input
                  id="ul-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Weekly digest — Glass"
                  maxLength={255}
                />
              </div>
              <div>
                <label htmlFor="ul-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="ul-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes for editors"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Portals</p>
                {!portalsReady ? (
                  <p className="text-sm text-gray-500">Loading portals…</p>
                ) : sortedPortals.length === 0 ? (
                  <p className="text-sm text-gray-500">No portals in portals_db.</p>
                ) : (
                  <ul className="space-y-4">
                    {sortedPortals.map((p) => {
                      const pid = Number(p.id);
                      const checked = selectedPortalIds.has(pid);
                      const listType = listTypeByPortalId.get(pid) ?? "specific";
                      return (
                        <li key={pid} className="border border-gray-200 rounded-lg p-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePortal(pid)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-950 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-900">{portalLabel(p)}</span>
                            <span className="text-xs text-gray-500">(id {pid})</span>
                          </label>
                          {checked && (
                            <div className="mt-3 pl-6 border-l-2 border-gray-100">
                              <p className="text-xs text-gray-500 mb-2">Newsletter list type for this portal</p>
                              <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
                                <button
                                  type="button"
                                  onClick={() => setPortalListType(pid, "main")}
                                  className={`px-4 py-2 text-sm font-medium ${
                                    listType === "main"
                                      ? "bg-blue-950 text-white"
                                      : "bg-white text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  Main
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPortalListType(pid, "specific")}
                                  className={`px-4 py-2 text-sm font-medium border-l border-gray-200 ${
                                    listType === "specific"
                                      ? "bg-blue-950 text-white"
                                      : "bg-white text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  Specific
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => router.push(USER_LISTS_HREF)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!phase1Valid}
                  onClick={() => setPhase(2)}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-950 text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to users
                </button>
              </div>
            </>
          )}

          {phase === 2 && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-[12rem]">
                  <label htmlFor="user-q" className="block text-xs text-gray-600 mb-1">
                    Search users
                  </label>
                  <input
                    id="user-q"
                    value={userFilter}
                    onChange={(e) => {
                      setUserFilter(e.target.value);
                      setUserPage(0);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Name or email"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setImportModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 shrink-0"
                >
                  Import from other lists
                </button>
              </div>

              {usersError && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {usersError}
                </div>
              )}

              {usersLoading ? (
                <p className="text-sm text-gray-500 py-8 text-center">Loading users…</p>
              ) : (
                <>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="w-12 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Add
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Email
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Role
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pagedUsers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                              No users match the current filter.
                            </td>
                          </tr>
                        ) : (
                          pagedUsers.map((u) => {
                            const uid = u.id ? String(u.id) : "";
                            const disabled = !uid;
                            const checked = uid ? selectedUserIds.has(uid) : false;
                            return (
                              <tr key={uid || u.id_user} className="hover:bg-gray-50">
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    disabled={disabled}
                                    checked={checked}
                                    onChange={() => uid && toggleUser(uid)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-950 focus:ring-blue-500 disabled:opacity-40"
                                    aria-label={`Select ${u.user_full_name || u.id_user}`}
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {u.user_full_name?.trim() || "—"}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-700">{u.id_user}</td>
                                <td className="px-3 py-2 text-sm text-gray-600">{u.user_role ?? "—"}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-xs text-gray-500">
                      Showing {filteredUsers.length === 0 ? 0 : userPage * PAGE_SIZE + 1}–
                      {Math.min((userPage + 1) * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}{" "}
                      users · {selectedUserIds.size} selected
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                        disabled={userPage <= 0}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {userPage + 1} / {totalUserPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setUserPage((p) => Math.min(totalUserPages - 1, p + 1))}
                        disabled={userPage >= totalUserPages - 1}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-between gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPhase(1)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setPhase(3)}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-950 text-white hover:bg-blue-900"
                >
                  Continue to review
                </button>
              </div>
            </>
          )}

          {phase === 3 && (
            <>
              <h2 className="text-base font-semibold text-gray-900">Review</h2>
              <dl className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">Name</dt>
                  <dd className="font-medium text-gray-900">{name.trim() || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Description</dt>
                  <dd className="text-gray-800 whitespace-pre-wrap">{description.trim() || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Portals & list type</dt>
                  <dd>
                    <ul className="mt-1 space-y-1">
                      {selectedPortalsOrdered.map((p) => (
                        <li key={p.id} className="text-gray-800">
                          <span className="font-medium">{portalLabel(p)}</span>
                          <span className="text-gray-500"> — </span>
                          <span className="capitalize">
                            {(listTypeByPortalId.get(Number(p.id)) ?? "specific") === "main"
                              ? "Main"
                              : "Specific"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Users to assign</dt>
                  <dd className="text-gray-800">
                    {selectedUserIds.size} user{selectedUserIds.size === 1 ? "" : "s"} (subscriptions will be
                    created for each new list in every selected portal).
                  </dd>
                </div>
              </dl>

              {submitError && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {submitError}
                </div>
              )}

              <div className="flex justify-between gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPhase(2)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={submitting || !phase1Valid}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-950 text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating…" : "Confirm and create"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ImportUserListsFromPortalsModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onConfirm={onImportConfirm}
        portals={portalTabsForModal}
      />
    </PageContentSection>
  );
}
