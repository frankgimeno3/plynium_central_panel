"use client";

import React, { FC, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import customersData from "@/app/contents/customers.json";
import proposalsData from "@/app/contents/proposals.json";
import contractsData from "@/app/contents/contracts.json";
import projectsData from "@/app/contents/projects.json";

type Customer = {
  id_customer: string;
  name: string;
  cif: string;
  country: string;
  contact: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  comments: { id?: string; text: string; date?: string; author?: string }[];
  proposals: string[];
  contracts: string[];
  projects: string[];
};

type Proposal = { id_proposal: string; title: string; status: string; amount_eur: number };
type Contract = { id_contract: string; title: string; process_state: string; payment_state: string };
type Project = { id_project: string; title: string; status: string };

const CustomerDetailPage: FC<{ params: Promise<{ id_customer: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_customer } = use(params);
  const customer = (customersData as Customer[]).find((c) => c.id_customer === id_customer);
  const proposals = customer
    ? (proposalsData as Proposal[]).filter((p) => customer.proposals?.includes(p.id_proposal))
    : [];
  const contracts = customer
    ? (contractsData as Contract[]).filter((c) => customer.contracts?.includes(c.id_contract))
    : [];
  const projects = customer
    ? (projectsData as Project[]).filter((p) => customer.projects?.includes(p.id_project))
    : [];

  if (!customer) {
    return (
      <div className="flex flex-col w-full p-12">
        <p className="text-gray-500">Customer not found.</p>
        <Link href="/logged/pages/management/sm/customers_db" className="text-blue-600 hover:underline mt-4">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <div className="text-center bg-blue-950/70 p-5 text-white flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/logged/pages/management/sm/customers_db")}
          className="text-white/90 hover:text-white text-sm"
        >
          ← Back
        </button>
        <p className="text-2xl">{customer.name}</p>
      </div>

      <div className="p-12 max-w-5xl space-y-10">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company data</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">CIF</p>
              <p className="font-medium">{customer.cif}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Country</p>
              <p className="font-medium">{customer.country}</p>
            </div>
            {customer.contact && (
              <>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Contact</p>
                  <p className="font-medium">{customer.contact.name}</p>
                  <p className="text-sm text-gray-600">{customer.contact.role}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Email</p>
                  <a href={`mailto:${customer.contact.email}`} className="text-blue-600 hover:underline">{customer.contact.email}</a>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Phone</p>
                  <a href={`tel:${customer.contact.phone}`} className="text-blue-600 hover:underline">{customer.contact.phone}</a>
                </div>
              </>
            )}
          </div>
        </div>

        {(customer.comments?.length ?? 0) > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
            <ul className="space-y-2">
              {customer.comments.map((cmt, i) => (
                <li key={i} className="p-3 bg-gray-50 rounded text-sm">{cmt.text}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposals ({proposals.length})</h3>
          <div className="space-y-2">
            {proposals.length === 0 ? (
              <p className="text-gray-500 text-sm">No proposals</p>
            ) : (
              proposals.map((p) => (
                <div
                  key={p.id_proposal}
                  onClick={() => router.push(`/logged/pages/management/sm/proposals/${p.id_proposal}`)}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-blue-50/80 transition-colors"
                >
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-sm text-gray-500">{p.id_proposal}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{p.amount_eur?.toLocaleString()} €</span>
                    <span className={`px-2 py-1 rounded text-xs ${p.status === "accepted" ? "bg-green-100" : p.status === "rejected" ? "bg-red-100" : "bg-amber-100"}`}>{p.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contracts ({contracts.length})</h3>
          <div className="space-y-2">
            {contracts.length === 0 ? (
              <p className="text-gray-500 text-sm">No contracts</p>
            ) : (
              contracts.map((c) => (
                <div
                  key={c.id_contract}
                  onClick={() => router.push(`/logged/pages/management/sm/contracts/${c.id_contract}`)}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-blue-50/80 transition-colors"
                >
                  <p className="font-medium">{c.title}</p>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${c.process_state === "active" ? "bg-blue-100" : "bg-gray-100"}`}>{c.process_state}</span>
                    <span className={`px-2 py-1 rounded text-xs ${c.payment_state === "paid" ? "bg-green-100" : "bg-amber-100"}`}>{c.payment_state}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects ({projects.length})</h3>
          <div className="space-y-2">
            {projects.length === 0 ? (
              <p className="text-gray-500 text-sm">No projects</p>
            ) : (
              projects.map((p) => (
                <div
                  key={p.id_project}
                  onClick={() => router.push(`/logged/pages/management/sm/projects/${p.id_project}`)}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-blue-50/80 transition-colors"
                >
                  <p className="font-medium">{p.title}</p>
                  <span className="px-2 py-1 rounded text-xs bg-gray-100">{p.status.replace("_", " ")}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
