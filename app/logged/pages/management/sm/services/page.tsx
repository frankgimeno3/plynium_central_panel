"use client";

import React, { FC, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import servicesContentsData from "@/app/contents/servicesContents.json";

type ServiceContent = {
  id_service: string;
  name: string;
  display_name?: string;
  description: string;
  tariff_price_eur: number;
  unit?: string;
  delivery_days?: number;
};

const ServicesPage: FC = () => {
  const router = useRouter();
  const all = (servicesContentsData as ServiceContent[]).slice();
  const [filter, setFilter] = useState({ id: "", name: "", minPrice: "", maxPrice: "" });

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id) list = list.filter((s) => s.id_service.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.name) list = list.filter((s) => (s.display_name ?? s.name).toLowerCase().includes(filter.name.toLowerCase()));
    if (filter.minPrice !== "") {
      const min = Number(filter.minPrice);
      if (!Number.isNaN(min)) list = list.filter((s) => s.tariff_price_eur >= min);
    }
    if (filter.maxPrice !== "") {
      const max = Number(filter.maxPrice);
      if (!Number.isNaN(max)) list = list.filter((s) => s.tariff_price_eur <= max);
    }
    return list;
  }, [all, filter]);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="flex items-center justify-center gap-3 flex-wrap bg-blue-950/70 p-5 text-white">
        <p className="text-2xl">Services</p>
        <Link
          href="/logged/pages/management/sm/services/create"
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
        >
          Crear
        </Link>
      </div>

      <div className="flex flex-col w-full gap-4 p-12">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ID</label>
              <input
                type="text"
                value={filter.id}
                onChange={(e) => setFilter((f) => ({ ...f, id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by ID"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={filter.name}
                onChange={(e) => setFilter((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min price (€)</label>
              <input
                type="number"
                min={0}
                value={filter.minPrice}
                onChange={(e) => setFilter((f) => ({ ...f, minPrice: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max price (€)</label>
              <input
                type="number"
                min={0}
                value={filter.maxPrice}
                onChange={(e) => setFilter((f) => ({ ...f, maxPrice: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Max"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (€)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery (days)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((s) => (
                <tr
                  key={s.id_service}
                  onClick={() => router.push(`/logged/pages/management/sm/services/${s.id_service}`)}
                  className={rowClass}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.id_service}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {(s.display_name ?? s.name).replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{s.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.tariff_price_eur?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.unit ?? "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.delivery_days ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No services match the filters.</p>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
