"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { useUsers } from "./hooks/useUsers";

const USERS_BASE = "/logged/pages/network/users";

const Users: FC = () => {
  const router = useRouter();
  const { users, loading, error, refetch } = useUsers();

  const [usersFilter, setUsersFilter] = useState({
    id_user: "",
    user_full_name: "",
    user_role: "",
    user_description: "",
  });

  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (usersFilter.id_user.trim()) {
      const q = usersFilter.id_user.toLowerCase();
      list = list.filter((u) => u.id_user.toLowerCase().includes(q));
    }
    if (usersFilter.user_full_name.trim()) {
      const q = usersFilter.user_full_name.toLowerCase();
      list = list.filter((u) => u.user_full_name?.toLowerCase().includes(q));
    }
    if (usersFilter.user_role.trim()) {
      const q = usersFilter.user_role.toLowerCase();
      list = list.filter((u) => u.user_role?.toLowerCase().includes(q));
    }
    if (usersFilter.user_description.trim()) {
      const q = usersFilter.user_description.toLowerCase();
      list = list.filter((u) => (u.user_description ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [users, usersFilter]);

  const breadcrumbs = [{ label: "Users" }];
  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Users", breadcrumbs, buttons: [] });
  }, [setPageMeta, breadcrumbs]);

  return (
    <>
      <PageContentSection className="p-0 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="mt-12 flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden flex-1 min-h-0 overflow-auto p-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-red-700">
                {error}
                <button type="button" onClick={() => refetch()} className="ml-2 underline">
                  Retry
                </button>
              </div>
            )}

            {!error && (
              <>
                {loading ? (
                  <p className="p-6 text-gray-500">Loading users...</p>
                ) : (
                  <div className="p-6 overflow-x-auto">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
                      <div className="min-w-0">
                        <label className="block text-xs text-gray-600 mb-1">id_usuario</label>
                        <input
                          type="text"
                          value={usersFilter.id_user}
                          onChange={(e) => setUsersFilter((f) => ({ ...f, id_user: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Filter by id"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="block text-xs text-gray-600 mb-1">Full name</label>
                        <input
                          type="text"
                          value={usersFilter.user_full_name}
                          onChange={(e) => setUsersFilter((f) => ({ ...f, user_full_name: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Filter by name"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="block text-xs text-gray-600 mb-1">User Type</label>
                        <input
                          type="text"
                          value={usersFilter.user_role}
                          onChange={(e) => setUsersFilter((f) => ({ ...f, user_role: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Filter by type"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="block text-xs text-gray-600 mb-1">Description</label>
                        <input
                          type="text"
                          value={usersFilter.user_description}
                          onChange={(e) => setUsersFilter((f) => ({ ...f, user_description: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Filter by description"
                        />
                      </div>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                            User ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                            Full name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                            User Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => {
                          const userSlug = (user as { id?: string }).id ?? user.id_user;
                          const href = `${USERS_BASE}/${encodeURIComponent(userSlug)}`;
                          return (
                            <tr
                              key={user.id_user}
                              role="button"
                              tabIndex={0}
                              onClick={() => router.push(href)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  router.push(href);
                                }
                              }}
                              className="group hover:bg-gray-700 transition-colors cursor-pointer"
                            >
                              <td className="px-6 py-3 text-sm border-b border-gray-200">
                                <span className="block w-full text-left text-white py-1 -my-1 whitespace-nowrap">
                                  {user.id_user}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-sm border-b border-gray-200 whitespace-nowrap">
                                <span className="block w-full text-left text-white py-1 -my-1 whitespace-nowrap">
                                  {user.user_full_name}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-sm border-b border-gray-200 whitespace-nowrap">
                                <span className="block w-full text-left text-white py-1 -my-1 whitespace-nowrap">
                                  {user.user_role}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-sm border-b border-gray-200">
                                <span className="block w-full text-left text-white py-1 -my-1">
                                  {user.user_description}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {users.length > 0 && filteredUsers.length === 0 && (
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
      </PageContentSection>
    </>
  );
};

export default Users;
