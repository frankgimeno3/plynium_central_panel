"use client";

import React, { FC, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import { useUsers } from './hooks/useUsers';
import { ContactService } from '@/app/service/ContactService';
import apiClient from '@/app/apiClient';

type UserList = {
  userList_id: string;
  userListName: string;
  userListPortal: string;
  userListTopic: string;
};

type UserContent = {
  id?: string;
  id_user: string;
  user_full_name: string;
  user_name: string;
  user_role: string;
  user_description: string;
  userListArray?: string[];
};

type ContactContent = {
  id_contact: string;
  name: string;
  role: string;
  email: string;
  company_name?: string;
  userListArray?: string[];
};

type UsersTabKey = 'all' | 'lists';

interface UsersProps {}

const USERS_BASE = '/logged/pages/network/users';

const LISTS_BASE = `${USERS_BASE}/lists`;

const Users: FC<UsersProps> = () => {
  const { users, loading, error, refetch } = useUsers();
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [currentTab, setCurrentTab] = useState<UsersTabKey>('all');
  const [currentUser, setCurrentUser] = useState<{ user_name: string } | null>(null);
  const [contactsContents, setContactsContents] = useState<ContactContent[]>([]);

  useEffect(() => {
    apiClient.get('/api/v1/user-lists')
      .then((res) => setUserLists(Array.isArray(res.data) ? res.data as UserList[] : []))
      .catch(() => setUserLists([]));
  }, []);

  useEffect(() => {
    ContactService.getAllContacts()
      .then((l) => setContactsContents(Array.isArray(l) ? l as ContactContent[] : []))
      .catch(() => setContactsContents([]));
  }, []);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => setCurrentUser({ user_name: data.user_name ?? 'User' }))
      .catch(() => setCurrentUser({ user_name: 'User' }));
  }, []);

  const userContents: UserContent[] = useMemo(
    () => users.map((u) => ({
      id: (u as UserContent).id,
      id_user: u.id_user,
      user_full_name: u.user_full_name,
      user_name: u.user_name,
      user_role: u.user_role,
      user_description: u.user_description,
      userListArray: (u as UserContent).userListArray ?? [],
    })),
    [users]
  );

  const [usersFilter, setUsersFilter] = useState({
    id_user: "",
    user_full_name: "",
    user_role: "",
    user_description: "",
  });

  const [listsFilter, setListsFilter] = useState({
    userListName: "",
    userList_id: "",
    userListPortal: "",
    userListTopic: "",
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
    if (listsFilter.userListPortal.trim()) {
      const q = listsFilter.userListPortal.toLowerCase();
      list = list.filter((l) => (l.userListPortal ?? "").toLowerCase().includes(q));
    }
    if (listsFilter.userListTopic.trim()) {
      const q = listsFilter.userListTopic.toLowerCase();
      list = list.filter((l) => (l.userListTopic ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [userLists, listsFilter]);

  const breadcrumbs = [{ label: "Users" }];
  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Users", breadcrumbs, buttons: [] });
  }, [setPageMeta, breadcrumbs]);

  const tabs: { key: UsersTabKey; label: string }[] = [
    { key: 'all', label: 'Plynium portal users DB' },
    { key: 'lists', label: 'User Newsletter Lists' },
  ];

  return (
    <>
      <PageContentSection className="p-0 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="mt-12 flex flex-col w-full">
        <p className="text-2xl font-bold pb-5">My user: <span>{currentUser?.user_name ?? '…'}</span></p>

        <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCurrentTab(tab.key)}
                className={`
                  relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                  ${
                    currentTab === tab.key
                      ? 'text-blue-950 border-b-2 border-blue-950 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

        <div className="bg-white rounded-b-lg overflow-hidden flex-1 min-h-0 overflow-auto p-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-red-700">
            {error}
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-2 underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {currentTab === 'all' && !error && (
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
                      placeholder="Filtrar por id"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs text-gray-600 mb-1">Full name</label>
                    <input
                      type="text"
                      value={usersFilter.user_full_name}
                      onChange={(e) => setUsersFilter((f) => ({ ...f, user_full_name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Filtrar por nombre"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs text-gray-600 mb-1">User Type</label>
                    <input
                      type="text"
                      value={usersFilter.user_role}
                      onChange={(e) => setUsersFilter((f) => ({ ...f, user_role: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Filtrar por tipo"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs text-gray-600 mb-1">Description</label>
                    <input
                      type="text"
                      value={usersFilter.user_description}
                      onChange={(e) => setUsersFilter((f) => ({ ...f, user_description: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Filtrar por descripción"
                    />
                  </div>
                </div>
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                        id_usuario
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
                      const userSlug = (user as UserContent).id ?? user.id_user;
                      const href = `${USERS_BASE}/${encodeURIComponent(userSlug)}`;
                      const linkClass = "block w-full text-left text-gray-900 group-hover:text-white py-1 -my-1";
                      return (
                        <tr key={user.id_user} className="group hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-3 text-sm border-b border-gray-200">
                            <Link href={href} className={`${linkClass} hover:underline whitespace-nowrap`} aria-label={`Ver usuario ${user.user_full_name}`}>
                              {user.id_user}
                            </Link>
                          </td>
                          <td className="px-6 py-3 text-sm border-b border-gray-200 whitespace-nowrap">
                            <Link href={href} className={linkClass} tabIndex={-1} aria-hidden>{user.user_full_name}</Link>
                          </td>
                          <td className="px-6 py-3 text-sm border-b border-gray-200 whitespace-nowrap">
                            <Link href={href} className={linkClass} tabIndex={-1} aria-hidden>{user.user_role}</Link>
                          </td>
                          <td className="px-6 py-3 text-sm border-b border-gray-200">
                            <Link href={href} className={linkClass} tabIndex={-1} aria-hidden>{user.user_description}</Link>
                          </td>
                        </tr>
                      );
                    })}
                    {users.length > 0 && filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-sm text-gray-500">
                          No hay resultados que coincidan con el filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {currentTab === 'lists' && !error && (
          <div className="p-6 flex flex-col flex-1 min-h-0">
            <p className="text-sm text-gray-600 mb-4">Listas de envío de newsletters. Haz clic en una fila para ver los users y contacts asignados.</p>
            <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
              <div className="min-w-0">
                <label className="block text-xs text-gray-600 mb-1">Lista</label>
                <input
                  type="text"
                  value={listsFilter.userListName}
                  onChange={(e) => setListsFilter((f) => ({ ...f, userListName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filtrar por nombre de lista"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs text-gray-600 mb-1">ID</label>
                <input
                  type="text"
                  value={listsFilter.userList_id}
                  onChange={(e) => setListsFilter((f) => ({ ...f, userList_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filtrar por ID"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs text-gray-600 mb-1">Portal</label>
                <input
                  type="text"
                  value={listsFilter.userListPortal}
                  onChange={(e) => setListsFilter((f) => ({ ...f, userListPortal: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filtrar por portal"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs text-gray-600 mb-1">Tema</label>
                <input
                  type="text"
                  value={listsFilter.userListTopic}
                  onChange={(e) => setListsFilter((f) => ({ ...f, userListTopic: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filtrar por tema"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                      Lista
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                      Portal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                      Tema
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userLists.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-sm text-gray-200">
                        No hay listas de envío de newsletters configuradas.
                      </td>
                    </tr>
                  ) : (
                    filteredUserLists.map((list) => {
                      const href = `${LISTS_BASE}/${encodeURIComponent(list.userList_id)}`;
                      const rowLinkClass = "block w-full text-left py-1 -my-1 text-gray-900 group-hover:text-white";
                      return (  
                        <tr key={list.userList_id} className="group hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-3 text-sm border-b border-gray-200">
                            <Link href={href} className={`${rowLinkClass} font-medium`} aria-label={`Ver lista ${list.userListName}`}>
                              {list.userListName}
                            </Link>
                          </td>
                          <td className="px-6 py-3 text-sm border-b border-gray-200 font-mono">
                            <Link href={href} className={rowLinkClass} tabIndex={-1} aria-hidden>{list.userList_id}</Link>
                          </td>
                          <td className="px-6 py-3 text-sm border-b border-gray-200">
                            <Link href={href} className={rowLinkClass} tabIndex={-1} aria-hidden>{list.userListPortal}</Link>
                          </td>
                          <td className="px-6 py-3 text-sm border-b border-gray-200">
                            <Link href={href} className={rowLinkClass} tabIndex={-1} aria-hidden>{list.userListTopic}</Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {userLists.length > 0 && filteredUserLists.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-sm text-gray-500">
                        No hay resultados que coincidan con el filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default Users;
