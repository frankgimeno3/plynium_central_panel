"use client";

import React, { FC, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { CustomerService } from "@/app/service/CustomerService";
import { ProposalService } from "@/app/service/ProposalService";
import { AgentService } from "@/app/service/AgentService";
import { buildAgentIdToNameMap, resolveAgentDisplayName } from "@/app/logged/pages/account-management/resolveAgentDisplayName";
import { getProposalRowHref, normalizeProposalStatus } from "@/lib/account-management/proposalRoutes";
import { formatProposalFaseLabel } from "./create/proposalWizardUtils";

type Proposal = {
  id_proposal: string;
  id_customer: string;
  /** `agent_id` in proposals_db */
  agent?: string;
  status: string;
  proposal_fase?: string;
  title: string;
  amount_eur: number;
  date_created: string;
  proposal_date?: string;
};

type Customer = { id_customer: string; name: string };
type AgentRow = { id_agent: string; name: string };

const CANONICAL_STATUSES = ["draft", "pending", "accepted", "rejected"] as const;

type TabFilters = {
  proposal_id: string;
  customer_account_name: string;
  customer_id: string;
  agent_id: string;
  proposal_title: string;
  proposal_fase: string;
  proposal_amount_eur: string;
  proposal_creation_date: string;
};

const emptyFilters = (): TabFilters => ({
  proposal_id: "",
  customer_account_name: "",
  customer_id: "",
  agent_id: "",
  proposal_title: "",
  proposal_fase: "",
  proposal_amount_eur: "",
  proposal_creation_date: "",
});

const DEFAULT_TAB_FILTERS: TabFilters = emptyFilters();

const ITEMS_PER_PAGE = 12;

function normalizeStatus(s: string) {
  return normalizeProposalStatus(s);
}

const ProposalsPage: FC = () => {
  const router = useRouter();
  const [all, setAll] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [activeStatus, setActiveStatus] = useState<string>("draft");
  const [tabFilters, setTabFilters] = useState<Record<string, TabFilters>>({});
  const [pageByStatus, setPageByStatus] = useState<Record<string, number>>({});

  useEffect(() => {
    CustomerService.getAllCustomers()
      .then((list: Customer[]) => setCustomers(Array.isArray(list) ? list : []))
      .catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    AgentService.getAllAgents()
      .then((list: AgentRow[]) => setAgents(Array.isArray(list) ? list : []))
      .catch(() => setAgents([]));
  }, []);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    try {
      const list = await ProposalService.getAllProposals();
      setAll(Array.isArray(list) ? list : []);
    } catch {
      setAll([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const customerName = useCallback(
    (id: string) => customers.find((c) => c.id_customer === id)?.name ?? "",
    [customers]
  );

  const agentIdToName = useMemo(() => buildAgentIdToNameMap(agents), [agents]);

  const statusTabs = useMemo(() => {
    const fromData = new Set<string>();
    for (const p of all) {
      const s = normalizeStatus(p.status);
      if (s) fromData.add(s);
    }
    const ordered: string[] = [];
    for (const s of CANONICAL_STATUSES) {
      ordered.push(s);
    }
    const canonicalSet = new Set<string>(CANONICAL_STATUSES);
    const extras = [...fromData].filter((s) => !canonicalSet.has(s)).sort();
    return [...ordered, ...extras];
  }, [all]);

  useEffect(() => {
    if (statusTabs.length === 0) return;
    if (!statusTabs.includes(activeStatus)) {
      setActiveStatus(statusTabs[0]);
    }
  }, [statusTabs, activeStatus]);

  const filters = tabFilters[activeStatus] ?? DEFAULT_TAB_FILTERS;

  const setFilter = (field: keyof TabFilters, value: string) => {
    setTabFilters((prev) => ({
      ...prev,
      [activeStatus]: { ...(prev[activeStatus] ?? { ...DEFAULT_TAB_FILTERS }), [field]: value },
    }));
    setPageByStatus((prev) => ({ ...prev, [activeStatus]: 1 }));
  };

  const filteredForTab = useMemo(() => {
    const st = normalizeStatus(activeStatus);
    let list = all.filter((p) => normalizeStatus(p.status) === st);
    const f = filters;

    if (f.proposal_id.trim()) {
      const q = f.proposal_id.trim().toLowerCase();
      list = list.filter((p) => p.id_proposal.toLowerCase().includes(q));
    }
    if (f.customer_account_name.trim()) {
      const q = f.customer_account_name.trim().toLowerCase();
      list = list.filter((p) => customerName(p.id_customer).toLowerCase().includes(q));
    }
    if (f.customer_id.trim()) {
      const q = f.customer_id.trim().toLowerCase();
      list = list.filter((p) => p.id_customer.toLowerCase().includes(q));
    }
    if (f.agent_id.trim()) {
      const aid = f.agent_id.trim();
      list = list.filter((p) => String(p.agent ?? "").trim() === aid);
    }
    if (f.proposal_title.trim()) {
      const q = f.proposal_title.trim().toLowerCase();
      list = list.filter((p) => (p.title || "").toLowerCase().includes(q));
    }
    if (f.proposal_fase.trim()) {
      const q = f.proposal_fase.trim().toLowerCase();
      list = list.filter((p) => formatProposalFaseLabel(p.proposal_fase).toLowerCase().includes(q));
    }
    if (f.proposal_amount_eur.trim()) {
      const raw = f.proposal_amount_eur.trim().replace(",", ".");
      const n = parseFloat(raw);
      if (!Number.isNaN(n)) {
        list = list.filter((p) => Math.abs(Number(p.amount_eur) - n) < 0.005);
      } else {
        const q = raw.toLowerCase();
        list = list.filter((p) => String(p.amount_eur ?? "").toLowerCase().includes(q));
      }
    }
    if (f.proposal_creation_date.trim()) {
      const q = f.proposal_creation_date.trim().toLowerCase();
      list = list.filter((p) => {
        const dc = String(p.date_created ?? "").slice(0, 10).toLowerCase();
        const dp = String(p.proposal_date ?? "").slice(0, 10).toLowerCase();
        const full = `${p.date_created ?? ""} ${p.proposal_date ?? ""}`.toLowerCase();
        return dc.includes(q) || dp.includes(q) || full.includes(q);
      });
    }

    return list;
  }, [all, activeStatus, filters, customerName]);

  const page = pageByStatus[activeStatus] ?? 1;
  const totalPages = Math.max(1, Math.ceil(filteredForTab.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated = filteredForTab.slice(start, start + ITEMS_PER_PAGE);

  const setPage = (next: number) => {
    setPageByStatus((prev) => ({ ...prev, [activeStatus]: next }));
  };

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Proposals" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Proposals",
      breadcrumbs,
      buttons: [{ label: "Create", href: "/logged/pages/account-management/proposals/create" }],
    });
  }, [setPageMeta, breadcrumbs]);

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <>
      <PageContentSection>
        <div className="flex w-full flex-col">
          <div className="overflow-hidden rounded-b-lg bg-white p-6">
            <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-200">
              {statusTabs.map((st) => {
                const isActive = normalizeStatus(activeStatus) === normalizeStatus(st);
                const count = all.filter((p) => normalizeStatus(p.status) === normalizeStatus(st)).length;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setActiveStatus(st);
                    }}
                    className={`relative px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                      isActive
                        ? "text-blue-800 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-blue-800"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {st}
                    <span className="ml-1.5 tabular-nums text-xs font-normal text-gray-500">({count})</span>
                  </button>
                );
              })}
            </div>

            <p className="mb-3 text-sm font-semibold text-gray-700">Filter</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs text-gray-600">Proposal title</label>
                <input
                  type="text"
                  value={filters.proposal_title}
                  onChange={(e) => setFilter("proposal_title", e.target.value)}
                  className={inputClass}
                  placeholder="Title"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Customer account name</label>
                <input
                  type="text"
                  value={filters.customer_account_name}
                  onChange={(e) => setFilter("customer_account_name", e.target.value)}
                  className={inputClass}
                  placeholder="Account name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Customer ID</label>
                <input
                  type="text"
                  value={filters.customer_id}
                  onChange={(e) => setFilter("customer_id", e.target.value)}
                  className={inputClass}
                  placeholder="customer_id"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Agent</label>
                <select
                  value={filters.agent_id}
                  onChange={(e) => setFilter("agent_id", e.target.value)}
                  className={inputClass}
                >
                  <option value="">All agents</option>
                  {[...agents]
                    .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }))
                    .map((a) => (
                      <option key={a.id_agent} value={a.id_agent}>
                        {a.name || a.id_agent}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Phase</label>
                <input
                  type="text"
                  value={filters.proposal_fase}
                  onChange={(e) => setFilter("proposal_fase", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Step 2, created"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Proposal ID</label>
                <input
                  type="text"
                  value={filters.proposal_id}
                  onChange={(e) => setFilter("proposal_id", e.target.value)}
                  className={inputClass}
                  placeholder="proposal_id"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Amount (€)</label>
                <input
                  type="text"
                  value={filters.proposal_amount_eur}
                  onChange={(e) => setFilter("proposal_amount_eur", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 1234.56"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Creation date</label>
                <input
                  type="text"
                  value={filters.proposal_creation_date}
                  onChange={(e) => setFilter("proposal_creation_date", e.target.value)}
                  className={inputClass}
                  placeholder="YYYY-MM-DD"
                />
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Proposal title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Customer account name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Customer ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Agent
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Phase
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Amount (€)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Creation date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-5 text-center text-sm text-gray-500">
                        Loading proposals…
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-5 text-center text-sm text-gray-500">
                        No proposals in this status with the current filters.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((p) => {
                      const proposalHref = getProposalRowHref(p.id_proposal, {
                        activeTabStatus: activeStatus,
                        rowStatus: p.status,
                      });
                      return (
                      <tr
                        key={p.id_proposal}
                        role="link"
                        tabIndex={0}
                        onClick={() => router.push(proposalHref)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(proposalHref);
                          }
                        }}
                        className={rowClass}
                      >
                        <td className="max-w-md truncate px-4 py-3 text-sm text-gray-900" title={p.title || p.id_proposal}>
                          {p.title || "—"}
                        </td>
                        <td className="max-w-[12rem] truncate px-4 py-3 text-sm text-gray-900" title={customerName(p.id_customer)}>
                          {customerName(p.id_customer) || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-700">{p.id_customer}</td>
                        <td className="max-w-[10rem] truncate px-4 py-3 text-sm text-gray-900" title={resolveAgentDisplayName(p.agent, agentIdToName)}>
                          {resolveAgentDisplayName(p.agent, agentIdToName)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700" title={formatProposalFaseLabel(p.proposal_fase)}>
                          {formatProposalFaseLabel(p.proposal_fase)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {Number(p.amount_eur).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {String(p.date_created ?? "").slice(0, 10) || "—"}
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {(filteredForTab.length > ITEMS_PER_PAGE || totalPages > 1) && !loading && filteredForTab.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">
                  Showing {start + 1}–{Math.min(start + ITEMS_PER_PAGE, filteredForTab.length)} of {filteredForTab.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(1, safePage - 1))}
                    disabled={safePage <= 1}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                    disabled={safePage >= totalPages}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default ProposalsPage;
