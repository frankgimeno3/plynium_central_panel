"use client";

import React, { FC, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import { useUsers } from './hooks/useUsers';
import userListsData from '@/app/contents/userLists.json';
import userContentsData from '@/app/contents/userContents.json';
import contactsContentsData from '@/app/contents/contactsContents.json';

type UserList = {
  userList_id: string;
  userListName: string;
  userListPortal: string;
  userListTopic: string;
};

type UserContent = {
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

const userLists = userListsData as UserList[];
const userContents = userContentsData as UserContent[];
const contactsContents = contactsContentsData as ContactContent[];

interface UsersProps {}

const USERS_BASE = '/logged/pages/network/users';

const Users: FC<UsersProps> = () => {
  const { users, loading, error, refetch } = useUsers();
  const [currentTab, setCurrentTab] = useState<UsersTabKey>('all');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ user_name: string } | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => setCurrentUser({ user_name: data.user_name ?? 'User' }))
      .catch(() => setCurrentUser({ user_name: 'User' }));
  }, []);

  const breadcrumbs = [{ label: "Users" }];
  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Users", breadcrumbs, buttons: [] });
  }, [setPageMeta, breadcrumbs]);

  const usersInList = useMemo(() => {
    if (!selectedListId) return [];
    return userContents.filter(
      (u) => Array.isArray(u.userListArray) && u.userListArray.includes(selectedListId)
    );
  }, [selectedListId]);

  const contactsInList = useMemo(() => {
    if (!selectedListId) return [];
    return contactsContents.filter(
      (c) => Array.isArray(c.userListArray) && c.userListArray.includes(selectedListId)
    );
  }, [selectedListId]);

  const selectedList = useMemo(
    () => userLists.find((l) => l.userList_id === selectedListId),
    [selectedListId]
  );

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
                onClick={() => {
                  setCurrentTab(tab.key);
                  if (tab.key === 'lists') setSelectedListId(userLists[0]?.userList_id ?? null);
                  else setSelectedListId(null);
                }}
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
                    {users.map((user) => (
                      <tr key={user.id_user} className="hover:bg-gray-100 transition-colors">
                        <td colSpan={4} className="p-0 border-b border-gray-200">
                          <Link
                            href={`${USERS_BASE}/${encodeURIComponent(user.id_user)}`}
                            className="grid grid-cols-[1fr_1fr_1fr_2fr] gap-4 px-6 py-4 text-sm text-gray-900 cursor-pointer items-center"
                            aria-label={`Ver usuario ${user.user_full_name}`}
                          >
                            <span className="whitespace-nowrap">{user.id_user}</span>
                            <span className="whitespace-nowrap">{user.user_full_name}</span>
                            <span className="whitespace-nowrap">{user.user_role}</span>
                            <span>{user.user_description}</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {currentTab === 'lists' && !error && (
          <div className="p-6 flex flex-col gap-6 flex-1 min-h-0">
            <p className="text-sm text-gray-600">Listas de envío de newsletters. Selecciona una lista para ver los users y contacts asignados.</p>
            <div className="flex flex-wrap gap-2">
              {userLists.map((list) => (
                <button
                  key={list.userList_id}
                  type="button"
                  onClick={() => setSelectedListId(list.userList_id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedListId === list.userList_id
                      ? 'bg-blue-950 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {list.userListName}
                </button>
              ))}
            </div>

            {selectedList && (
              <>
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                  <p className="text-xs font-mono text-gray-500 mb-1">ID: {selectedList.userList_id}</p>
                  <p className="text-sm font-medium text-gray-700">
                    <span className="text-gray-500">Lista de envío:</span> {selectedList.userListName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Portal: {selectedList.userListPortal} · Tema: {selectedList.userListTopic}
                  </p>
                </div>

                <div className="overflow-x-auto flex-1">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Users en esta lista de envío</p>
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">id_user</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Full name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usersInList.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-sm text-gray-500">
                            Ningún user en esta lista de envío
                          </td>
                        </tr>
                      ) : (
                        usersInList.map((u) => (
                          <tr key={u.id_user} className="hover:bg-gray-100 transition-colors">
                            <td colSpan={3} className="p-0">
                              <Link
                                href={`${USERS_BASE}/${encodeURIComponent(u.id_user)}`}
                                className="grid grid-cols-3 gap-2 px-4 py-2 text-sm text-gray-900 cursor-pointer items-center"
                                aria-label={`Ver usuario ${u.user_full_name}`}
                              >
                                <span>{u.id_user}</span>
                                <span>{u.user_full_name}</span>
                                <span>{u.user_role}</span>
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <p className="text-sm font-semibold text-gray-700 mt-4 mb-2">Contacts en esta lista de envío</p>
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">id_contact</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contactsInList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-sm text-gray-500">
                            Ningún contact en esta lista de envío
                          </td>
                        </tr>
                      ) : (
                        contactsInList.map((c) => (
                          <tr key={c.id_contact} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{c.id_contact}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{c.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{c.role}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{c.email}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {userLists.length === 0 && (
              <p className="text-gray-500 text-sm">No hay listas de envío de newsletters configuradas.</p>
            )}
          </div>
        )}
        </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default Users;
