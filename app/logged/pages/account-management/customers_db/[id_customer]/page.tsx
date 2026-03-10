"use client";

import React, { FC, use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import customersData from "@/app/contents/customers.json";
import proposalsData from "@/app/contents/proposals.json";
import contractsData from "@/app/contents/contracts.json";
import projectsData from "@/app/contents/projects.json";
import ga4Data from "@/app/contents/ga4.json";

type ContactItem = { name: string; role: string; email: string; phone: string };
type CommentItem = { id?: string; text: string; date?: string; author?: string };

type Customer = {
  id_customer: string;
  name: string;
  cif: string;
  country: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  industry?: string;
  segment?: string;
  owner?: string;
  source?: string;
  status?: string;
  revenue_eur?: number;
  next_activity?: string;
  tags?: string[];
  contact?: ContactItem;
  contacts?: ContactItem[];
  comments: CommentItem[];
  proposals: string[];
  contracts: string[];
  projects: string[];
  related_accounts?: string[];
  portal_products?: Record<string, string[]>;
}

type Proposal = { id_proposal: string; title: string; status: string; amount_eur: number };
type Contract = { id_contract: string; id_proposal?: string; title: string; process_state: string; payment_state: string };
type Project = { id_project: string; id_contract: string; title: string; status: string; publication_date?: string };

type Portal = { id: string; name: string };

type TabKey = "principal" | "comentarios" | "contactos" | "contratos" | "propuestas" | "articulos";

const CustomerDetailPage: FC<{ params: Promise<{ id_customer: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_customer } = use(params);
  const customer = (customersData as Customer[]).find((c) => c.id_customer === id_customer);

  const [currentTab, setCurrentTab] = useState<TabKey>("principal");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

  useEffect(() => {
    if (customer?.comments) setComments([...customer.comments]);
    else setComments([]);
  }, [id_customer, customer?.comments]);

  const proposals = customer
    ? (proposalsData as Proposal[]).filter((p) => customer.proposals?.includes(p.id_proposal))
    : [];
  const contracts = customer
    ? (contractsData as Contract[]).filter((c) => customer.contracts?.includes(c.id_contract))
    : [];
  const allProjects = (projectsData as Project[]) || [];
  const projects = customer
    ? allProjects.filter((p) => customer.projects?.includes(p.id_project))
    : [];
  const getProjectsByContract = (id_contract: string) =>
    allProjects.filter((p) => p.id_contract === id_contract);

  const contactsList: ContactItem[] = customer
    ? (customer.contacts?.length ? customer.contacts : customer.contact ? [customer.contact] : [])
    : [];
  const portals: Portal[] = (ga4Data as { portals?: Portal[] }).portals ?? [];
  const relatedCustomers = customer
    ? (customersData as Customer[]).filter((c) => customer.related_accounts?.includes(c.id_customer))
    : [];
  const portalProducts = customer?.portal_products ?? {};

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    if (customer) {
      setPageMeta({
        pageTitle: customer.name,
        breadcrumbs: [
          { label: "Account management", href: "/logged/pages/account-management/customers_db" },
          { label: "Customers DB", href: "/logged/pages/account-management/customers_db" },
          { label: customer.name },
        ],
        buttons: [{ label: "Volver a Clientes", href: "/logged/pages/account-management/customers_db" }],
      });
    } else {
      setPageMeta({
        pageTitle: "Cliente no encontrado",
        breadcrumbs: [
          { label: "Account management", href: "/logged/pages/account-management/customers_db" },
          { label: "Customers DB", href: "/logged/pages/account-management/customers_db" },
        ],
        buttons: [{ label: "Volver a Clientes", href: "/logged/pages/account-management/customers_db" }],
      });
    }
  }, [setPageMeta, customer]);

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

  if (!customer) {
    return (
      <>
        <PageContentSection>
          <p className="text-gray-500">Cliente no encontrado.</p>
        </PageContentSection>
      </>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "principal", label: "Ficha" },
    { key: "propuestas", label: "Propuestas" },
    { key: "contratos", label: "Contratos" },
    { key: "articulos", label: "Artículos publicados" },
    { key: "comentarios", label: "Comentarios" },
    { key: "contactos", label: "Contactos" },
  ];

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Customers DB", href: "/logged/pages/account-management/customers_db" },
    { label: customer.name },
  ];

  return (
    <>
      <PageContentSection className="p-0 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="flex border-b border-gray-200 bg-gray-50/80">
        <div className="flex">
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
              {tab.key === "propuestas" && proposals.length > 0 && (
                <span className="ml-1.5 text-xs text-gray-500">({proposals.length})</span>
              )}
              {tab.key === "contratos" && contracts.length > 0 && (
                <span className="ml-1.5 text-xs text-gray-500">({contracts.length})</span>
              )}
              {tab.key === "articulos" && projects.length > 0 && (
                <span className="ml-1.5 text-xs text-gray-500">({projects.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {currentTab === "principal" && (
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Datos de la empresa: país y dirección */}
            <section className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de la empresa</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="País" value={customer.country} />
                <Field label="Dirección" value={customer.address} className="lg:col-span-2" />
                <Field label="CIF" value={customer.cif} />
                <Field label="Teléfono" value={customer.phone} />
                <Field label="Email" value={customer.email} link={customer.email ? `mailto:${customer.email}` : undefined} />
                <Field label="Web" value={customer.website} link={customer.website} />
              </div>
            </section>

            {/* Clasificación comercial */}
            <section className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Clasificación comercial</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="Sector" value={customer.industry} />
                <Field label="Segmento" value={customer.segment} />
                <Field label="Agente" value={customer.owner} />
                <Field label="Estado" value={customer.status} />
                {customer.next_activity && (
                  <Field label="Próxima actividad" value={customer.next_activity} className="lg:col-span-2" />
                )}
              </div>
              {customer.tags && customer.tags.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">Etiquetas</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Cuentas relacionadas */}
            <section className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cuentas relacionadas</h2>
              {relatedCustomers.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay cuentas relacionadas.</p>
              ) : (
                <ul className="space-y-2">
                  {relatedCustomers.map((c) => (
                    <li key={c.id_customer}>
                      <button
                        type="button"
                        onClick={() => router.push(`/logged/pages/account-management/customers_db/${c.id_customer}`)}
                        className="text-blue-600 hover:underline font-medium text-left"
                      >
                        {c.name}
                      </button>
                      <span className="text-gray-500 text-sm ml-2">{c.id_customer}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Portales con info publicada del cliente */}
            <section className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Portales</h2>
              <p className="text-sm text-gray-600 mb-4">Portales en los que hay información publicada de esta cuenta y productos publicados.</p>
              {portals.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay portales configurados.</p>
              ) : (
                <div className="space-y-4">
                  {portals.map((portal) => {
                    const projectIds = portalProducts[portal.id] ?? [];
                    const portalProjects = projectIds
                      .map((id) => allProjects.find((p) => p.id_project === id))
                      .filter(Boolean) as Project[];
                    if (portalProjects.length === 0) return null;
                    return (
                      <div key={portal.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-gray-100 font-medium text-gray-900">
                          {portal.name}
                        </div>
                        <ul className="divide-y divide-gray-200">
                          {portalProjects.map((proj) => (
                            <li key={proj.id_project}>
                              <button
                                type="button"
                                onClick={() => router.push(`/logged/pages/production/projects/${proj.id_project}`)}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50/80 transition-colors flex items-center justify-between"
                              >
                                <span className="font-medium text-gray-900">{proj.title}</span>
                                <span className="text-gray-500 text-xs">{proj.status.replace("_", " ")}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                  {portals.every((p) => (portalProducts[p.id]?.length ?? 0) === 0) && (
                    <p className="text-gray-500 text-sm">No hay contenido publicado en ningún portal.</p>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {currentTab === "propuestas" && (
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Propuestas ({proposals.length})</h2>
            {proposals.length === 0 ? (
              <p className="text-gray-500 text-sm py-6">No hay propuestas.</p>
            ) : (
              <div className="space-y-2">
                {proposals.map((p) => (
                  <div
                    key={p.id_proposal}
                    onClick={() => router.push(`/logged/pages/account-management/proposals/${p.id_proposal}`)}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50/80 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{p.title}</p>
                      <p className="text-sm text-gray-500">{p.id_proposal}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{p.amount_eur?.toLocaleString("es-ES")} €</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          p.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : p.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === "contratos" && (
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contratos ({contracts.length})</h2>
            {contracts.length === 0 ? (
              <p className="text-gray-500 text-sm py-6">No hay contratos.</p>
            ) : (
              <div className="space-y-2">
                {contracts.map((c) => {
                  const contractProjects = getProjectsByContract(c.id_contract);
                  const isExpanded = expandedContractId === c.id_contract;
                  return (
                    <div
                      key={c.id_contract}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div
                        onClick={() => router.push(`/logged/pages/account-management/contracts/${c.id_contract}`)}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedContractId(isExpanded ? null : c.id_contract);
                            }}
                            className="p-1 rounded hover:bg-gray-200 text-gray-600"
                            aria-expanded={isExpanded}
                          >
                            <svg
                              className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <div>
                            <p className="font-medium text-gray-900">{c.title}</p>
                            <p className="text-sm text-gray-500">{c.id_contract}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {contractProjects.length} proyecto{contractProjects.length !== 1 ? "s" : ""}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              c.process_state === "active" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {c.process_state}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              c.payment_state === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {c.payment_state}
                          </span>
                        </div>
                      </div>
                      {isExpanded && contractProjects.length > 0 && (
                        <div className="border-t border-gray-200 bg-gray-50/70">
                          <div className="p-3 pl-12 space-y-2">
                            {contractProjects.map((proj) => (
                              <div
                                key={proj.id_project}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/logged/pages/production/projects/${proj.id_project}`);
                                }}
                                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50/80 transition-colors"
                              >
                                <p className="font-medium text-gray-900 text-sm">{proj.title}</p>
                                <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                                  {proj.status.replace("_", " ")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentTab === "articulos" && (
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Artículos publicados ({projects.length})</h2>
            <p className="text-sm text-gray-600 mb-4">Contenidos y artículos asociados a esta cuenta.</p>
            {projects.length === 0 ? (
              <p className="text-gray-500 text-sm py-6">No hay artículos publicados.</p>
            ) : (
              <div className="space-y-2">
                {projects.map((proj) => (
                  <div
                    key={proj.id_project}
                    onClick={() => router.push(`/logged/pages/production/projects/${proj.id_project}`)}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50/80 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{proj.title}</p>
                      <p className="text-sm text-gray-500">
                        {proj.id_project}
                        {proj.publication_date ? ` · Publicado ${proj.publication_date}` : ""}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                      {proj.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === "comentarios" && (
          <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Añadir comentario</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Escribe un comentario..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2.5 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Añadir
                </button>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Comentarios ({comments.length})</h2>
              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No hay comentarios. Añade el primero arriba.</p>
              ) : (
                <ul className="space-y-3">
                  {comments.map((cmt, i) => (
                    <li
                      key={i}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-800 text-sm"
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

        {currentTab === "contactos" && (
          <div className="p-6 max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contactos ({contactsList.length})</h2>
            {contactsList.length === 0 ? (
              <p className="text-gray-500 text-sm py-6">No hay contactos registrados.</p>
            ) : (
              <div className="space-y-4">
                {contactsList.map((contact, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-600">{contact.role}</p>
                    </div>
                    <div className="flex flex-col gap-1 text-sm">
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
    <div className={className}>
      <p className="text-xs text-gray-500 uppercase mb-0.5">{label}</p>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
          {value}
        </a>
      ) : (
        <p className="font-medium text-gray-900">{value}</p>
      )}
    </div>
  );
}

export default CustomerDetailPage;
