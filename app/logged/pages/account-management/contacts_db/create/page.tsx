"use client";

import React, { FC, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

const CreateContactPage: FC = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    id_contact: "",
    name: "",
    role: "",
    email: "",
    phone: "",
    id_customer: "",
    company_name: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No real action: just navigate back
    router.push("/logged/pages/account-management/contacts_db");
  };

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Contacts DB", href: "/logged/pages/account-management/contacts_db" },
    { label: "New contact" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "New contact",
      breadcrumbs,
      buttons: [{ label: "← Back", href: "/logged/pages/account-management/contacts_db" }],
    });
  }, [setPageMeta, breadcrumbs]);

  return (
    <>
      <PageContentSection>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Contact ID</label>
            <input
              type="text"
              name="id_contact"
              value={form.id_contact}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ej. cont-006"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Rol</label>
            <input
              type="text"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ej. Directora Comercial"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@empresa.com"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+34 912 345 678"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">ID cliente</label>
            <input
              type="text"
              name="id_customer"
              value={form.id_customer}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ej. cust-001"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Empresa</label>
            <input
              type="text"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Company name"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Create contact
            </button>
            <button
              type="button"
              onClick={() => router.push("/logged/pages/account-management/contacts_db")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </PageContentSection>
    </>
  );
};

export default CreateContactPage;
