"use client";

import React, { FC, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import servicesContentsData from "@/app/contents/servicesContents.json";
import proposalsData from "@/app/contents/proposals.json";
import projectsData from "@/app/contents/projects.json";

type ServiceContent = {
  id_service: string;
  name: string;
  display_name?: string;
  description: string;
  tariff_price_eur: number;
  unit?: string;
  delivery_days?: number;
};

type Proposal = {
  id_proposal: string;
  id_customer: string;
  status: string;
  title: string;
  amount_eur: number;
  servicesArray?: { id_service: string; price: number; description: string }[];
};

type Project = {
  id_project: string;
  id_contract: string;
  title: string;
  status: string;
  service?: string;
};

const ServiceDetailPage: FC<{ params: Promise<{ id_service: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_service } = use(params);
  const services = servicesContentsData as ServiceContent[];
  const service = services.find((s) => s.id_service === id_service);
  const proposals = (proposalsData as Proposal[]).filter((p) =>
    p.servicesArray?.some((svc) => svc.id_service === id_service)
  );
  const projects = (projectsData as Project[]).filter((p) => p.service === id_service);

  if (!service) {
    return (
      <div className="flex flex-col w-full p-12">
        <p className="text-gray-500">Service not found.</p>
        <Link href="/logged/pages/production/services" className="text-blue-600 hover:underline mt-4">
          ← Back to Services
        </Link>
      </div>
    );
  }

  const displayName = (service.display_name ?? service.name).replace(/_/g, " ");

  return (
    <div className="flex flex-col flex-1 min-w-0 w-full min-h-screen bg-white">
      <div className="text-center bg-blue-950/70 p-5 text-white flex items-center justify-center gap-4 shrink-0">
        <button
          type="button"
          onClick={() => router.push("/logged/pages/production/services")}
          className="text-white/90 hover:text-white text-sm"
        >
          ← Back
        </button>
        <p className="text-2xl">Service: {displayName}</p>
      </div>

      <div className="flex-1 p-12 w-full space-y-6 overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">ID</p>
            <p className="font-medium">{service.id_service}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Name</p>
            <p className="font-medium">{displayName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Price (€)</p>
            <p className="font-medium">{service.tariff_price_eur?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Unit</p>
            <p className="font-medium">{service.unit ?? "—"}</p>
          </div>
          {service.delivery_days != null && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Delivery (days)</p>
              <p className="font-medium">{service.delivery_days}</p>
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
          <p className="text-gray-600">{service.description}</p>
        </div>

        {proposals.length > 0 && (
          <div className="border-t pt-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Proposals using this service ({proposals.length})</p>
            <div className="space-y-2">
              {proposals.slice(0, 10).map((p) => {
                const svcEntry = p.servicesArray?.find((s) => s.id_service === id_service);
                return (
                  <div
                    key={p.id_proposal}
                    onClick={() => router.push(`/logged/pages/account-management/proposals/${p.id_proposal}`)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50/80 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{p.title}</p>
                      <p className="text-xs text-gray-500">{p.id_proposal} · {svcEntry?.price != null ? `${svcEntry.price} €` : ""}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      p.status === "accepted" ? "bg-green-100 text-green-800" :
                      p.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                    }`}>{p.status}</span>
                  </div>
                );
              })}
              {proposals.length > 10 && (
                <p className="text-sm text-gray-500">and {proposals.length - 10} more</p>
              )}
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <div className="border-t pt-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Projects ({projects.length})</p>
            <div className="space-y-2">
              {projects.slice(0, 10).map((p) => (
                <div
                  key={p.id_project}
                  onClick={() => router.push(`/logged/pages/production/projects/${p.id_project}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50/80 transition-colors"
                >
                  <p className="font-medium text-sm">{p.title}</p>
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-100">{p.status.replace("_", " ")}</span>
                </div>
              ))}
              {projects.length > 10 && (
                <p className="text-sm text-gray-500">and {projects.length - 10} more</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDetailPage;
