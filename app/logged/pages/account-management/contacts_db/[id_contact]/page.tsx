"use client";

import React, { FC, use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ContactService } from "@/app/service/ContactService";

type CommentItem = {
  contact_comment_id: string;
  contact_id: string;
  agent_id: string | null;
  contact_comment_content: string;
  contact_comment_created_at: string | null;
  contact_comment_updated_at: string | null;
};

type Contact = {
  id_contact: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  id_customer?: string;
  company_name?: string;
  /** Optional link to Plynium network user profile */
  id_user?: string;
  /** Optional LinkedIn profile URL */
  linkedin_profile?: string;
};

type TabKey = "main" | "comments";

const ContactDetailPage: FC<{ params: Promise<{ id_contact: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_contact } = use(params);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    ContactService.getContactById(id_contact)
      .then((data: Contact) => {
        if (!cancelled) setContact({ ...data, comments: data.comments ?? [] });
      })
      .catch(() => {
        if (!cancelled) setContact(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id_contact]);

  const [currentTab, setCurrentTab] = useState<TabKey>("main");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");

  const loadComments = useCallback(async () => {
    try {
      const list = await ContactService.getContactComments(id_contact);
      setComments(Array.isArray(list) ? (list as CommentItem[]) : []);
    } catch {
      setComments([]);
    }
  }, [id_contact]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleAddComment = async () => {
    const text = newComment.trim();
    if (!text) return;
    try {
      await ContactService.addContactComment(id_contact, {
        agent_id: null,
        contact_comment_content: text,
      });
      setNewComment("");
      await loadComments();
    } catch {
      // If API fails, keep UX consistent by not mutating local list.
    }
  };

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    if (!contact) {
      setPageMeta({
        pageTitle: "Contacto no encontrado",
        breadcrumbs: [{ label: "Account management", href: "/logged/pages/account-management/customers_db" }, { label: "Contacts DB", href: "/logged/pages/account-management/contacts_db" }],
        buttons: [{ label: "Back to Contacts", href: "/logged/pages/account-management/contacts_db" }],
      });
    } else {
      setPageMeta({
        pageTitle: contact.name,
        breadcrumbs: [
          { label: "Account management", href: "/logged/pages/account-management/customers_db" },
          { label: "Contacts DB", href: "/logged/pages/account-management/contacts_db" },
          { label: contact.name },
        ],
        buttons: [{ label: "Back to Contacts", href: "/logged/pages/account-management/contacts_db" }],
      });
    }
  }, [contact, setPageMeta]);

  if (loading) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
            <p className="text-gray-500 text-sm">Loading contact…</p>
          </div>
        </div>
      </PageContentSection>
    );
  }

  if (!contact) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
            <p className="text-gray-500">Contacto no encontrado.</p>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "main", label: "Details" },
    { key: "comments", label: "Comments" },
  ];

  return (
    <>
      <PageContentSection className="p-0 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="flex flex-col w-full">
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
                    ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }
              `}
            >
              {tab.label}
              {tab.key === "comments" && comments.length > 0 && (
                <span className="ml-1.5 text-xs text-gray-500">({comments.length})</span>
              )}
            </button>
          ))}
          </div>

      <div className="bg-white rounded-b-lg overflow-hidden flex-1 min-h-0 overflow-auto w-full min-w-0">
        {currentTab === "main" && (
          <div className="p-6 w-full max-w-none box-border space-y-6">
            <section className="w-full bg-gray-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                <Field label="Name" value={contact.name} />
                <Field label="Rol" value={contact.role} />
                <Field label="Email" value={contact.email} link={contact.email ? `mailto:${contact.email}` : undefined} />
                <Field label="Phone" value={contact.phone} link={contact.phone ? `tel:${contact.phone}` : undefined} />
                <Field label="Empresa" value={contact.company_name} className="lg:col-span-2" />
                <Field
                  label="Link to LinkedIn profile"
                  value={contact.linkedin_profile ? "LinkedIn profile" : undefined}
                  link={contact.linkedin_profile}
                  className="lg:col-span-2"
                />
                {contact.id_customer && (
                  <div className="lg:col-span-3">
                    <p className="text-xs text-gray-500 uppercase mb-0.5">Cliente</p>
                    <button
                      type="button"
                      onClick={() => router.push(`/logged/pages/account-management/customers_db/${contact.id_customer}`)}
                      className="text-blue-600 hover:underline font-medium text-left"
                    >
                      {contact.company_name || contact.id_customer}
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="w-full bg-gray-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Plynium user profile vinculation</h2>
              {contact.id_user ? (
                <>
                  <p className="text-sm text-gray-600 mb-2">This contact is linked to the following Plynium user:</p>
                  <Link
                    href={`/logged/pages/network/users/${encodeURIComponent(contact.id_user)}`}
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-medium"
                  >
                    View Plynium user profile
                    <span className="text-gray-400">→</span>
                  </Link>
                </>
              ) : (
                <p className="text-sm text-gray-500">No Plynium user linked to this contact.</p>
              )}
            </section>
          </div>
        )}

        {currentTab === "comments" && (
          <div className="p-6 w-full max-w-none box-border">
            <div className="mb-6 w-full max-w-2xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add comment</label>
              <div className="flex gap-2 w-full">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Write a comment..."
                  className="flex-1 min-w-0 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2.5 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="w-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Comments ({comments.length})</h2>
              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No comments yet. Add the first one above.</p>
              ) : (
                <ul className="space-y-3 w-full max-w-2xl">
                  {comments.map((cmt) => (
                    <li
                      key={cmt.contact_comment_id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-800 text-sm w-full"
                    >
                      <p className="whitespace-pre-wrap">{cmt.contact_comment_content}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        {cmt.agent_id ?? "—"}{" "}
                        {cmt.contact_comment_created_at
                          ? ` · ${String(cmt.contact_comment_created_at).slice(0, 10)}`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
        </div>
      </PageContentSection>
    </>
  );
};

function Field({
  label,
  value,
  link,
  className = "",
}: {
  label: string;
  value?: string | null;
  link?: string;
  className?: string;
}) {
  if (value == null || value === "") return null;
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-xs text-gray-500 uppercase mb-0.5">{label}</p>
      {link ? (
        <a href={link} className="text-blue-600 hover:underline font-medium break-all">
          {value}
        </a>
      ) : (
        <p className="font-medium text-gray-900 break-words">{value}</p>
      )}
    </div>
  );
}

export default ContactDetailPage;
