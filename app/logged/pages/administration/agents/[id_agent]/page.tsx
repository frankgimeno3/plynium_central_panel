"use client";

import React, { FC, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import agentsData from "@/app/contents/agentsContents.json";
import customersData from "@/app/contents/customers.json";
import proposalsData from "@/app/contents/proposals.json";
import type { Agent } from "@/app/contents/interfaces";

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

  const agent = useMemo(() => {
    if (!idAgent) return null;
    return (agentsData as Agent[]).find((a) => a.id_agent === idAgent) ?? null;
  }, [idAgent]);

  const customers = useMemo(() => {
    if (!agent?.name) return [];
    return (customersData as CustomerRecord[]).filter(
      (c) => (c.owner ?? "").trim() === agent.name
    );
  }, [agent?.name]);

  const proposals = useMemo(() => {
    if (!agent?.name) return [];
    return (proposalsData as ProposalRecord[]).filter(
      (p) => (p.agent ?? "").trim() === agent.name
    );
  }, [agent?.name]);

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
          <p className="text-gray-500">Invalid agent.</p>
        </PageContentSection>
      </>
    );
  }

  if (!agent) {
    return (
      <>
        <PageContentSection>
          <p className="text-gray-500">Agent not found: {idAgent}</p>
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
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">
                  {agent.phone ?? "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PageContentSection>

      <PageContentSection>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Cuentas que lleva ({customers.length})
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
      </PageContentSection>

      <PageContentSection>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Propuestas ({proposals.length})
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
                    const customer = (customersData as CustomerRecord[]).find(
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
      </PageContentSection>
    </>
  );
};

export default AgentDetailPage;
