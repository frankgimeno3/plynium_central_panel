"use client";

import React, { FC, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import servicesData from "@/app/contents/services.json";

type Service = {
  id_service: string;
  name: string;
  tariff_price_eur: number;
  publication_date?: string;
};

const ServiceDetailPage: FC<{ params: Promise<{ id_service: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_service } = use(params);
  const service = (servicesData as Service[]).find((s) => s.id_service === id_service);

  if (!service) {
    return (
      <div className="flex flex-col w-full p-12">
        <p className="text-gray-500">Service not found.</p>
        <Link href="/logged/pages/contents/services" className="text-blue-600 hover:underline mt-4">
          ← Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <div className="text-center bg-blue-950/70 p-5 text-white flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/logged/pages/contents/services")}
          className="text-white/90 hover:text-white text-sm"
        >
          ← Back
        </button>
        <p className="text-2xl">Service: {service.name?.replace(/_/g, " ")}</p>
      </div>

      <div className="p-12 max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">ID</p>
            <p className="font-medium">{service.id_service}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Name</p>
            <p className="font-medium">{service.name?.replace(/_/g, " ")}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Tariff price (€)</p>
            <p className="font-medium">{service.tariff_price_eur?.toLocaleString()}</p>
          </div>
          {"publication_date" in service && service.publication_date && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Publication date</p>
              <p className="font-medium">{service.publication_date}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
