"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/PageContentContext";
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
};

const EXPORT_FIELD_OPTIONS: { key: keyof Contact; label: string }[] = [
  { key: "id_contact", label: "ID contacto" },
  { key: "name", label: "Nombre" },
  { key: "role", label: "Rol" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Teléfono" },
  { key: "id_customer", label: "ID cliente" },
  { key: "company_name", label: "Empresa" },
];

type ExportPhase = "config" | "loading" | "ready";

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const ExportContactsPage: FC = () => {
  const [phase, setPhase] = useState<ExportPhase>("config");
  const [selectedFields, setSelectedFields] = useState<Set<keyof Contact>>(
    new Set(["id_contact", "name", "role", "email", "phone", "company_name"])
  );
  const [restrictions, setRestrictions] = useState({
    id: "",
    name: "",
    role: "",
    company: "",
  });
  const [csvBlobUrl, setCsvBlobUrl] = useState<string | null>(null);

  const allContacts = useMemo(() => (contactsData as Contact[]).slice(), []);

  const filteredContacts = useMemo(() => {
    let list = [...allContacts];
    if (restrictions.id)
      list = list.filter((c) => c.id_contact.toLowerCase().includes(restrictions.id.toLowerCase()));
    if (restrictions.name)
      list = list.filter((c) => c.name.toLowerCase().includes(restrictions.name.toLowerCase()));
    if (restrictions.role)
      list = list.filter((c) => c.role?.toLowerCase().includes(restrictions.role.toLowerCase()));
    if (restrictions.company)
      list = list.filter((c) => c.company_name?.toLowerCase().includes(restrictions.company.toLowerCase()));
    return list;
  }, [allContacts, restrictions]);

  const toggleField = (key: keyof Contact) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleGenerate = () => {
    setPhase("loading");
    setCsvBlobUrl(null);
    // Simular generación
    setTimeout(() => {
      const fields = Array.from(selectedFields);
      const header = fields.map((f) => escapeCsvCell(f)).join(",");
      const rows = filteredContacts.map((c) =>
        fields.map((f) => escapeCsvCell(String(c[f] ?? ""))).join(",")
      );
      const csv = [header, ...rows].join("\r\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      setCsvBlobUrl(url);
      setPhase("ready");
    }, 1500);
  };

  const handleDownload = () => {
    if (!csvBlobUrl) return;
    const a = document.createElement("a");
    a.href = csvBlobUrl;
    a.download = `contactos_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const backUrl = "/logged/pages/account-management/contacts_db";

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Contacts DB", href: backUrl },
    { label: "Export" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Exportar contactos",
      breadcrumbs,
      buttons: [{ label: "Volver a Contactos", href: backUrl }],
    });
  }, [setPageMeta, breadcrumbs, backUrl]);

  return (
    <>
      <PageContentSection>
      <div className="max-w-2xl">
        {phase === "config" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Campos a incluir en el listado</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXPORT_FIELD_OPTIONS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFields.has(key)}
                      onChange={() => toggleField(key)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Restricciones (filtrar antes de exportar)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">ID</label>
                  <input
                    type="text"
                    value={restrictions.id}
                    onChange={(e) => setRestrictions((r) => ({ ...r, id: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Filtrar por ID"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={restrictions.name}
                    onChange={(e) => setRestrictions((r) => ({ ...r, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Filtrar por nombre"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Rol</label>
                  <input
                    type="text"
                    value={restrictions.role}
                    onChange={(e) => setRestrictions((r) => ({ ...r, role: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Filtrar por rol"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Empresa</label>
                  <input
                    type="text"
                    value={restrictions.company}
                    onChange={(e) => setRestrictions((r) => ({ ...r, company: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Filtrar por empresa"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Se exportarán <span className="font-medium">{filteredContacts.length}</span> contacto(s) con los
                filtros actuales.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={selectedFields.size === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generar exportación
            </button>
          </div>
        )}

        {phase === "loading" && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-700">Generando archivo...</p>
            <p className="text-sm text-gray-500 mt-1">Espere un momento.</p>
          </div>
        )}

        {phase === "ready" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Exportación lista</p>
            <p className="text-sm text-gray-600">
              Se han exportado <span className="font-medium">{filteredContacts.length}</span> contacto(s) con los
              campos seleccionados.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Descargar
              </button>
              <Link
                href={backUrl}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors inline-block"
              >
                Volver a Contactos
              </Link>
            </div>
          </div>
        )}
      </div>
      </PageContentSection>
    </>
  );
};

export default ExportContactsPage;
