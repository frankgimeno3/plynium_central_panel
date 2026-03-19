"use client";

import React, { FC, useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { Agent } from "@/app/contents/interfaces";
import { CustomerService } from "@/app/service/CustomerService";
import { AgentService } from "@/app/service/AgentService";
import { ProposalService } from "@/app/service/ProposalService";

type CustomerRecord = { id_customer: string; name: string; owner?: string };
type ProposalRecord = { id_proposal: string; agent?: string };

function countAccounts(customers: CustomerRecord[], ownerName: string): number {
  return customers.filter((c) => (c.owner ?? "").trim() === ownerName).length;
}

function countProposals(proposals: ProposalRecord[], agentName: string): number {
  return proposals.filter((p) => (p.agent ?? "").trim() === agentName).length;
}

const AgentsPage: FC = () => {
  const router = useRouter();
  const [all, setAll] = useState<Agent[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  useEffect(() => {
    AgentService.getAllAgents().then((l: Agent[]) => setAll(Array.isArray(l) ? l : [])).catch(() => setAll([]));
  }, []);
  useEffect(() => {
    CustomerService.getAllCustomers().then((l: CustomerRecord[]) => setCustomers(Array.isArray(l) ? l : [])).catch(() => setCustomers([]));
  }, []);
  const loadProposals = useCallback(async () => {
    try {
      const list = await ProposalService.getAllProposals();
      setProposals(Array.isArray(list) ? list : []);
    } catch {
      setProposals([]);
    }
  }, []);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);
  const [filter, setFilter] = useState({
    name: "",
    id: "",
  });

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.name)
      list = list.filter((a) =>
        a.name.toLowerCase().includes(filter.name.toLowerCase())
      );
    if (filter.id)
      list = list.filter((a) =>
        a.id_agent.toLowerCase().includes(filter.id.toLowerCase())
      );
    return list;
  }, [all, filter]);

  const breadcrumbs = [
    { label: "Administration", href: "/logged/pages/administration" },
    { label: "Agents" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Agents", breadcrumbs, buttons: [] });
  }, [setPageMeta]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Agent ID</label>
              <input
                type="text"
                value={filter.id}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, id: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. agent-001"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={filter.name}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agent name"
              />
            </div>
          </div>

        <div className="overflow-x-auto mt-6">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accounts
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proposals
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                    {all.length === 0 ? "No agents yet." : "No agents match the filters."}
                  </td>
                </tr>
              ) : (
              filtered.map((a) => (
                <tr
                  key={a.id_agent}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/logged/pages/administration/agents/${encodeURIComponent(a.id_agent)}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/logged/pages/administration/agents/${encodeURIComponent(a.id_agent)}`);
                    }
                  }}
                  className="hover:bg-gray-100 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {a.id_agent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {a.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {a.email ?? "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                    {countAccounts(customers, a.name)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                    {countProposals(proposals, a.name)}
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default AgentsPage;
