"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import customersData from "@/app/contents/customers.json";

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
  comments: unknown[];
  proposals: string[];
  contracts: string[];
  projects: string[];
};

const CustomersDbPage: FC = () => {
  const router = useRouter();
  const all = (customersData as Customer[]).slice();
  const [filter, setFilter] = useState({ id: "", name: "", cif: "", country: "" });

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id) list = list.filter((c) => c.id_customer.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.name) list = list.filter((c) => c.name.toLowerCase().includes(filter.name.toLowerCase()));
    if (filter.cif) list = list.filter((c) => c.cif?.toLowerCase().includes(filter.cif.toLowerCase()));
    if (filter.country) list = list.filter((c) => c.country?.toLowerCase().includes(filter.country.toLowerCase()));
    return list;
  }, [all, filter]);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Customers DB" },
  ];

  const buttons = [
    { label: "New account", href: "/logged/pages/account-management/customers_db/create" },
    { label: "Import", href: "/logged/pages/account-management/customers_db/mass-ops/import" },
    { label: "Export", href: "/logged/pages/account-management/customers_db/mass-ops/export" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Customers DB", breadcrumbs, buttons });
  }, [setPageMeta]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
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
                placeholder="Search by company name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">CIF</label>
              <input
                type="text"
                value={filter.cif}
                onChange={(e) => setFilter((f) => ({ ...f, cif: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by CIF"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Country</label>
              <input
                type="text"
                value={filter.country}
                onChange={(e) => setFilter((f) => ({ ...f, country: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by country"
              />
            </div>
          </div>

        <div className="overflow-x-auto mt-6">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CIF</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposals</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contracts</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((c) => (
              <tr
                key={c.id_customer}
                onClick={() => router.push(`/logged/pages/account-management/customers_db/${c.id_customer}`)}
                className={rowClass}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.id_customer}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.cif}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.country}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{c.contact?.name} ({c.contact?.role})</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.proposals || []).length}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.contracts || []).length}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.projects || []).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default CustomersDbPage;
