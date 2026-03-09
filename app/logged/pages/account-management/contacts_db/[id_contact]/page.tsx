"use client";

import React, { FC, use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageContentLayout from "@/app/logged/logged_components/PageContentLayout";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import contactsData from "@/app/contents/contactsContents.json";

type CommentItem = { id?: string; text: string; date?: string; author?: string };

type Contact = {
  id_contact: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  id_customer?: string;
  company_name?: string;
  comments: CommentItem[];
};

type TabKey = "principal" | "comentarios";

const ContactDetailPage: FC<{ params: Promise<{ id_contact: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_contact } = use(params);
  const contact = (contactsData as Contact[]).find((c) => c.id_contact === id_contact);

  const [currentTab, setCurrentTab] = useState<TabKey>("principal");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (contact?.comments) setComments([...contact.comments]);
    else setComments([]);
  }, [id_contact, contact?.comments]);

  const handleAddComment = () => {
    const text = newComment.trim();
    if (!text) return;
    const comment: CommentItem = {
      text,
      date: new Date().toISOString().slice(0, 10),
      author: "Usuario",
    };
    setComments((prev) => [comment, ...prev]);
    setNewComment("");
  };

  if (!contact) {
    return (
      <PageContentLayout
        pageTitle="Contacto no encontrado"
        breadcrumbs={[{ label: "Account management", href: "/logged/pages/account-management/customers_db" }, { label: "Contacts DB", href: "/logged/pages/account-management/contacts_db" }]}
        buttons={[{ label: "Volver a Contactos", href: "/logged/pages/account-management/contacts_db" }]}
      >
        <PageContentSection>
          <p className="text-gray-500">Contacto no encontrado.</p>
        </PageContentSection>
      </PageContentLayout>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "principal", label: "Ficha" },
    { key: "comentarios", label: "Comentarios" },
  ];

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Contacts DB", href: "/logged/pages/account-management/contacts_db" },
    { label: contact.name },
  ];

  return (
    <PageContentLayout
      pageTitle={contact.name}
      breadcrumbs={breadcrumbs}
      buttons={[{ label: "Volver a Contactos", href: "/logged/pages/account-management/contacts_db" }]}
    >
      <PageContentSection className="p-0 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="flex border-b border-gray-200 bg-gray-50/80">
        <div className="flex w-full">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setCurrentTab(tab.key)}
              className={`relative px-6 py-3 text-sm font-medium transition-colors ${
                currentTab === tab.key
                  ? "text-blue-950 border-b-2 border-blue-950 bg-white text-blue-950"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              {tab.key === "comentarios" && comments.length > 0 && (
                <span className="ml-1.5 text-xs text-gray-500">({comments.length})</span>
              )}
            </button>
          )          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto w-full min-w-0">
        {currentTab === "principal" && (
          <div className="p-6 w-full max-w-none box-border space-y-6">
            <section className="w-full bg-gray-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos del contacto</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                <Field label="Nombre" value={contact.name} />
                <Field label="Rol" value={contact.role} />
                <Field label="Email" value={contact.email} link={contact.email ? `mailto:${contact.email}` : undefined} />
                <Field label="Teléfono" value={contact.phone} link={contact.phone ? `tel:${contact.phone}` : undefined} />
                <Field label="Empresa" value={contact.company_name} className="lg:col-span-2" />
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
          </div>
        )}

        {currentTab === "comentarios" && (
          <div className="p-6 w-full max-w-none box-border">
            <div className="mb-6 w-full max-w-2xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">Añadir comentario</label>
              <div className="flex gap-2 w-full">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Escribe un comentario..."
                  className="flex-1 min-w-0 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2.5 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  Añadir
                </button>
              </div>
            </div>
            <div className="w-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Comentarios ({comments.length})</h2>
              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No hay comentarios. Añade el primero arriba.</p>
              ) : (
                <ul className="space-y-3 w-full max-w-2xl">
                  {comments.map((cmt, i) => (
                    <li
                      key={i}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-800 text-sm w-full"
                    >
                      <p className="whitespace-pre-wrap">{cmt.text}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        {cmt.author ?? "—"} {cmt.date ? ` · ${cmt.date}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
      </PageContentSection>
    </PageContentLayout>
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
