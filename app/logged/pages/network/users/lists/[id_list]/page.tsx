"use client";

import React, { FC, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { useUsers } from "../../hooks/useUsers";
import { ContactService } from "@/app/service/ContactService";
import apiClient from "@/app/apiClient";

const USERS_BASE = "/logged/pages/network/users";
type UserList = {
  userList_id: string;
  userListName: string;
  userListPortal: string;
  userListTopic: string;
};

type ContactContent = {
  id_contact: string;
  name: string;
  role: string;
  email: string;
  userListArray?: string[];
};

const ListDetailPage: FC<{ params: Promise<{ id_list: string }> }> = ({ params }) => {
  const { id_list } = use(params);
  const decodedId = decodeURIComponent(id_list || "");
  const { users } = useUsers();
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [contacts, setContacts] = useState<ContactContent[]>([]);
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    apiClient.get("/api/v1/user-lists").then((res) => setUserLists(Array.isArray(res.data) ? (res.data as UserList[]) : [])).catch(() => setUserLists([]));
  }, []);
  useEffect(() => {
    ContactService.getAllContacts().then((l) => setContacts(Array.isArray(l) ? (l as ContactContent[]) : [])).catch(() => setContacts([]));
  }, []);

  const list = useMemo(() => userLists.find((l) => l.userList_id === decodedId), [userLists, decodedId]);

  const usersInList = useMemo(() => {
    return users.filter((u) => Array.isArray((u as { userListArray?: string[] }).userListArray) && (u as { userListArray?: string[] }).userListArray!.includes(decodedId));
  }, [users, decodedId]);

  const contactsInList = useMemo(() => {
    return contacts.filter((c) => Array.isArray(c.userListArray) && c.userListArray.includes(decodedId));
  }, [contacts, decodedId]);

  useEffect(() => {
    if (list) {
      setPageMeta({
        pageTitle: list.userListName,
        breadcrumbs: [
          { label: "Users", href: USERS_BASE },
          { label: "User Newsletter Lists", href: USERS_BASE },
          { label: list.userListName },
        ],
        buttons: [{ label: "Volver a listas", href: USERS_BASE }],
      });
    } else if (userLists.length > 0) {
      setPageMeta({
        pageTitle: "Lista no encontrada",
        breadcrumbs: [
          { label: "Users", href: USERS_BASE },
          { label: "User Newsletter Lists", href: USERS_BASE },
        ],
        buttons: [{ label: "Volver a listas", href: USERS_BASE }],
      });
    }
  }, [list, userLists.length, setPageMeta]);

  if (userLists.length > 0 && !list) {
    return (
      <PageContentSection>
        <div className="p-6">
          <p className="text-gray-500">Lista no encontrada.</p>
          <Link href={USERS_BASE} className="mt-4 inline-block text-blue-600 hover:underline">
            Volver a Users
          </Link>
        </div>
      </PageContentSection>
    );
  }

  if (!list) {
    return (
      <PageContentSection>
        <div className="p-6 text-gray-500">Cargando…</div>
      </PageContentSection>
    );
  }

  return (
    <PageContentSection>
      <div className="p-6 flex flex-col gap-6">
        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
          <p className="text-xs font-mono text-gray-500 mb-1">ID: {list.userList_id}</p>
          <p className="text-sm font-medium text-gray-700">
            <span className="text-gray-500">Lista de envío:</span> {list.userListName}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Portal: {list.userListPortal} · Tema: {list.userListTopic}
          </p>
        </div>

        <div className="overflow-x-auto">
          <p className="text-sm font-semibold text-gray-700 mb-2">Users en esta lista de envío</p>
          <p className="text-xs text-gray-500 mb-2">Haz clic en un usuario para ver su contenido en la página de detalle.</p>
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Ver</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersInList.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm text-gray-500">
                    Ningún user en esta lista de envío
                  </td>
                </tr>
              ) : (
                usersInList.map((u) => {
                  const slug = (u as { id?: string }).id ?? u.id_user;
                  const href = `${USERS_BASE}/${encodeURIComponent(slug)}`;
                  return (
                    <tr key={u.id_user} className="hover:bg-gray-100 transition-colors">
                      <td className="px-4 py-2 text-sm text-gray-900 border-b border-gray-200">{u.user_full_name || u.id_user}</td>
                      <td className="px-4 py-2 text-sm border-b border-gray-200">
                        <Link href={href} className="text-blue-600 hover:underline font-medium" aria-label={`Ver detalle de ${u.user_full_name || u.id_user}`}>
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <p className="text-sm font-semibold text-gray-700 mb-2">Contacts en esta lista de envío</p>
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
      </div>
    </PageContentSection>
  );
};

export default ListDetailPage;
