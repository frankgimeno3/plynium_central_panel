"use client";

import React, { FC, use, useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import ga4Data from "@/app/contents/ga4.json";
import { CustomerService } from "@/app/service/CustomerService";
import { ProductService } from "@/app/service/ProductService";
import { CompanyCategoryService } from "@/app/service/CompanyCategoryService";
import CompanyPickerModal from "@/app/logged/logged_components/modals/CompanyPickerModal";
import { ProposalService } from "@/app/service/ProposalService";
import { ContractService } from "@/app/service/ContractService";
import { ProjectService } from "@/app/service/ProjectService";
import { hrefCreateCompanyFromCustomer } from "@/app/logged/pages/network/directory/companies/create/createCompanyPaths";

type ContactItem = { name: string; role: string; email: string; phone: string };
type CommentItem = { id?: string; text: string; date?: string; author?: string };

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  manufacturer_distributor: "Manufacturer and/or distributor company account",
  distributor_only: "Non-manufacturer distributor company account",
  agency: "Agency account",
  institution: "Institution account",
  parent_company: "Parent company account",
  event: "Event account",
};

const ACCOUNT_TYPES_WITH_LINKED = new Set([
  "agency",
  "institution",
  "parent_company",
  "event",
]);

type Customer = {
  id_customer: string;
  name: string;
  cif?: string;
  country: string;
  address?: string;
  postal_code?: string;
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
  /** Account type from create flow */
  account_type?: string;
  /** Event IDs when account_type === "event" */
  event_ids?: string[];
  /** For distributor_only: IDs of companies this distributor represents */
  represented_companies?: string[];
  /** Company category IDs (company categories this customer belongs to) */
  company_categories_array?: string[];
}

type Proposal = { id_proposal: string; title: string; status: string; amount_eur: number };
type Contract = { id_contract: string; id_proposal?: string; title: string; process_state: string; payment_state: string };
type Project = { id_project: string; id_contract: string; title: string; status: string; publication_date?: string };
type DirectoryProductRow = {
  productId: string;
  productName: string;
  price: number;
  mainImageSrc?: string;
  productCategoriesArray?: string[];
  companyId: string;
  companyName: string;
};

type Portal = { id: string; name: string };

const CUSTOMER_STATUS_PRESETS = [
  "active",
  "inactive",
  "activo",
  "inactivo",
  "lead",
  "prospect",
  "customer",
  "churned",
  "pending",
  "pipeline",
] as const;

type TabKey = "principal" | "comentarios" | "contactos" | "contratos" | "propuestas" | "articulos";
type ProposalStatusTab = "pending" | "accepted" | "rejected";
type ContractListTab = "active" | "historical";
const PUBLISHED_TABS = [
  { key: "articles_website" as const, label: "Articles in website" },
  { key: "banners_website" as const, label: "Banners in website" },
  { key: "articles_magazine" as const, label: "Articles in magazine" },
  { key: "advertisement_magazine" as const, label: "Advertisement in magazine" },
  { key: "banners_newsletter" as const, label: "Banners in newsletter" },
] as const;
type PublishedTabKey = (typeof PUBLISHED_TABS)[number]["key"];

const CustomerDetailPage: FC<{ params: Promise<{ id_customer: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_customer } = use(params);
  const [customer, setCustomer] = useState<Customer | undefined>(undefined);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;
    CustomerService.getCustomerById(id_customer)
      .then((data) => {
        if (!cancelled) setCustomer({ ...data, comments: data.comments ?? [] } as Customer);
      })
      .catch(() => {
        if (!cancelled) setCustomer(undefined);
      })
      .finally(() => {
        if (!cancelled) setCustomerLoading(false);
      });
    return () => { cancelled = true; };
  }, [id_customer]);

  useEffect(() => {
    CustomerService.getAllCustomers()
      .then((list: Customer[]) => setAllCustomers(Array.isArray(list) ? list : []))
      .catch(() => setAllCustomers([]));
  }, []);

  useEffect(() => {
    Promise.all([
      ProposalService.getAllProposals(),
      ContractService.getAllContracts(),
      ProjectService.getAllProjects(),
    ])
      .then(([p, c, pr]) => {
        setAllProposals(Array.isArray(p) ? p : []);
        setAllContracts(Array.isArray(c) ? c : []);
        setAllProjects(Array.isArray(pr) ? pr : []);
      })
      .catch(() => {
        setAllProposals([]);
        setAllContracts([]);
        setAllProjects([]);
      });
  }, []);

  const [currentTab, setCurrentTab] = useState<TabKey>("principal");
  const [proposalStatusTab, setProposalStatusTab] = useState<ProposalStatusTab>("pending");
  const [contractListTab, setContractListTab] = useState<ContractListTab>("active");
  const [publishedTab, setPublishedTab] = useState<PublishedTabKey>("articles_website");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);
  const [companyCategoriesList, setCompanyCategoriesList] = useState<{ id_category: string; name: string }[]>([]);
  const [categoriesUpdating, setCategoriesUpdating] = useState(false);
  const [categoryToAdd, setCategoryToAdd] = useState("");

  const [directoryCompanyRels, setDirectoryCompanyRels] = useState<
    { customer_company_relation_id: string; customer_id: string; company_id: string; company_name: string }[]
  >([]);
  const [directoryRelsLoading, setDirectoryRelsLoading] = useState(true);
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false);
  const [directoryProducts, setDirectoryProducts] = useState<DirectoryProductRow[]>([]);
  const [directoryProductsLoading, setDirectoryProductsLoading] = useState(false);
  const [deleteCustomerModalOpen, setDeleteCustomerModalOpen] = useState(false);
  const [deleteCustomerConfirmInput, setDeleteCustomerConfirmInput] = useState("");
  const [deleteCustomerLoading, setDeleteCustomerLoading] = useState(false);

  const [overviewDraft, setOverviewDraft] = useState({
    name: "",
    country: "",
    cif: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    industry: "",
    owner: "",
    status: "active",
  });
  const [overviewSaving, setOverviewSaving] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [overviewSavedAt, setOverviewSavedAt] = useState<string | null>(null);
  const customerRef = useRef<Customer | undefined>(undefined);
  customerRef.current = customer;

  useLayoutEffect(() => {
    if (customerLoading) return;
    const c = customerRef.current;
    if (!c || c.id_customer !== id_customer) return;
    setOverviewDraft({
      name: c.name ?? "",
      country: c.country ?? "",
      cif: c.cif ?? "",
      address: c.address ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      website: c.website ?? "",
      industry: c.industry ?? "",
      owner: c.owner ?? "",
      status: (c.status && String(c.status).trim()) || "active",
    });
    setOverviewError(null);
    setOverviewSavedAt(null);
  }, [id_customer, customerLoading]);

  useEffect(() => {
    CompanyCategoryService.getAllCategories()
      .then((list) => {
        const raw = Array.isArray(list) ? list : [];
        setCompanyCategoriesList(
          raw
            .filter((c) => c != null && typeof c === "object")
            .map((c) => {
              const row = c as { category_id?: unknown; category_name?: unknown };
              return {
                id_category: String(row.category_id ?? ""),
                name: String(row.category_name ?? ""),
              };
            })
            .filter((c) => c.id_category.trim().length > 0 && c.name.trim().length > 0)
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
        );
      })
      .catch(() => setCompanyCategoriesList([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDirectoryRelsLoading(true);
      try {
        const list = await CustomerService.getCustomerCompanyRelations({ customerId: id_customer });
        if (!cancelled) setDirectoryCompanyRels(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setDirectoryCompanyRels([]);
      } finally {
        if (!cancelled) setDirectoryRelsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id_customer]);

  useEffect(() => {
    if (directoryCompanyRels.length === 0) {
      setDirectoryProducts([]);
      setDirectoryProductsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setDirectoryProductsLoading(true);
      const rows: DirectoryProductRow[] = [];
      try {
        for (const rel of directoryCompanyRels) {
          const prods = await ProductService.getProductsByCompany(rel.company_id);
          const name = rel.company_name || rel.company_id;
          for (const p of Array.isArray(prods) ? prods : []) {
            const row = p as {
              productId?: string;
              productName?: string;
              price?: number;
              mainImageSrc?: string;
              productCategoriesArray?: string[];
            };
            if (!row?.productId) continue;
            rows.push({
              productId: String(row.productId),
              productName: String(row.productName ?? row.productId),
              price: Number(row.price) || 0,
              mainImageSrc: row.mainImageSrc,
              productCategoriesArray: Array.isArray(row.productCategoriesArray) ? row.productCategoriesArray : [],
              companyId: rel.company_id,
              companyName: name,
            });
          }
        }
        if (!cancelled) setDirectoryProducts(rows);
      } catch {
        if (!cancelled) setDirectoryProducts([]);
      } finally {
        if (!cancelled) setDirectoryProductsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [directoryCompanyRels]);

  const directoryProductsByCompany = useMemo(() => {
    const m = new Map<string, { companyId: string; companyName: string; items: DirectoryProductRow[] }>();
    for (const p of directoryProducts) {
      if (!m.has(p.companyId)) {
        m.set(p.companyId, { companyId: p.companyId, companyName: p.companyName, items: [] });
      }
      m.get(p.companyId)!.items.push(p);
    }
    return [...m.values()].sort((a, b) => a.companyName.localeCompare(b.companyName, undefined, { sensitivity: "base" }));
  }, [directoryProducts]);

  useEffect(() => {
    if (customer?.comments) setComments([...customer.comments]);
    else setComments([]);
  }, [id_customer, customer?.comments]);

  const proposals = customer
    ? allProposals.filter((p) => customer.proposals?.includes(p.id_proposal))
    : [];
  const proposalsByStatus = {
    pending: proposals.filter((p) => p.status === "pending"),
    accepted: proposals.filter((p) => p.status === "accepted"),
    rejected: proposals.filter((p) => p.status === "rejected"),
  };
  const contracts = customer
    ? allContracts.filter((c) => customer.contracts?.includes(c.id_contract))
    : [];
  const contractsByListTab = {
    active: contracts.filter((c) => c.process_state === "active"),
    historical: contracts.filter((c) => c.process_state !== "active"),
  };
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
    ? allCustomers.filter((c) => customer.related_accounts?.includes(c.id_customer))
    : [];
  const representedCustomers = customer?.represented_companies?.length
    ? (customer.represented_companies ?? []).map((id) =>
        allCustomers.find((c) => c.id_customer === id)
      ).filter(Boolean) as Customer[]
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
        buttons: [
          { label: "Back to Customers", href: "/logged/pages/account-management/customers_db" },
          {
            label: "Create contact",
            href: `/logged/pages/account-management/contacts_db/create?customer=${encodeURIComponent(id_customer)}`,
          },
          {
            label: "Create proposal",
            href: `/logged/pages/account-management/proposals/create?customer=${encodeURIComponent(id_customer)}`,
          },
          {
            label: deleteCustomerLoading ? "Deleting…" : "Delete customer",
            onClick: () => {
              setDeleteCustomerConfirmInput("");
              setDeleteCustomerModalOpen(true);
            },
            variant: "danger",
          },
          {
            label: "Create company",
            href: hrefCreateCompanyFromCustomer(customer?.id_customer ?? id_customer),
          },
        ],
      });
    } else {
      setPageMeta({
        pageTitle: "Customer not found",
        breadcrumbs: [
          { label: "Account management", href: "/logged/pages/account-management/customers_db" },
          { label: "Customers DB", href: "/logged/pages/account-management/customers_db" },
        ],
        buttons: [{ label: "Back to Customers", href: "/logged/pages/account-management/customers_db" }],
      });
    }
  }, [setPageMeta, customer, id_customer, deleteCustomerLoading]);

  const saveOverview = useCallback(async () => {
    if (!customer) return;
    if (!overviewDraft.name.trim()) {
      setOverviewError("Account name is required.");
      return;
    }
    setOverviewSaving(true);
    setOverviewError(null);
    try {
      const updated = await CustomerService.updateCustomer(id_customer, {
        name: overviewDraft.name.trim(),
        country: overviewDraft.country.trim(),
        cif: overviewDraft.cif.trim(),
        address: overviewDraft.address.trim(),
        phone: overviewDraft.phone.trim(),
        email: overviewDraft.email.trim(),
        website: overviewDraft.website.trim(),
        industry: overviewDraft.industry.trim(),
        owner: overviewDraft.owner.trim(),
        status: overviewDraft.status.trim() || "active",
      });
      setCustomer({ ...customer, ...updated } as Customer);
      setOverviewDraft({
        name: updated.name ?? "",
        country: updated.country ?? "",
        cif: updated.cif ?? "",
        address: updated.address ?? "",
        phone: updated.phone ?? "",
        email: updated.email ?? "",
        website: updated.website ?? "",
        industry: updated.industry ?? "",
        owner: updated.owner ?? "",
        status: (updated.status && String(updated.status).trim()) || "active",
      });
      setOverviewSavedAt(new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e !== null && "message" in e
            ? String((e as { message?: string }).message)
            : "Could not save company details.";
      setOverviewError(msg);
    } finally {
      setOverviewSaving(false);
    }
  }, [customer, id_customer, overviewDraft]);

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

  if (customerLoading) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
            <p className="text-gray-500">Loading…</p>
          </div>
        </div>
      </PageContentSection>
    );
  }

  if (!customer) {
    return (
      <>
        <PageContentSection>
          <div className="flex flex-col w-full">
            <div className="bg-white rounded-b-lg overflow-hidden p-6">
              <p className="text-gray-500">Customer not found.</p>
            </div>
          </div>
        </PageContentSection>
      </>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "principal", label: "Overview" },
    { key: "propuestas", label: "Proposals" },
    { key: "contratos", label: "Contracts" },
    { key: "articulos", label: "Published" },
    { key: "comentarios", label: "Comments" },
    { key: "contactos", label: "Contacts" },
  ];

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Customers DB", href: "/logged/pages/account-management/customers_db" },
    { label: customer.name },
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

      {/* Tab content */}
      <div className="bg-white rounded-b-lg overflow-hidden flex-1 min-h-0 overflow-auto">
        {currentTab === "principal" && (
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Account type */}
            {customer.account_type && (
              <section className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account type</h2>
                <p className="font-medium text-gray-900">
                  {ACCOUNT_TYPE_LABELS[customer.account_type] ?? customer.account_type}
                </p>
              </section>
            )}

            {/* Company details – editable (persisted on customers_db) */}
            <section className="bg-gray-50 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Company details</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {overviewSavedAt && (
                    <span className="text-xs text-green-700 font-medium">Saved {overviewSavedAt}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => void saveOverview()}
                    disabled={overviewSaving}
                    className="px-4 py-2 bg-blue-950 text-white text-sm font-medium rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {overviewSaving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
              {overviewError && (
                <p className="mb-3 text-sm text-red-600" role="alert">
                  {overviewError}
                </p>
              )}
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveOverview();
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Client ID</label>
                    <input
                      type="text"
                      readOnly
                      value={customer.id_customer}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-700 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">
                      Account name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={overviewDraft.name}
                      onChange={(e) => setOverviewDraft((d) => ({ ...d, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Country</label>
                    <input
                      type="text"
                      value={overviewDraft.country}
                      onChange={(e) => setOverviewDraft((d) => ({ ...d, country: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">CIF</label>
                    <input
                      type="text"
                      value={overviewDraft.cif}
                      onChange={(e) => setOverviewDraft((d) => ({ ...d, cif: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Status</label>
                    <input
                      type="text"
                      list="customer-status-options"
                      value={overviewDraft.status}
                      onChange={(e) => setOverviewDraft((d) => ({ ...d, status: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. active"
                    />
                    <datalist id="customer-status-options">
                      {CUSTOMER_STATUS_PRESETS.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>
                  <div className="lg:col-span-3">
                    <label className="block text-xs text-gray-600 mb-1">Fiscal address</label>
                    <textarea
                      value={overviewDraft.address}
                      onChange={(e) => setOverviewDraft((d) => ({ ...d, address: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Agent</label>
                    <input
                      type="text"
                      value={overviewDraft.owner}
                      onChange={(e) => setOverviewDraft((d) => ({ ...d, owner: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Website</label>
                    <input
                      type="url"
                      value={overviewDraft.website}
                      onChange={(e) => setOverviewDraft((d) => ({ ...d, website: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Phone (generic)</label>
                    <input
                      type="text"
                      value={overviewDraft.phone}
                      onChange={(e) => setOverviewDraft((d) => ({ ...d, phone: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Email (generic)</label>
                    <input
                      type="email"
                      value={overviewDraft.email}
                      onChange={(e) => setOverviewDraft((d) => ({ ...d, email: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Sector</label>
                    <input
                      type="text"
                      value={overviewDraft.industry}
                      onChange={(e) => setOverviewDraft((d) => ({ ...d, industry: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </form>
              {(customer.segment || customer.source || customer.postal_code || customer.next_activity) && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Additional (read-only)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field label="Segment" value={customer.segment} />
                    <Field label="Origin" value={customer.source} />
                    <Field label="Postal code" value={customer.postal_code} />
                    <Field label="Next activity" value={customer.next_activity} className="lg:col-span-2" />
                  </div>
                </div>
              )}
              {customer.tags && customer.tags.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 uppercase mb-2">Tags</p>
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

            {/* Company categories */}
            <section className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Company categories</h2>
              <p className="text-sm text-gray-600 mb-3">Company categories linked to this customer. Add or remove with the controls below.</p>
              <select
                value={categoryToAdd}
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id || !customer) return;
                  const current = customer.company_categories_array || [];
                  if (current.includes(id)) {
                    setCategoryToAdd("");
                    return;
                  }
                  const next = [...current, id];
                  setCategoriesUpdating(true);
                  CustomerService.updateCustomer(id_customer, { company_categories_array: next })
                    .then((updated) => {
                      setCustomer({ ...customer, ...updated } as Customer);
                    })
                    .finally(() => setCategoriesUpdating(false));
                  setCategoryToAdd("");
                }}
                disabled={categoriesUpdating || companyCategoriesList.length === 0}
                className="max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
              >
                <option value="">Add a category...</option>
                {(companyCategoriesList || [])
                  .filter((c) => !(customer.company_categories_array || []).includes(c.id_category))
                  .map((c) => (
                    <option key={c.id_category} value={c.id_category}>
                      {c.name}
                    </option>
                  ))}
              </select>
              {companyCategoriesList.length === 0 && (
                <p className="text-gray-500 text-sm mt-2">No company categories available.</p>
              )}
              {(customer.company_categories_array || []).length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {(customer.company_categories_array || []).map((id) => {
                    const cat = companyCategoriesList.find((c) => c.id_category === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium"
                      >
                        {cat?.name ?? id}
                        <button
                          type="button"
                          disabled={categoriesUpdating}
                          onClick={() => {
                            const next = (customer.company_categories_array || []).filter((x) => x !== id);
                            setCategoriesUpdating(true);
                            CustomerService.updateCustomer(id_customer, { company_categories_array: next })
                              .then((updated) => {
                                setCustomer({ ...customer, ...updated } as Customer);
                              })
                              .finally(() => setCategoriesUpdating(false));
                          }}
                          className="text-blue-600 hover:text-blue-800 p-0.5 rounded disabled:opacity-50"
                          aria-label="Remove category"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mt-2">No company categories linked.</p>
              )}
            </section>

            {/* Directory companies (CRM ↔ network directory) */}
            <section className="bg-gray-50 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Directory companies</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCompanyPickerOpen(true)}
                    className="px-4 py-2 bg-blue-950 text-white text-sm font-medium rounded-lg hover:bg-blue-900 transition-colors"
                  >
                    Link to a company
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(hrefCreateCompanyFromCustomer(customer?.id_customer ?? id_customer))}
                    className="px-4 py-2 border border-gray-300 bg-white text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Create company
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Link this customer account to one or more companies in the network directory. Product catalog is stored on
                the company, not on the customer record.
              </p>
              {directoryRelsLoading ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : directoryCompanyRels.length === 0 ? (
                <p className="text-sm text-gray-500">No directory companies linked.</p>
              ) : (
                <ul className="space-y-2">
                  {directoryCompanyRels.map((rel) => (
                    <li
                      key={rel.customer_company_relation_id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/logged/pages/network/directory/companies/${encodeURIComponent(rel.company_id)}`
                          )
                        }
                        className="text-left text-blue-700 hover:underline font-medium"
                      >
                        {rel.company_name}
                      </button>
                      <span className="text-gray-500 text-xs font-mono">{rel.company_id}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Products from directory companies (via company_id) */}
            <section className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Products (directory)</h2>
              {directoryRelsLoading ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : directoryCompanyRels.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Only a company in the network directory can own products — not a customer account by itself. Link this
                    account to a company to see the catalog stored under that company, or create a new company and link it.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCompanyPickerOpen(true)}
                      className="px-4 py-2 bg-blue-950 text-white text-sm font-medium rounded-lg hover:bg-blue-900 transition-colors"
                    >
                      Link to a company
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(hrefCreateCompanyFromCustomer(customer?.id_customer ?? id_customer))}
                      className="px-4 py-2 border border-gray-300 bg-white text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Create company
                    </button>
                  </div>
                </div>
              ) : directoryProductsLoading ? (
                <p className="text-sm text-gray-500">Loading products…</p>
              ) : directoryProducts.length === 0 ? (
                <p className="text-sm text-gray-500">No products found for the linked company or companies yet.</p>
              ) : (
                <div className="space-y-3 text-gray-900">
                  {directoryProductsByCompany.map((group) => (
                    <details
                      key={group.companyId}
                      open
                      className="group border border-gray-200 rounded-lg bg-white overflow-hidden text-gray-900"
                    >
                      <summary
                        className="list-none flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gray-100 cursor-pointer !text-gray-900 select-none [&::-webkit-details-marker]:hidden"
                      >
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className="!text-gray-500 text-lg font-light group-open:rotate-90 transition-transform inline-block" aria-hidden>
                            ›
                          </span>
                          <span className="font-semibold !text-gray-900">{group.companyName}</span>
                          <span className="!text-gray-500 text-xs font-mono shrink-0">{group.companyId}</span>
                          <span className="text-xs !text-gray-500">({group.items.length} product{group.items.length === 1 ? "" : "s"})</span>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-blue-700 hover:underline font-medium shrink-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(
                              `/logged/pages/network/directory/companies/${encodeURIComponent(group.companyId)}`
                            );
                          }}
                        >
                          Open company
                        </button>
                      </summary>
                      <div className="overflow-x-auto border-t border-gray-200">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-xs uppercase border-b border-gray-200">
                            <tr>
                              <th className="px-3 py-2 text-left w-20 !text-gray-600">Image</th>
                              <th className="px-3 py-2 text-left !text-gray-600">Product</th>
                              <th className="px-3 py-2 text-right !text-gray-600">Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {group.items.map((p) => (
                              <tr
                                key={p.productId}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() =>
                                  router.push(
                                    `/logged/pages/network/directory/products/${encodeURIComponent(p.productId)}`
                                  )
                                }
                              >
                                <td className="px-3 py-2 align-middle !text-gray-900">
                                  <div className="w-10 h-10 rounded border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center">
                                    {p.mainImageSrc ? (
                                      <img
                                        src={p.mainImageSrc}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = "none";
                                        }}
                                      />
                                    ) : (
                                      <span className="text-gray-400 text-xs">—</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 !text-gray-900">
                                  <div className="font-medium !text-gray-900">{p.productName}</div>
                                  <div className="text-xs !text-gray-600 font-mono">{p.productId}</div>
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums !text-gray-900 font-medium">
                                  {Number(p.price).toFixed(2)} €
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </section>

            {/* Events – only when account_type === "event" */}
            {customer.account_type === "event" && (
              <section className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Events</h2>
                {!customer.event_ids || customer.event_ids.length === 0 ? (
                  <p className="text-gray-500 text-sm">No events linked.</p>
                ) : (
                  <ul className="space-y-2">
                    {customer.event_ids.map((eventId) => (
                      <li key={eventId}>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/logged/pages/network/contents/events/${encodeURIComponent(eventId)}`
                            )
                          }
                          className="text-blue-600 hover:underline font-medium text-left"
                        >
                          {eventId}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* Companies represented – only when account_type === "distributor_only" */}
            {customer.account_type === "distributor_only" && (
              <section className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Companies represented</h2>
                {representedCustomers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No companies linked.</p>
                ) : (
                  <ul className="space-y-2">
                    {representedCustomers.map((c) => (
                      <li key={c.id_customer}>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/logged/pages/account-management/customers_db/${encodeURIComponent(c.id_customer)}`
                            )
                          }
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
            )}

            {/* Linked companies – when account type is agency, institution, parent_company or event */}
            {customer.account_type && ACCOUNT_TYPES_WITH_LINKED.has(customer.account_type) && (
              <section className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Linked companies</h2>
                {relatedCustomers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No linked companies.</p>
                ) : (
                  <ul className="space-y-2">
                    {relatedCustomers.map((c) => (
                      <li key={c.id_customer}>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/logged/pages/account-management/customers_db/${encodeURIComponent(c.id_customer)}`
                            )
                          }
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
            )}

            {/* Related accounts – when not one of the "linked" types but has related_accounts */}
            {(!customer.account_type || !ACCOUNT_TYPES_WITH_LINKED.has(customer.account_type)) &&
              relatedCustomers.length > 0 && (
                <section className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Related accounts</h2>
                  <ul className="space-y-2">
                    {relatedCustomers.map((c) => (
                      <li key={c.id_customer}>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/logged/pages/account-management/customers_db/${encodeURIComponent(c.id_customer)}`
                            )
                          }
                          className="text-blue-600 hover:underline font-medium text-left"
                        >
                          {c.name}
                        </button>
                        <span className="text-gray-500 text-sm ml-2">{c.id_customer}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

            {/* Portals with published content for this customer */}
            <section className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Portals</h2>
              <p className="text-sm text-gray-600 mb-4">Portals where this account has published information and published products.</p>
              {portals.length === 0 ? (
                <p className="text-gray-500 text-sm">No portals configured.</p>
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
                                onClick={() => router.push(`/logged/pages/account-management/projects/${proj.id_project}`)}
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
                    <p className="text-gray-500 text-sm">No content published on any portal.</p>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {currentTab === "propuestas" && (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Proposals ({proposals.length})</h2>
              <button
                type="button"
                onClick={() => router.push("/logged/pages/account-management/proposals/create")}
                className="px-4 py-2 bg-blue-950 text-white text-sm font-medium rounded-lg hover:bg-blue-900 transition-colors shrink-0"
              >
                Create new proposal
              </button>
            </div>
            {proposals.length === 0 ? (
              <p className="text-gray-500 text-sm py-6">No proposals.</p>
            ) : (
              <>
                <div className="flex border-b border-gray-200 mb-4">
                  {(["pending", "accepted", "rejected"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setProposalStatusTab(status)}
                      className={`
                        relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors capitalize
                        ${
                          proposalStatusTab === status
                            ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }
                      `}
                    >
                      {status}
                      <span className="ml-1.5 text-gray-500">({proposalsByStatus[status].length})</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {proposalsByStatus[proposalStatusTab].length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">No {proposalStatusTab} proposals.</p>
                  ) : (
                    proposalsByStatus[proposalStatusTab].map((p) => (
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
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {currentTab === "contratos" && (
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contracts ({contracts.length})</h2>
            {contracts.length === 0 ? (
              <p className="text-gray-500 text-sm py-6">No contracts.</p>
            ) : (
              <>
                <div className="flex border-b border-gray-200 mb-4">
                  {(["active", "historical"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setContractListTab(tab)}
                      className={`
                        relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors capitalize
                        ${
                          contractListTab === tab
                            ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }
                      `}
                    >
                      {tab === "active" ? "Active" : "Historical"}
                      <span className="ml-1.5 text-gray-500">({contractsByListTab[tab].length})</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {contractsByListTab[contractListTab].length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">
                      No {contractListTab === "active" ? "active" : "historical"} contracts.
                    </p>
                  ) : (
                    contractsByListTab[contractListTab].map((c) => {
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
                                {contractProjects.length} project{contractProjects.length !== 1 ? "s" : ""}
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
                              <div className="space-y-2 p-3 pl-8">
                                {contractProjects.map((proj) => (
                                  <div
                                    key={proj.id_project}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/logged/pages/account-management/projects/${proj.id_project}`);
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
                    })
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {currentTab === "articulos" && (
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Published</h2>
            <p className="text-sm text-gray-600 mb-4">Content and items associated with this account.</p>

            <div className="flex border-b border-gray-200 mb-4 flex-wrap gap-x-1">
              {PUBLISHED_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPublishedTab(key)}
                  className={`
                    relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap
                    ${
                      publishedTab === key
                        ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  {label}
                  <span className="ml-1.5 text-gray-500">
                    ({key === "articles_website" ? projects.length : 0})
                  </span>
                </button>
              ))}
            </div>

            <div className="min-h-[120px]">
              {publishedTab === "articles_website" && (
                <>
                  {projects.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">No items.</p>
                  ) : (
                    <div className="space-y-2">
                      {projects.map((proj) => (
                        <div
                          key={proj.id_project}
                          onClick={() => router.push(`/logged/pages/account-management/projects/${proj.id_project}`)}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50/80 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{proj.title}</p>
                            <p className="text-xs text-gray-500">
                              {proj.id_project}
                              {proj.publication_date ? ` · Published ${proj.publication_date}` : ""}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                            {proj.status.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {publishedTab !== "articles_website" && (
                <p className="text-gray-500 text-sm py-4">No items.</p>
              )}
            </div>
          </div>
        )}

        {currentTab === "comentarios" && (
          <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add comment</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2.5 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Comments ({comments.length})</h2>
              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No comments. Add the first one above.</p>
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
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Contacts ({contactsList.length})</h2>
              <button
                type="button"
                onClick={() => router.push("/logged/pages/account-management/contacts_db/create")}
                className="px-4 py-2 bg-blue-950 text-white text-sm font-medium rounded-lg hover:bg-blue-900 transition-colors shrink-0"
              >
                Create new contact
              </button>
            </div>
            {contactsList.length === 0 ? (
              <p className="text-gray-500 text-sm py-6">No contacts registered.</p>
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
        </div>
      </PageContentSection>

      {deleteCustomerModalOpen && customer && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-customer-title"
          onClick={() => !deleteCustomerLoading && setDeleteCustomerModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 text-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 id="delete-customer-title" className="text-lg font-semibold text-gray-900">
                Delete customer
              </h3>
              <button
                type="button"
                onClick={() => !deleteCustomerLoading && setDeleteCustomerModalOpen(false)}
                disabled={deleteCustomerLoading}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="text-gray-700 text-sm mb-4">
              This permanently deletes the customer account{" "}
              <span className="font-semibold">{customer.name}</span> (<span className="font-mono text-xs">{id_customer}</span>)
              from the database, including directory company links and customer comments.
            </p>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type <span className="font-mono">confirm</span> to enable delete
            </label>
            <input
              type="text"
              value={deleteCustomerConfirmInput}
              onChange={(e) => setDeleteCustomerConfirmInput(e.target.value)}
              disabled={deleteCustomerLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 !text-gray-900"
              placeholder="confirm"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeleteCustomerModalOpen(false)}
                disabled={deleteCustomerLoading}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteCustomerLoading || deleteCustomerConfirmInput.trim() !== "confirm"}
                onClick={async () => {
                  if (deleteCustomerConfirmInput.trim() !== "confirm") return;
                  setDeleteCustomerLoading(true);
                  try {
                    await CustomerService.deleteCustomer(id_customer);
                    setDeleteCustomerModalOpen(false);
                    router.push("/logged/pages/account-management/customers_db");
                  } catch (e) {
                    const msg =
                      e instanceof Error
                        ? e.message
                        : String((e as { message?: string })?.message ?? "Failed to delete customer");
                    alert(msg);
                  } finally {
                    setDeleteCustomerLoading(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleteCustomerLoading ? "Deleting…" : "Delete customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <CompanyPickerModal
        open={companyPickerOpen}
        onClose={() => setCompanyPickerOpen(false)}
        confirmLabel="Link company"
        excludeCompanyIds={directoryCompanyRels.map((r) => r.company_id)}
        onSelectCompany={({ companyId }) => {
          void (async () => {
            try {
              await CustomerService.createCustomerCompanyRelation({
                customer_id: id_customer,
                company_id: companyId,
              });
              const list = await CustomerService.getCustomerCompanyRelations({ customerId: id_customer });
              setDirectoryCompanyRels(Array.isArray(list) ? list : []);
            } catch (e) {
              const msg =
                e instanceof Error
                  ? e.message
                  : String((e as { message?: string })?.message ?? "Could not link company");
              alert(msg);
            }
          })();
        }}
      />
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
