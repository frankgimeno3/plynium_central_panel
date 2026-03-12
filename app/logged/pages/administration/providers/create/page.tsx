"use client";

import React, { FC, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import type { Provider } from "@/app/contents/interfaces";

type FormState = Pick<Provider, "id_provider" | "name" | "contact_email" | "contact_phone" | "address" | "tax_id" | "notes">;

const initialForm: FormState = {
  id_provider: "",
  name: "",
  contact_email: "",
  contact_phone: "",
  address: "",
  tax_id: "",
  notes: "",
};

const CreateProviderPage: FC = () => {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);

  const breadcrumbs = [
    { label: "Administration", href: "/logged/pages/administration" },
    { label: "Providers", href: "/logged/pages/administration/providers" },
    { label: "Create provider" },
  ];

  const backUrl = "/logged/pages/administration/providers";

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Create provider",
      breadcrumbs,
      buttons: [{ label: "Back to Providers", href: backUrl }],
    });
  }, [setPageMeta, breadcrumbs, backUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a full implementation this would POST to an API; for static JSON we redirect to list.
    router.push(backUrl);
  };

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">New provider</h2>
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Provider ID</label>
            <input
              type="text"
              value={form.id_provider}
              onChange={update("id_provider")}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. prov-004"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={update("name")}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provider name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contact email</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={update("contact_email")}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contact@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contact phone</label>
            <input
              type="text"
              value={form.contact_phone}
              onChange={update("contact_phone")}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+34 900 000 000"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={update("address")}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full address"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tax ID</label>
            <input
              type="text"
              value={form.tax_id}
              onChange={update("tax_id")}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VAT / CIF"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={update("notes")}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create provider
            </button>
            <button
              type="button"
              onClick={() => router.push(backUrl)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default CreateProviderPage;
