"use client";

import React, { FC, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageContentLayout from "@/app/logged/logged_components/PageContentLayout";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import customersData from "@/app/contents/customers.json";
import contactsData from "@/app/contents/contactsContents.json";
import servicesData from "@/app/contents/servicesContents.json";

type Customer = { id_customer: string; name: string; contact?: { name: string; role: string; email: string; phone: string } };
type Contact = { id_contact: string; name: string; role?: string; email: string; phone: string; id_customer?: string; company_name?: string };
type Service = { id_service: string; name: string; display_name?: string; description: string; tariff_price_eur: number; unit?: string };

type Step = 1 | 2 | 3 | 4;

type ProposalForm = {
  id_customer: string;
  id_contact: string;
  title: string;
  selectedServiceIds: string[];
  serviceLines: { id_service: string; price: number; discount_pct: number; description: string }[];
  general_discount_pct: number;
};

const customers = customersData as Customer[];
const contacts = contactsData as Contact[];
const services = servicesData as Service[];

const CreateProposalPage: FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<ProposalForm>({
    id_customer: "",
    id_contact: "",
    title: "",
    selectedServiceIds: [],
    serviceLines: [],
    general_discount_pct: 0,
  });

  const contactsForCustomer = useMemo(
    () => contacts.filter((c) => c.id_customer === form.id_customer),
    [form.id_customer]
  );

  const canAdvanceStep1 = form.id_customer && form.id_contact;
  const canAdvanceStep2 = form.selectedServiceIds.length > 0;
  const canAdvanceStep3 = form.serviceLines.every((l) => l.price >= 0);

  const goNext = () => {
    if (step === 1 && canAdvanceStep1) {
      setStep(2);
    } else if (step === 2 && canAdvanceStep2) {
      setForm((f) => ({
        ...f,
        serviceLines: f.selectedServiceIds.map((id) => {
          const existing = f.serviceLines.find((l) => l.id_service === id);
          const svc = services.find((s) => s.id_service === id);
          return (
            existing ?? {
              id_service: id,
              price: svc?.tariff_price_eur ?? 0,
              discount_pct: 0,
              description: "",
            }
          );
        }),
      }));
      setStep(3);
    } else if (step === 3 && canAdvanceStep3) setStep(4);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const subtotal = form.serviceLines.reduce((sum, l) => {
    const afterUnit = l.price * (1 - l.discount_pct / 100);
    return sum + afterUnit;
  }, 0);
  const totalAfterGeneral = subtotal * (1 - form.general_discount_pct / 100);

  const selectedCustomer = customers.find((c) => c.id_customer === form.id_customer);
  const selectedContact = contacts.find((c) => c.id_contact === form.id_contact);
  const getServiceName = (id: string) => services.find((s) => s.id_service === id)?.display_name ?? services.find((s) => s.id_service === id)?.name ?? id;

  const backUrl = "/logged/pages/account-management/proposals";

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Proposals", href: backUrl },
    { label: "Nueva propuesta" },
  ];

  return (
    <PageContentLayout
      pageTitle="Nueva propuesta"
      breadcrumbs={breadcrumbs}
      buttons={[{ label: "Volver", href: backUrl }]}
    >
      <PageContentSection className="p-0">
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <React.Fragment key={s}>
              <button
                type="button"
                onClick={() => s < step && setStep(s)}
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                  step === s ? "bg-blue-600 text-white" : step > s ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-500"
                } ${step > s ? "cursor-pointer" : ""}`}
              >
                {s}
              </button>
              {s < 4 && <span className="w-8 h-0.5 bg-gray-300" />}
            </React.Fragment>
          ))}
          <span className="text-sm text-gray-600 ml-2">
            {step === 1 && "Cuenta y contacto"}
            {step === 2 && "Productos"}
            {step === 3 && "Precios y descuentos"}
            {step === 4 && "Revisión"}
          </span>
        </div>
      </div>

      <div className="p-12 w-full">
        {/* Step 1: Account + contact */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">1) Selección de cuenta</p>
              <div className="space-y-2">
                <label className="block text-xs text-gray-600 mb-1">Cuenta (cliente)</label>
                <select
                  value={form.id_customer}
                  onChange={(e) => setForm((f) => ({ ...f, id_customer: e.target.value, id_contact: "" }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar cuenta</option>
                  {customers.map((c) => (
                    <option key={c.id_customer} value={c.id_customer}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  ¿No existe la cuenta?{" "}
                  <Link href="/logged/pages/account-management/customers_db/create" className="text-blue-600 hover:underline">
                    Crear cuenta
                  </Link>
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">1.2) Contacto en la propuesta</p>
              <div className="space-y-2">
                <label className="block text-xs text-gray-600 mb-1">Contacto</label>
                <select
                  value={form.id_contact}
                  onChange={(e) => setForm((f) => ({ ...f, id_contact: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!form.id_customer}
                >
                  <option value="">Seleccionar contacto</option>
                  {contactsForCustomer.map((c) => (
                    <option key={c.id_contact} value={c.id_contact}>{c.name} {c.role ? `(${c.role})` : ""}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  ¿No existe el contacto?{" "}
                  <Link href="/logged/pages/account-management/contacts_db/create" className="text-blue-600 hover:underline">
                    Crear contacto
                  </Link>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Título de la propuesta</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej. Instalación cristalería fachada"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvanceStep1}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente: Productos
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Products */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">2) Selección de productos (servicios)</p>
              <div className="space-y-2">
                {services.map((s) => (
                  <label key={s.id_service} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={form.selectedServiceIds.includes(s.id_service)}
                      onChange={() => {
                        setForm((f) => ({
                          ...f,
                          selectedServiceIds: f.selectedServiceIds.includes(s.id_service)
                            ? f.selectedServiceIds.filter((id) => id !== s.id_service)
                            : [...f.selectedServiceIds, s.id_service],
                        }));
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">{(s.display_name ?? s.name).replace(/_/g, " ")}</span>
                    <span className="text-xs text-gray-500">({s.id_service}) — {s.tariff_price_eur} €</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={goBack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                Atrás
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvanceStep2}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente: Precios y descuentos
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Prices & discounts */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-semibold text-gray-700 mb-4">3) Asignación de precios, descuentos unitarios y descuento general</p>
              <div className="space-y-4">
                {form.serviceLines.map((line) => (
                  <div key={line.id_service} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-b border-gray-100 pb-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Servicio</label>
                      <p className="text-sm font-medium">{getServiceName(line.id_service)}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Precio (€)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={line.price}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setForm((f) => ({
                            ...f,
                            serviceLines: f.serviceLines.map((l) =>
                              l.id_service === line.id_service ? { ...l, price: Number.isNaN(v) ? 0 : v } : l
                            ),
                          }));
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Descuento unitario (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={line.discount_pct}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setForm((f) => ({
                            ...f,
                            serviceLines: f.serviceLines.map((l) =>
                              l.id_service === line.id_service ? { ...l, discount_pct: Number.isNaN(v) ? 0 : v } : l
                            ),
                          }));
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs text-gray-600 mb-1">Descripción (opcional)</label>
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => {
                          setForm((f) => ({
                            ...f,
                            serviceLines: f.serviceLines.map((l) =>
                              l.id_service === line.id_service ? { ...l, description: e.target.value } : l
                            ),
                          }));
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Descripción para esta línea"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-xs text-gray-600 mb-1">Descuento general sobre el total (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={form.general_discount_pct}
                  onChange={(e) => setForm((f) => ({ ...f, general_discount_pct: Number(e.target.value) || 0 }))}
                  className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={goBack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                Atrás
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvanceStep3}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente: Revisión
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-sm font-semibold text-gray-700 mb-4">4) Revisión general de la propuesta</p>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Cuenta</dt>
                  <dd className="font-medium">{(selectedCustomer?.name ?? form.id_customer) || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Contacto</dt>
                  <dd className="font-medium">{(selectedContact?.name ?? form.id_contact) || "—"} {selectedContact?.email ? `(${selectedContact.email})` : ""}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Título</dt>
                  <dd className="font-medium">{form.title || "—"}</dd>
                </div>
              </dl>
              <table className="mt-4 w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Servicio</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Precio</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Desc. %</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {form.serviceLines.map((line) => {
                    const net = line.price * (1 - line.discount_pct / 100);
                    return (
                      <tr key={line.id_service}>
                        <td className="px-4 py-2">{getServiceName(line.id_service)}</td>
                        <td className="px-4 py-2 text-right">{line.price} €</td>
                        <td className="px-4 py-2 text-right">{line.discount_pct}%</td>
                        <td className="px-4 py-2 text-right">{net.toFixed(2)} €</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-6 text-sm">
                <span>Subtotal: <strong>{subtotal.toFixed(2)} €</strong></span>
                <span>Descuento general {form.general_discount_pct}%: <strong>{totalAfterGeneral.toFixed(2)} €</strong></span>
              </div>
              <p className="mt-2 text-right text-lg font-semibold">Total: {totalAfterGeneral.toFixed(2)} €</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={goBack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                Atrás
              </button>
              <button
                type="button"
                onClick={() => router.push(backUrl)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Crear propuesta
              </button>
            </div>
          </div>
        )}
      </div>
      </PageContentSection>
    </PageContentLayout>
  );
};

export default CreateProposalPage;
