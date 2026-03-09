"use client";

import React, { FC, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import contractsData from "@/app/contents/contracts.json";
import customersData from "@/app/contents/customers.json";
import projectsData from "@/app/contents/projects.json";
import servicesData from "@/app/contents/services.json";

type Contract = {
  id_contract: string;
  id_proposal: string;
  id_customer: string;
  process_state: string;
  payment_state: string;
  title: string;
  amount_eur?: number;
};

type Customer = {
  id_customer: string;
  name: string;
  contact?: { name: string; email: string };
};

type Project = {
  id_project: string;
  id_contract: string;
  title: string;
  status: string;
  service?: string;
  publication_date?: string;
};

type Service = { id_service: string; name: string };

const ContractDetailPage: FC<{ params: Promise<{ id_project: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_project } = use(params);
  // id_project param holds the contract id when viewing a contract
  const contract = (contractsData as Contract[]).find((c) => c.id_contract === id_project);
  const customer = contract
    ? (customersData as Customer[]).find((c) => c.id_customer === contract.id_customer)
    : null;
  const projects = contract
    ? (projectsData as Project[]).filter((p) => p.id_contract === contract.id_contract)
    : [];
  const services = servicesData as Service[];
  const getServiceName = (id: string) => services.find((s) => s.id_service === id)?.name?.replace(/_/g, " ") ?? id;

  if (!contract) {
    return (
      <div className="flex flex-col w-full p-12">
        <p className="text-gray-500">Contract not found.</p>
        <Link href="/logged/pages/production/projects" className="text-blue-600 hover:underline mt-4">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 w-full min-h-screen bg-white">
      <div className="text-center bg-blue-950/70 p-5 text-white flex items-center justify-center gap-4 shrink-0">
        <button
          type="button"
          onClick={() => router.push("/logged/pages/production/projects")}
          className="text-white/90 hover:text-white text-sm"
        >
          ← Back
        </button>
        <p className="text-2xl">Contract: {contract.title}</p>
      </div>

      <div className="flex-1 p-12 w-full space-y-8 overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">ID</p>
            <p className="font-medium">{contract.id_contract}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Process state</p>
            <span className={`inline-block px-2 py-1 rounded text-sm ${contract.process_state === "active" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>{contract.process_state}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Payment state</p>
            <span className={`inline-block px-2 py-1 rounded text-sm ${contract.payment_state === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{contract.payment_state}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Proposal</p>
            <Link href={`/logged/pages/account-management/proposals/${contract.id_proposal}`} className="text-blue-600 hover:underline">{contract.id_proposal}</Link>
          </div>
          {contract.amount_eur != null && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Amount (€)</p>
              <p className="font-medium">{contract.amount_eur.toLocaleString()}</p>
            </div>
          )}
        </div>

        {customer && (
          <div className="border-t pt-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Customer</p>
            <Link href={`/logged/pages/account-management/customers_db/${customer.id_customer}`} className="text-blue-600 hover:underline">
              {customer.name}
            </Link>
          </div>
        )}

        <div className="border-t pt-6">
          <p className="text-sm font-medium text-gray-700 mb-4">Projects ({projects.length})</p>
          <div className="space-y-2">
            {projects.map((p) => (
              <div
                key={p.id_project}
                onClick={() => router.push(`/logged/pages/production/projects/${p.id_project}`)}
                className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-blue-50/80 transition-colors"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-gray-500">{p.service ? getServiceName(p.service) : "—"} · {p.publication_date ?? "—"}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${p.status === "published" ? "bg-green-100" : p.status === "ok_production" ? "bg-blue-100" : "bg-gray-100"}`}>{p.status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetailPage;
