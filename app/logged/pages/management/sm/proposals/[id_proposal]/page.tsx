"use client";

import React, { FC, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import proposalsData from "@/app/contents/proposals.json";
import customersData from "@/app/contents/customers.json";
import servicesData from "@/app/contents/services.json";

type Proposal = {
  id_proposal: string;
  id_customer: string;
  status: string;
  title: string;
  amount_eur: number;
  date_created: string;
  servicesArray?: { id_service: string; price: number; description: string }[];
};

type Service = { id_service: string; name: string };
type Customer = {
  id_customer: string;
  name: string;
  contact?: { name: string; role: string; email: string; phone: string };
};

const ProposalDetailPage: FC<{ params: Promise<{ id_proposal: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_proposal } = use(params);
  const proposal = (proposalsData as Proposal[]).find((p) => p.id_proposal === id_proposal);
  const services = servicesData as Service[];
  const getServiceName = (id: string) => services.find((s) => s.id_service === id)?.name?.replace(/_/g, " ") ?? id;
  const customer = proposal
    ? (customersData as Customer[]).find((c) => c.id_customer === proposal.id_customer)
    : null;

  if (!proposal) {
    return (
      <div className="flex flex-col w-full p-12">
        <p className="text-gray-500">Proposal not found.</p>
        <Link href="/logged/pages/management/sm/projects" className="text-blue-600 hover:underline mt-4">
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
          onClick={() => router.push("/logged/pages/management/sm/projects")}
          className="text-white/90 hover:text-white text-sm"
        >
          ← Back
        </button>
        <p className="text-2xl">Proposal: {proposal.title}</p>
      </div>

      <div className="p-12 max-w-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">ID</p>
            <p className="font-medium">{proposal.id_proposal}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Status</p>
            <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
              proposal.status === "accepted" ? "bg-green-100 text-green-800" :
              proposal.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
            }`}>{proposal.status}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Amount (€)</p>
            <p className="font-medium">{proposal.amount_eur?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Date created</p>
            <p className="font-medium">{proposal.date_created}</p>
          </div>
        </div>

        {proposal.servicesArray && proposal.servicesArray.length > 0 && (
          <div className="border-t pt-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Services</p>
            <div className="space-y-3">
              {proposal.servicesArray.map((svc, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-900">{getServiceName(svc.id_service)}</span>
                    <span className="text-sm text-gray-600">{svc.price?.toLocaleString()} €</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{svc.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {customer && (
          <div className="border-t pt-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Customer</p>
            <Link
              href={`/logged/pages/management/sm/customers_db/${customer.id_customer}`}
              className="text-blue-600 hover:underline"
            >
              {customer.name}
            </Link>
            {customer.contact && (
              <p className="text-sm text-gray-600 mt-1">
                {customer.contact.name} · {customer.contact.email}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalDetailPage;
