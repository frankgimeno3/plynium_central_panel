"use client";

import React, { FC, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageContentLayout from "@/app/logged/logged_components/PageContentLayout";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import contactsData from "@/app/contents/contactsContents.json";

type Contact = {
  id_contact: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  id_customer?: string;
  company_name?: string;
  comments?: unknown[];
};

const ContactsDbPage: FC = () => {
  const router = useRouter();
  const all = (contactsData as Contact[]).slice();
  const [filter, setFilter] = useState({ id: "", name: "", role: "", company: "" });

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id) list = list.filter((c) => c.id_contact.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.name) list = list.filter((c) => c.name.toLowerCase().includes(filter.name.toLowerCase()));
    if (filter.role) list = list.filter((c) => c.role?.toLowerCase().includes(filter.role.toLowerCase()));
    if (filter.company) list = list.filter((c) => c.company_name?.toLowerCase().includes(filter.company.toLowerCase()));
    return list;
  }, [all, filter]);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Contacts DB" },
  ];

  const buttons = [
    { label: "Nuevo contacto", href: "/logged/pages/account-management/contacts_db/create" },
    { label: "Import", href: "/logged/pages/account-management/contacts_db/mass-ops/import" },
    { label: "Export", href: "/logged/pages/account-management/contacts_db/mass-ops/export" },
  ];

  return (
    <PageContentLayout pageTitle="Contacts DB" breadcrumbs={breadcrumbs} buttons={buttons}>
      <PageContentSection>
        <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
            <div className="min-w-0">
              <label className="block text-xs text-gray-600 mb-1">ID</label>
              <input
                type="text"
                value={filter.id}
                onChange={(e) => setFilter((f) => ({ ...f, id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by ID"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={filter.name}
                onChange={(e) => setFilter((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-xs text-gray-600 mb-1">Role</label>
              <input
                type="text"
                value={filter.role}
                onChange={(e) => setFilter((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by role"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-xs text-gray-600 mb-1">Company</label>
              <input
                type="text"
                value={filter.company}
                onChange={(e) => setFilter((f) => ({ ...f, company: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by company"
              />
            </div>
          </div>
      </PageContentSection>

      <PageContentSection>
        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((c) => (
                <tr
                  key={c.id_contact}
                  onClick={() => router.push(`/logged/pages/account-management/contacts_db/${c.id_contact}`)}
                  className={rowClass}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.id_contact}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.role}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{c.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.company_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageContentSection>
    </PageContentLayout>
  );
};

export default ContactsDbPage;
