"use client";

import React, { FC, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import contractsData from "@/app/contents/contracts.json";
import customersData from "@/app/contents/customers.json";
import projectsData from "@/app/contents/projects.json";

type Contract = {
  id_contract: string;
  id_proposal: string;
  id_customer: string;
  process_state: string;
  payment_state: string;
  title: string;
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
  project_type?: string;
  publication_date?: string;
};

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

  if (!contract) {
    return (
      <div className="flex flex-col w-full p-12">
        <p className="text-gray-500">Contract not found.</p>
        <Link href="/logged/pages/pm/projects" className="text-blue-600 hover:underline mt-4">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="text-center bg-blue-950/70 p-5 text-white flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/logged/pages/pm/projects")}
          className="text-white/90 hover:text-white text-sm"
        >
          ← Back
        </button>
        <p className="text-2xl">Contract: {contract.title}</p>
      </div>

      <div className="p-12 max-w-4xl space-y-8">
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
            <Link href={`/logged/pages/pm/proposals/${contract.id_proposal}`} className="text-blue-600 hover:underline">{contract.id_proposal}</Link>
          </div>
        </div>

        {customer && (
          <div className="border-t pt-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Customer</p>
            <Link href={`/logged/pages/pm/customers_db/${customer.id_customer}`} className="text-blue-600 hover:underline">
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
                onClick={() => router.push(`/logged/pages/pm/projects/${p.id_project}`)}
                className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-blue-50/80 transition-colors"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-gray-500">{p.project_type?.replace(/_/g, " ")} · {p.publication_date ?? "—"}</p>
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
