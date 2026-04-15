"use client";

import React, { FC, useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import UserService from '@/app/service/UserSerivce.js';
import { ContactService } from '@/app/service/ContactService';
import apiClient from "@/app/apiClient";
import SelectContactModal from "@/app/logged/logged_components/modals/SelectContactModal";
import SelectNewsletterListModal, { type NewsletterListRow } from "@/app/logged/logged_components/modals/SelectNewsletterListModal";
import ConfirmActionModal from "@/app/logged/logged_components/modals/ConfirmActionModal";

interface UserDetail {
  id?: string;
  id_user: string; // email
  user_full_name: string;
  user_name: string;
  user_surnames?: string;
  user_role: string;
  user_description: string;
  user_main_image_src?: string;
  linkedin_profile?: string | null;
  userListArray?: string[];
  preferences?: unknown;
  enabled?: boolean;
  contact_id_array?: string[];
}

type ContactFromJson = {
  id_contact: string;
  name?: string;
  email?: string;
  id_user?: string;
  userListArray?: string[];
};
type ExperienceRow = {
  employee_rel_id: string;
  employee_company_id: string;
  employee_role: string;
  employee_rel_status?: string | null;
  employee_rel_start_date?: string | null;
  employee_rel_end_date?: string | null;
  company_commercial_name?: string | null;
};

const UserDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id_user;
  const id_user = Array.isArray(idParam) ? idParam[0] : (idParam as string) || '';

  const [user, setUser] = useState<UserDetail | null>(null);
  const [contactsData, setContactsData] = useState<ContactFromJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setPageMeta } = usePageContent();
  const [experience, setExperience] = useState<ExperienceRow[]>([]);
  const [experienceLoading, setExperienceLoading] = useState(false);
  const [experienceError, setExperienceError] = useState<string | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [savingContacts, setSavingContacts] = useState(false);
  const [contactsLinkError, setContactsLinkError] = useState<string | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<{ id_contact: string; label: string } | null>(null);
  const [unlinkingContact, setUnlinkingContact] = useState(false);
  const [newsletterModalOpen, setNewsletterModalOpen] = useState(false);
  const [savingNewsletter, setSavingNewsletter] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [allLists, setAllLists] = useState<NewsletterListRow[]>([]);

  const [form, setForm] = useState({
    user_full_name: "",
    user_name: "",
    user_surnames: "",
    user_role: "",
    user_description: "",
    linkedin_profile: "",
  });

  useEffect(() => {
    ContactService.getAllContacts()
      .then((l) => setContactsData(Array.isArray(l) ? l as ContactFromJson[] : []))
      .catch(() => setContactsData([]));
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      if (!id_user) return;
      setLoading(true);
      setError(null);
      try {
        const data = await UserService.getUserById(decodeURIComponent(id_user));
        setUser(data);
        setForm({
          user_full_name: String(data?.user_full_name ?? ""),
          user_name: String(data?.user_name ?? ""),
          user_surnames: String(data?.user_surnames ?? ""),
          user_role: String(data?.user_role ?? ""),
          user_description: String(data?.user_description ?? ""),
          linkedin_profile: String(data?.linkedin_profile ?? ""),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error loading user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [id_user]);

  useEffect(() => {
    if (!user?.id) return;
    setExperienceLoading(true);
    setExperienceError(null);
    apiClient
      .get("/api/v1/employee-relations", {
        params: { userId: user.id, status: "" },
      })
      .then((res) => {
        const list = Array.isArray(res.data) ? (res.data as ExperienceRow[]) : [];
        setExperience(list);
      })
      .catch((e: unknown) => {
        const message =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Error loading experience";
        setExperienceError(message);
        setExperience([]);
      })
      .finally(() => setExperienceLoading(false));
  }, [user?.id]);

  useEffect(() => {
    apiClient
      .get("/api/v1/user-lists")
      .then((res) => setAllLists(Array.isArray(res.data) ? (res.data as NewsletterListRow[]) : []))
      .catch(() => setAllLists([]));
  }, []);

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return String(iso);
    }
  };

  useEffect(() => {
    if (user) {
      setPageMeta({
        pageTitle: "User details",
        breadcrumbs: [
          { label: "Users", href: "/logged/pages/network/users" },
          { label: user.user_full_name ?? user.id_user },
        ],
        buttons: [{ label: "Back to Users", href: "/logged/pages/network/users" }],
      });
    } else {
      setPageMeta({
        pageTitle: "User details",
        breadcrumbs: [{ label: "Users", href: "/logged/pages/network/users" }],
        buttons: [{ label: "Back to Users", href: "/logged/pages/network/users" }],
      });
    }
  }, [setPageMeta, user]);

  const linkedContacts = useMemo(() => {
    if (!user?.id) return [];
    const uid = String(user.id);
    const list = Array.isArray(contactsData) ? contactsData : [];
    return list.filter((c) =>
      Array.isArray(c.userListArray) ? c.userListArray.map(String).includes(uid) : false
    );
  }, [user?.id, contactsData]);

  const isDirty =
    !!user &&
    (form.user_full_name !== String(user.user_full_name ?? "") ||
      form.user_name !== String(user.user_name ?? "") ||
      form.user_surnames !== String(user.user_surnames ?? "") ||
      form.user_role !== String(user.user_role ?? "") ||
      form.user_description !== String(user.user_description ?? "") ||
      form.linkedin_profile !== String(user.linkedin_profile ?? ""));

  const linkedinError = useMemo(() => {
    const val = form.linkedin_profile.trim();
    if (!val) return null;
    try {
      const u = new URL(val);
      if (u.protocol !== "http:" && u.protocol !== "https:") return "LinkedIn profile must be a valid URL.";
      return null;
    } catch {
      return "LinkedIn profile must be a valid URL.";
    }
  }, [form.linkedin_profile]);

  const canSave = isDirty && !linkedinError;

  const executeSave = async () => {
    if (!user) return;
    if (linkedinError) {
      setSaveError(linkedinError);
      setConfirmOpen(false);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      // Cognito admin update supports only: name (mapped here to user_full_name), email, password, enabled.
      // We keep email/username unchanged to avoid Cognito username/email mismatch.
      await UserService.updateUser(
        user.id_user, // username in Cognito (email)
        form.user_full_name,
        user.id_user, // email attribute
        undefined,
        user.enabled
      );

      // Update users_db.user_linkedin_profile
      if (user.id) {
        await apiClient.patch(
          `/api/v1/admin/user/${encodeURIComponent(user.id)}/linkedin`,
          { linkedin_profile: form.linkedin_profile }
        );
      }

      // Reload to fetch latest data.
      window.location.reload();
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "Error saving";
      setSaveError(message);
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center text-gray-600">
              <p className="text-lg">Loading user...</p>
            </div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  if (error || !user) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center text-gray-600">
              <p className="text-red-500 text-lg">{error || 'User not found'}</p>
              <button
                onClick={() => router.push('/logged/pages/network/users')}
                className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-950/80"
              >
                Back to Users
              </button>
            </div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-gray-600">
        {isDirty && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!canSave}
            className="fixed bottom-6 right-6 z-50 rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save changes
          </button>
        )}
        <div className="flex flex-col w-full">
          {user.user_main_image_src && (
            <div className="mb-6">
              <img
                src={user.user_main_image_src}
                alt={user.user_full_name}
                className="w-24 h-24 rounded-full object-cover border border-gray-200"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">User ID</label>
              <p className="text-lg text-gray-900 font-mono">{user.id ?? "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg text-gray-900 font-mono">{user.id_user}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Full name</label>
              <input
                type="text"
                value={form.user_full_name}
                onChange={(e) => setForm((f) => ({ ...f, user_full_name: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <input
                type="text"
                value={form.user_name}
                onChange={(e) => setForm((f) => ({ ...f, user_name: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last name</label>
              <input
                type="text"
                value={form.user_surnames}
                onChange={(e) => setForm((f) => ({ ...f, user_surnames: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <input
                type="text"
                value={form.user_role}
                onChange={(e) => setForm((f) => ({ ...f, user_role: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <input
                type="text"
                value={form.user_description}
                onChange={(e) => setForm((f) => ({ ...f, user_description: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">LinkedIn profile</label>
              <input
                type="url"
                value={form.linkedin_profile}
                onChange={(e) => setForm((f) => ({ ...f, linkedin_profile: e.target.value }))}
                placeholder="https://www.linkedin.com/in/username"
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {linkedinError && (
                <p className="mt-1 text-xs text-red-600">{linkedinError}</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Plynium Account Contact</h2>
              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="w-10 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                aria-label="Add contact"
              >
                [ + ]
              </button>
            </div>

            {contactsLinkError && (
              <p className="text-sm text-red-600 mb-3">{contactsLinkError}</p>
            )}

            {linkedContacts.length === 0 ? (
              <p className="text-sm text-gray-500">No contacts linked.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {linkedContacts.map((c) => {
                  const href = `/logged/pages/account-management/contacts_db/${encodeURIComponent(
                    c.id_contact
                  )}`;
                  const title =
                    String(c.name ?? "").trim() ||
                    c.email ||
                    c.id_contact;
                  return (
                    <div
                      key={c.id_contact}
                      className="relative rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => router.push(href)}
                        className="block w-full text-left"
                      >
                        <p className="text-sm font-semibold text-gray-900 truncate pr-10">{title}</p>
                        <p className="mt-1 text-xs font-mono text-gray-500 truncate pr-10">{c.id_contact}</p>
                        {c.email ? (
                          <p className="mt-1 text-xs text-gray-600 truncate pr-10">{c.email}</p>
                        ) : null}
                      </button>

                      <div className="absolute top-3 right-3">
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => setUnlinkTarget({ id_contact: c.id_contact, label: title })}
                            className="w-8 h-8 rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
                            aria-label="Unlink contact from user"
                          >
                            ×
                          </button>
                          <div className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover:block">
                            <div className="whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow">
                              Unlink contact from user
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Newsletter Lists</h2>
              <button
                type="button"
                onClick={() => setNewsletterModalOpen(true)}
                className="w-10 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                aria-label="Add newsletter list"
              >
                [ + ]
              </button>
            </div>

            {newsletterError && <p className="text-sm text-red-600 mb-3">{newsletterError}</p>}

            {Array.isArray(user.userListArray) && user.userListArray.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {user.userListArray.map((id) => {
                  const sid = String(id);
                  const info = allLists.find((l) => String(l.userList_id) === sid);
                  const href = `/logged/pages/network/users/lists/${encodeURIComponent(sid)}`;
                  return (
                    <button
                      key={sid}
                      type="button"
                      onClick={() => router.push(href)}
                      className="text-left rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {info?.userListName || sid}
                      </p>
                      <p className="mt-1 text-xs text-gray-600 truncate">
                        {info?.userListPortal || "—"}{info?.userListTopic ? ` · ${info.userListTopic}` : ""}
                      </p>
                      <p className="mt-1 text-xs font-mono text-gray-500 truncate">{sid}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No newsletter lists assigned.</p>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Experience</h2>

            {experienceError && (
              <p className="text-sm text-red-600 mb-3">{experienceError}</p>
            )}

            {experienceLoading ? (
              <p className="text-sm text-gray-500">Loading experience...</p>
            ) : experience.length === 0 ? (
              <p className="text-sm text-gray-500">No experience records.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Company
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        From
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        To
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {experience.map((er) => {
                      const companyHref = `/logged/pages/network/directory/companies/${encodeURIComponent(
                        er.employee_company_id
                      )}`;
                      const companyLabel =
                        er.company_commercial_name?.trim() || er.employee_company_id;
                      return (
                        <tr
                          key={er.employee_rel_id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(companyHref)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(companyHref);
                            }
                          }}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {er.employee_role || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                            {companyLabel}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {formatDate(er.employee_rel_start_date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {er.employee_rel_end_date ? formatDate(er.employee_rel_end_date) : "Present"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {er.employee_rel_status ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {user.preferences != null && user.preferences !== undefined && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-500">Preferences</label>
              <pre className="mt-2 text-sm text-gray-900 bg-gray-50 p-4 rounded overflow-x-auto">
                {JSON.stringify(user.preferences, null, 2)}
              </pre>
            </div>
          )}
        </div>
            </div>
          </div>
        </div>
      </PageContentSection>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => (saving ? null : setConfirmOpen(false))}
              aria-label="Close"
              disabled={saving}
            >
              ×
            </button>

            <h2 className="mb-2 text-xl font-semibold text-gray-900">Confirm changes</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to save these changes? This will update the user and reload the page.
            </p>

            {saveError && (
              <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">
                {saveError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setConfirmOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                onClick={executeSave}
                disabled={saving || !canSave}
              >
                {saving ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
        )}

      <SelectContactModal
        open={contactModalOpen}
        onClose={() => (savingContacts ? null : setContactModalOpen(false))}
        onConfirm={async (contact) => {
          if (!user?.id) return;
          setSavingContacts(true);
          setContactsLinkError(null);
          try {
            // Link by writing the current user's UUID into contacts_db.contact_user_id_array
            const updatedContact = await ContactService.updateContact(String(contact.id_contact), {
              id_user: String(user.id),
            });
            setContactsData((prev) => {
              const next = Array.isArray(prev) ? [...prev] : [];
              const idx = next.findIndex((c) => String(c.id_contact) === String(contact.id_contact));
              if (idx >= 0) next[idx] = updatedContact;
              else next.unshift(updatedContact);
              return next;
            });
            setContactModalOpen(false);
          } catch (e: unknown) {
            const message =
              e && typeof e === "object" && "message" in e
                ? String((e as { message: unknown }).message)
                : "Failed to link contact";
            setContactsLinkError(message);
          } finally {
            setSavingContacts(false);
          }
        }}
      />

      <ConfirmActionModal
        open={!!unlinkTarget}
        title="Unlink contact"
        message={
          unlinkTarget
            ? `Are you sure you want to unlink "${unlinkTarget.label}" from this user?`
            : "Are you sure you want to unlink this contact?"
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        confirming={unlinkingContact}
        onClose={() => (unlinkingContact ? null : setUnlinkTarget(null))}
        onConfirm={async () => {
          if (!unlinkTarget || !user?.id) return;
          setUnlinkingContact(true);
          setContactsLinkError(null);
          try {
            const existing = contactsData.find((c) => String(c.id_contact) === String(unlinkTarget.id_contact));
            const currentArr = Array.isArray(existing?.userListArray) ? existing!.userListArray.map(String) : [];
            const nextArr = currentArr.filter((x) => x !== String(user.id));
            const updatedContact = await ContactService.updateContact(String(unlinkTarget.id_contact), {
              userListArray: nextArr,
            });
            setContactsData((prev) => {
              const next = Array.isArray(prev) ? [...prev] : [];
              const idx = next.findIndex((c) => String(c.id_contact) === String(unlinkTarget.id_contact));
              if (idx >= 0) next[idx] = updatedContact;
              return next;
            });
            setUnlinkTarget(null);
          } catch (e: unknown) {
            const message =
              e && typeof e === "object" && "message" in e
                ? String((e as { message: unknown }).message)
                : "Failed to unlink contact";
            setContactsLinkError(message);
          } finally {
            setUnlinkingContact(false);
          }
        }}
      />

      <SelectNewsletterListModal
        open={newsletterModalOpen}
        onClose={() => (savingNewsletter ? null : setNewsletterModalOpen(false))}
        onConfirm={async (list) => {
          if (!user?.id) return;
          setSavingNewsletter(true);
          setNewsletterError(null);
          try {
            const current = Array.isArray(user.userListArray) ? user.userListArray : [];
            const next = Array.from(new Set([...current.map(String), String(list.userList_id)]));
            const updated = await apiClient.patch(
              `/api/v1/admin/user/${encodeURIComponent(user.id)}/newsletter-lists`,
              { newsletter_user_lists_id_array: next }
            );
            setUser(updated?.data ?? user);
            setNewsletterModalOpen(false);
          } catch (e: unknown) {
            const message =
              e && typeof e === "object" && "message" in e
                ? String((e as { message: unknown }).message)
                : "Failed to assign newsletter list";
            setNewsletterError(message);
          } finally {
            setSavingNewsletter(false);
          }
        }}
      />
    </>
  );
};

export default UserDetailPage;
