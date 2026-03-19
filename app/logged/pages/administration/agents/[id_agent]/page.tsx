"use client";

import React, { FC, useMemo, useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { Agent } from "@/app/contents/interfaces";
import { CustomerService } from "@/app/service/CustomerService";
import { AgentService } from "@/app/service/AgentService";
import { ProposalService } from "@/app/service/ProposalService";

type CustomerRecord = {
  id_customer: string;
  name: string;
  owner?: string;
  status?: string;
  industry?: string;
};

type ProposalRecord = {
  id_proposal: string;
  id_customer: string;
  agent?: string;
  title: string;
  status: string;
  amount_eur: number;
  date_created: string;
};

const AgentDetailPage: FC = () => {
  const params = useParams();
  const idAgent =
    typeof params?.id_agent === "string"
      ? decodeURIComponent(params.id_agent)
      : null;

  const [agent, setAgent] = useState<Agent | null | undefined>(undefined);
  const [allCustomers, setAllCustomers] = useState<CustomerRecord[]>([]);
  const [allProposals, setAllProposals] = useState<ProposalRecord[]>([]);
  useEffect(() => {
    if (!idAgent) return;
    setAgent(undefined);
    AgentService.getAgentById(idAgent)
      .then((a: Agent) => setAgent(a))
      .catch(() => setAgent(null));
  }, [idAgent]);
  useEffect(() => {
    CustomerService.getAllCustomers().then((l: CustomerRecord[]) => setAllCustomers(Array.isArray(l) ? l : [])).catch(() => setAllCustomers([]));
  }, []);

  const loadProposals = useCallback(async () => {
    try {
      const list = await ProposalService.getAllProposals();
      setAllProposals(Array.isArray(list) ? list : []);
    } catch {
      setAllProposals([]);
    }
  }, []);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const customers = useMemo(() => {
    if (!agent?.name) return [];
    return allCustomers.filter((c) => (c.owner ?? "").trim() === agent.name);
  }, [agent?.name, allCustomers]);

  const proposals = useMemo(() => {
    if (!agent?.name) return [];
    return allProposals.filter((p) => (p.agent ?? "").trim() === agent.name);
  }, [agent?.name, allProposals]);

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    if (agent) {
      setPageMeta({
        pageTitle: `Agent — ${agent.name}`,
        breadcrumbs: [
          { label: "Administration", href: "/logged/pages/administration" },
          { label: "Agents", href: "/logged/pages/administration/agents" },
          { label: agent.name },
        ],
        buttons: [{ label: "Back to Agents", href: "/logged/pages/administration/agents" }],
      });
    } else if (idAgent) {
      setPageMeta({
        pageTitle: "Agent not found",
        breadcrumbs: [
          { label: "Administration", href: "/logged/pages/administration" },
          { label: "Agents", href: "/logged/pages/administration/agents" },
          { label: idAgent },
        ],
        buttons: [{ label: "Back to Agents", href: "/logged/pages/administration/agents" }],
      });
    } else {
      setPageMeta({
        pageTitle: "Invalid agent",
        breadcrumbs: [
          { label: "Administration", href: "/logged/pages/administration" },
          { label: "Agents", href: "/logged/pages/administration/agents" },
        ],
        buttons: [{ label: "Back to Agents", href: "/logged/pages/administration/agents" }],
      });
    }
  }, [setPageMeta, agent, idAgent]);

  if (!idAgent) {
    return (
      <>
        <PageContentSection>
          <div className="flex flex-col w-full">
            <div className="bg-white rounded-b-lg overflow-hidden p-6">
              <p className="text-gray-500">Invalid agent.</p>
            </div>
          </div>
        </PageContentSection>
      </>
    );
  }

  if (agent === undefined) {
    return (
      <>
        <PageContentSection>
          <div className="flex flex-col w-full">
            <div className="bg-white rounded-b-lg overflow-hidden p-6">
              <p className="text-gray-500">Loading agent…</p>
            </div>
          </div>
        </PageContentSection>
      </>
    );
  }
  if (agent === null) {
    return (
      <>
        <PageContentSection>
          <div className="flex flex-col w-full">
            <div className="bg-white rounded-b-lg overflow-hidden p-6">
              <p className="text-gray-500">Agent not found: {idAgent}</p>
            </div>
          </div>
        </PageContentSection>
      </>
    );
  }

  const breadcrumbs = [
    { label: "Administration", href: "/logged/pages/administration" },
    { label: "Agents", href: "/logged/pages/administration/agents" },
    { label: agent.name },
  ];

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
        <div className="overflow-hidden max-w-2xl">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Agent ID
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">
                  {agent.id_agent}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">{agent.name}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">
                  {agent.email ?? "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Accounts managed ({customers.length})
        </h2>
          {customers.length === 0 ? (
            <p className="text-sm text-gray-500">No accounts assigned.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((c) => (
                    <tr key={c.id_customer} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link
                          href={`/logged/pages/account-management/customers_db/${encodeURIComponent(c.id_customer)}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {c.id_customer}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {c.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {c.industry ?? "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            c.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {c.status ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Proposals ({proposals.length})
        </h2>
          {proposals.length === 0 ? (
            <p className="text-sm text-gray-500">No proposals.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount (€)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {proposals.map((p) => {
                    const customer = allCustomers.find(
                      (c) => c.id_customer === p.id_customer
                    );
                    return (
                      <tr key={p.id_proposal} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <Link
                            href={`/logged/pages/account-management/proposals/${encodeURIComponent(p.id_proposal)}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {p.id_proposal}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {p.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {customer ? (
                            <Link
                              href={`/logged/pages/account-management/customers_db/${encodeURIComponent(p.id_customer)}`}
                              className="text-blue-600 hover:underline"
                            >
                              {customer.name}
                            </Link>
                          ) : (
                            p.id_customer
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              p.status === "accepted"
                                ? "bg-green-100 text-green-800"
                                : p.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {p.date_created}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {p.amount_eur.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default AgentDetailPage;
