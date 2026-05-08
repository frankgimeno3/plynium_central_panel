"use client";

import React, { FC, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { CustomerService } from "@/app/service/CustomerService";
import { ContractService } from "@/app/service/ContractService";
import { AgentService } from "@/app/service/AgentService";
import { buildAgentIdToNameMap, resolveAgentDisplayName } from "@/app/logged/pages/account-management/resolveAgentDisplayName";

type Contract = {
  id_contract: string;
  id_proposal: string;
  id_customer: string;
  /** `agent_id` in contracts_db */
  agent?: string;
  process_state: string;
  payment_state: string;
  title: string;
  amount_eur?: number;
};

type Customer = { id_customer: string; name: string };
type AgentRow = { id_agent: string; name: string };

const CANONICAL_PROCESS = ["active", "expired"] as const;

type TabFilters = {
  contract_id: string;
  customer_account_name: string;
  agent_id: string;
  payment_state: string;
};

const emptyFilters = (): TabFilters => ({
  contract_id: "",
  customer_account_name: "",
  agent_id: "",
  payment_state: "",
});

const DEFAULT_TAB_FILTERS: TabFilters = emptyFilters();

const ITEMS_PER_PAGE = 12;

function normalizeProcess(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase();
}

const ContractsPage: FC = () => {
  const router = useRouter();
  const [all, setAll] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [activeProcess, setActiveProcess] = useState<string>("active");
  const [tabFilters, setTabFilters] = useState<Record<string, TabFilters>>({});
  const [pageByProcess, setPageByProcess] = useState<Record<string, number>>({});

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

  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await ContractService.getAllContracts();
      setAll(Array.isArray(list) ? list : []);
    } catch {
      setAll([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const customerName = useCallback(
    (id: string) => customers.find((c) => c.id_customer === id)?.name ?? "",
    [customers]
  );

  const agentIdToName = useMemo(() => buildAgentIdToNameMap(agents), [agents]);

  const processTabs = useMemo(() => {
    const fromData = new Set<string>();
    for (const c of all) {
      const s = normalizeProcess(c.process_state);
      if (s) fromData.add(s);
    }
    const ordered: string[] = [];
    for (const s of CANONICAL_PROCESS) {
      ordered.push(s);
    }
    const canonicalSet = new Set<string>(CANONICAL_PROCESS);
    const extras = [...fromData].filter((s) => !canonicalSet.has(s)).sort();
    return [...ordered, ...extras];
  }, [all]);

  useEffect(() => {
    if (processTabs.length === 0) return;
    if (!processTabs.includes(activeProcess)) {
      setActiveProcess(processTabs.includes("active") ? "active" : processTabs[0]);
    }
  }, [processTabs, activeProcess]);

  const filters = tabFilters[activeProcess] ?? DEFAULT_TAB_FILTERS;

  const setFilter = (field: keyof TabFilters, value: string) => {
    setTabFilters((prev) => ({
      ...prev,
      [activeProcess]: { ...(prev[activeProcess] ?? { ...DEFAULT_TAB_FILTERS }), [field]: value },
    }));
    setPageByProcess((prev) => ({ ...prev, [activeProcess]: 1 }));
  };

  const filteredForTab = useMemo(() => {
    const proc = normalizeProcess(activeProcess);
    let list = all.filter((c) => normalizeProcess(c.process_state) === proc);
    const f = filters;

    if (f.contract_id.trim()) {
      const q = f.contract_id.trim().toLowerCase();
      list = list.filter((c) => c.id_contract.toLowerCase().includes(q));
    }
    if (f.customer_account_name.trim()) {
      const q = f.customer_account_name.trim().toLowerCase();
      list = list.filter((c) => customerName(c.id_customer).toLowerCase().includes(q));
    }
    if (f.agent_id.trim()) {
      const aid = f.agent_id.trim();
      list = list.filter((c) => String(c.agent ?? "").trim() === aid);
    }
    if (f.payment_state.trim()) {
      const q = f.payment_state.trim().toLowerCase();
      list = list.filter((c) => (c.payment_state || "").toLowerCase().includes(q));
    }

    return list;
  }, [all, activeProcess, filters, customerName]);

  const page = pageByProcess[activeProcess] ?? 1;
  const totalPages = Math.max(1, Math.ceil(filteredForTab.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated = filteredForTab.slice(start, start + ITEMS_PER_PAGE);

  const setPage = (next: number) => {
    setPageByProcess((prev) => ({ ...prev, [activeProcess]: next }));
  };

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Contracts" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Contracts", breadcrumbs });
  }, [setPageMeta, breadcrumbs]);

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <>
      <PageContentSection>
        <div className="flex w-full flex-col">
          <div className="overflow-hidden rounded-b-lg bg-white p-6">
            <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-200">
              {processTabs.map((proc) => {
                const isActive = normalizeProcess(activeProcess) === normalizeProcess(proc);
                const count = all.filter((c) => normalizeProcess(c.process_state) === normalizeProcess(proc)).length;
                return (
                  <button
                    key={proc}
                    type="button"
                    onClick={() => setActiveProcess(proc)}
                    className={`relative px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                      isActive
                        ? "text-blue-800 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-blue-800"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {proc}
                    <span className="ml-1.5 tabular-nums text-xs font-normal text-gray-500">({count})</span>
                  </button>
                );
              })}
            </div>

            <p className="mb-3 text-sm font-semibold text-gray-700">Filter</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs text-gray-600">Contract ID</label>
                <input
                  type="text"
                  value={filters.contract_id}
                  onChange={(e) => setFilter("contract_id", e.target.value)}
                  className={inputClass}
                  placeholder="id_contract"
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
                <label className="mb-1 block text-xs text-gray-600">Payment state</label>
                <input
                  type="text"
                  value={filters.payment_state}
                  onChange={(e) => setFilter("payment_state", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. paid, pending"
                />
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Contract ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Customer account name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Agent
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Process
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Amount (€)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-5 text-center text-sm text-gray-500">
                        Loading contracts…
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-5 text-center text-sm text-gray-500">
                        No contracts in this process state with the current filters.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((c) => (
                      <tr
                        key={c.id_contract}
                        onClick={() =>
                          router.push(`/logged/pages/account-management/contracts/${encodeURIComponent(c.id_contract)}`)
                        }
                        className={rowClass}
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-900">{c.id_contract}</td>
                        <td className="max-w-[14rem] truncate px-4 py-3 text-sm text-gray-900" title={customerName(c.id_customer)}>
                          {customerName(c.id_customer) || "—"}
                        </td>
                        <td className="max-w-[10rem] truncate px-4 py-3 text-sm text-gray-900" title={resolveAgentDisplayName(c.agent, agentIdToName)}>
                          {resolveAgentDisplayName(c.agent, agentIdToName)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <span
                            className={`rounded px-2 py-1 text-xs font-medium ${
                              normalizeProcess(c.process_state) === "active"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {c.process_state}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <span
                            className={`rounded px-2 py-1 text-xs font-medium ${
                              normalizeProcess(c.payment_state) === "paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {c.payment_state}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {c.amount_eur != null ? Number(c.amount_eur).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))
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

export default ContractsPage;
