"use client";

import React, { FC, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { useUsers } from "../../hooks/useUsers";
import { ContactService } from "@/app/service/ContactService";
import apiClient from "@/app/apiClient";
import DeleteNewsletterUserListConfirmModal from "@/app/logged/logged_components/modals/DeleteNewsletterUserListConfirmModal";

const USERS_BASE = "/logged/pages/network/users";
const USER_LISTS_BASE = "/logged/pages/network/user_lists";
/** From /api/v1/user-lists; listUserIdsArray is aggregated from user_list_subscriptions. */
type UserList = {
  userList_id: string;
  userListName: string;
  userListPortal: string;
  userListTopic: string;
  listUserIdsArray?: string[];
  newsletterListType?: "main" | "specific" | string;
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
  const router = useRouter();
  const { users } = useUsers();
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [contacts, setContacts] = useState<ContactContent[]>([]);
  const [typeSaving, setTypeSaving] = useState(false);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    apiClient
      .get("/api/v1/user-lists")
      .then((res) => setUserLists(Array.isArray(res.data) ? (res.data as UserList[]) : []))
      .catch(() => setUserLists([]));
  }, []);
  useEffect(() => {
    ContactService.getAllContacts()
      .then((l) => setContacts(Array.isArray(l) ? (l as ContactContent[]) : []))
      .catch(() => setContacts([]));
  }, []);

  const list = useMemo(() => userLists.find((l) => l.userList_id === decodedId), [userLists, decodedId]);

  const usersInList = useMemo(() => {
    const ids = list?.listUserIdsArray;
    if (Array.isArray(ids) && ids.length > 0) {
      return users.filter((u) => u.id && ids.includes(u.id));
    }
    return users.filter(
      (u) =>
        Array.isArray((u as { userListArray?: string[] }).userListArray) &&
        (u as { userListArray?: string[] }).userListArray!.includes(decodedId)
    );
  }, [users, decodedId, list]);

  const contactsInList = useMemo(() => {
    return contacts.filter((c) => Array.isArray(c.userListArray) && c.userListArray.includes(decodedId));
  }, [contacts, decodedId]);

  const listType = list?.newsletterListType === "main" ? "main" : "specific";

  useEffect(() => {
    if (list) {
      setPageMeta({
        pageTitle: list.userListName,
        breadcrumbs: [
          { label: "User Lists", href: USER_LISTS_BASE },
          { label: list.userListName },
        ],
        buttons: [{ label: "Back to lists", href: USER_LISTS_BASE }],
      });
    } else if (userLists.length > 0) {
      setPageMeta({
        pageTitle: "List not found",
        breadcrumbs: [{ label: "User Lists", href: USER_LISTS_BASE }],
        buttons: [{ label: "Back to lists", href: USER_LISTS_BASE }],
      });
    }
  }, [list, userLists.length, setPageMeta]);

  const handleListTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value === "main" ? "main" : "specific";
    setTypeError(null);
    setTypeSaving(true);
    try {
      await apiClient.patch(`/api/v1/user-lists/${encodeURIComponent(decodedId)}`, {
        newsletter_list_type: next,
      });
      window.location.reload();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Could not update list type.";
      setTypeError(msg);
    } finally {
      setTypeSaving(false);
    }
  };

  if (userLists.length > 0 && !list) {
    return (
      <PageContentSection>
        <div className="p-6">
          <p className="text-gray-500">List not found.</p>
          <Link href={USER_LISTS_BASE} className="mt-4 inline-block text-blue-600 hover:underline">
            Back to User Lists
          </Link>
        </div>
      </PageContentSection>
    );
  }

  if (!list) {
    return (
      <PageContentSection>
        <div className="p-6 text-gray-500">Loading…</div>
      </PageContentSection>
    );
  }

  return (
    <PageContentSection>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1 font-mono text-xs text-gray-500">ID: {list.userList_id}</p>
            <p className="text-sm font-medium text-gray-700">
              <span className="text-gray-500">Sending list:</span> {list.userListName}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {list.userListPortal} · Topic: {list.userListTopic}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex flex-col gap-1">
              <label htmlFor="list-type-select" className="text-xs font-medium uppercase tracking-wide text-gray-600">
                List type
              </label>
              <select
                id="list-type-select"
                value={listType}
                disabled={typeSaving}
                onChange={(e) => void handleListTypeChange(e)}
                className="min-w-[10rem] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
              >
                <option value="main">main</option>
                <option value="specific">specific</option>
              </select>
              {typeSaving && <p className="text-xs text-gray-500">Saving…</p>}
              {typeError && <p className="text-xs text-red-600">{typeError}</p>}
            </div>
            {listType === "specific" && (
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white shadow hover:bg-red-700"
              >
                DELETE LIST
              </button>
            )}
          </div>
        </div>

        <DeleteNewsletterUserListConfirmModal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          listId={list.userList_id}
          listName={list.userListName}
          onDeleted={() => router.push(USER_LISTS_BASE)}
        />

        <div className="overflow-x-auto">
          <p className="mb-2 text-sm font-semibold text-gray-700">Users in this sending list</p>
          <p className="mb-2 text-xs text-gray-500">Click a row to open the user detail page.</p>
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {usersInList.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-500">No users in this sending list</td>
                </tr>
              ) : (
                usersInList.map((u) => {
                  const slug = (u as { id?: string }).id ?? u.id_user;
                  const href = `${USERS_BASE}/${encodeURIComponent(slug)}`;
                  return (
                    <tr
                      key={u.id_user}
                      role="link"
                      tabIndex={0}
                      className="group cursor-pointer transition-colors hover:bg-gray-800 focus:bg-gray-800 focus:outline-none"
                      onClick={() => router.push(href)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(href);
                        }
                      }}
                    >
                      <td className="border-b border-gray-200 px-4 py-3 text-sm text-gray-900 group-hover:text-white">
                        <span className="font-medium">{u.user_full_name || u.id_user}</span>
                        <span className="ml-2 text-xs text-gray-500 group-hover:text-gray-200">Open profile →</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <p className="mb-2 text-sm font-semibold text-gray-700">Contacts in this sending list</p>
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">id_contact</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {contactsInList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm text-gray-500">
                    No contacts in this sending list
                  </td>
                </tr>
              ) : (
                contactsInList.map((c) => (
                  <tr key={c.id_contact} className="hover:bg-gray-50">
                    <td className="border-b border-gray-200 px-4 py-2 text-sm text-gray-900">{c.id_contact}</td>
                    <td className="border-b border-gray-200 px-4 py-2 text-sm text-gray-900">{c.name}</td>
                    <td className="border-b border-gray-200 px-4 py-2 text-sm text-gray-900">{c.role}</td>
                    <td className="border-b border-gray-200 px-4 py-2 text-sm text-gray-900">{c.email}</td>
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
