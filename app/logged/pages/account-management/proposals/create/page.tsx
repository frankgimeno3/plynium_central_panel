"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import CustomerSelectModal from "@/app/logged/logged_components/modals/CustomerSelectModal";
import ContactSelectModal from "@/app/logged/logged_components/modals/ContactSelectModal";
import ServiceSelectModal from "@/app/logged/logged_components/modals/ServiceSelectModal";
import type { ServiceRow, ServiceExtra } from "@/app/logged/logged_components/modals/ServiceSelectModal";
import { ServiceService } from "@/app/service/ServiceService";
import { CustomerService } from "@/app/service/CustomerService";
import { ContactService } from "@/app/service/ContactService";

import Step1AccountContact from "./components/Step1AccountContact";
import Step2Products from "./components/Step2Products";
import Step3Payment from "./components/Step3Payment";
import Step4Review from "./components/Step4Review";
import type { Contact, Customer, ProposalForm, Service, ServiceLine, Step } from "./components/types";

const CreateProposalPage: FC = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  useEffect(() => {
    ServiceService.getAllServices().then((list) => setServices(Array.isArray(list) ? list : [])).catch(() => setServices([]));
  }, []);
  useEffect(() => {
    CustomerService.getAllCustomers().then((l: Customer[]) => setCustomers(Array.isArray(l) ? l : [])).catch(() => setCustomers([]));
    ContactService.getAllContacts().then((l: Contact[]) => setContacts(Array.isArray(l) ? l : [])).catch(() => setContacts([]));
  }, []);
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<ProposalForm>({
    id_customer: "",
    id_contact: "",
    additionalContactIds: [],
    title: "",
    proposal_date: new Date().toISOString().slice(0, 10),
    expiration_date: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 2);
      return d.toISOString().slice(0, 10);
    })(),
    serviceLines: [],
    general_discount_mode: "pct",
    general_discount_pct: 0,
    general_discount_abs_eur: 0,
    payments: [],
    isExchange: false,
    exchangeHasFinalPrice: false,
    exchangeFinalPrice: 0,
    exchangeHasBankTransfers: false,
    exchangePlyniumTransferDate: "",
    exchangeCounterpartDate: "",
    exchangeTransferredAmount: 0,
    exchangeToBeReceivedHtml: "",
  });
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [additionalContactModalOpen, setAdditionalContactModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState<number>(0);
  const [plyniumAgentName, setPlyniumAgentName] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPlyniumAgentName(localStorage.getItem("username") ?? "");
    }
  }, []);

  const contactsForCustomer = useMemo(
    () => contacts.filter((c) => c.id_customer === form.id_customer),
    [form.id_customer]
  );

  const canAdvanceStep1 = form.id_customer && form.id_contact && form.title.trim().length > 0;
  const canAdvanceStep2 = form.serviceLines.length > 0;

  const goNext = () => {
    if (step === 1 && canAdvanceStep1) setStep(2);
    else if (step === 2 && canAdvanceStep2) setStep(3);
    else if (step === 3 && canAdvanceStep3) setStep(4);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const selectedCustomer = customers.find((c) => c.id_customer === form.id_customer);
  const selectedContact = contacts.find((c) => c.id_contact === form.id_contact);
  const getServiceName = (id: string) => services.find((s) => s.id_service === id)?.display_name ?? services.find((s) => s.id_service === id)?.name ?? id;

  const totalBeforeDiscount = form.serviceLines.reduce((sum, l) => {
    const lineTotal = l.units * l.price * (1 - l.discount_pct / 100);
    return sum + lineTotal;
  }, 0);
  const totalPreTax =
    form.general_discount_mode === "abs"
      ? Math.max(0, totalBeforeDiscount - (Number(form.general_discount_abs_eur) || 0))
      : totalBeforeDiscount * (1 - (Number(form.general_discount_pct) || 0) / 100);
  const isSpain = (selectedCustomer?.country ?? "").toLowerCase() === "spain";
  const vatPct = isSpain ? 21 : 0;
  const totalAfterTax = totalPreTax * (1 + vatPct / 100);
  const paymentsSum = form.payments.reduce((s, p) => s + p.amount, 0);
  const paymentsMatchTotal = form.payments.length > 0 && Math.abs(paymentsSum - totalAfterTax) < 0.01;
  const canAdvanceStep3 = form.isExchange || paymentsMatchTotal;

  const backUrl = "/logged/pages/account-management/proposals";

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Proposals", href: backUrl },
    { label: "New proposal" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "New proposal",
      breadcrumbs,
      buttons: [{ label: "Back", href: backUrl }],
    });
  }, [setPageMeta, breadcrumbs, backUrl]);

  return (
    <>
      <PageContentSection className="p-0">
      <div className="flex flex-col w-full">
      <div className="flex border-b border-gray-200 bg-gray-50 px-6 py-4">
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
            {step === 1 && "Account and contact"}
            {step === 2 && "Products"}
            {step === 3 && "Payment"}
            {step === 4 && "Review"}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-b-lg overflow-hidden p-12 w-full">
        {step === 1 && (
          <Step1AccountContact
            form={form}
            setForm={setForm}
            customers={customers}
            contacts={contacts}
            onOpenCustomerModal={() => setCustomerModalOpen(true)}
            onOpenMainContactModal={() => form.id_customer && setContactModalOpen(true)}
            onOpenAdditionalContactModal={() => form.id_customer && setAdditionalContactModalOpen(true)}
            canAdvance={!!canAdvanceStep1}
            onNext={goNext}
          />
        )}

        {step === 2 && (
          <Step2Products
            form={form}
            setForm={setForm}
            services={services}
            selectedCustomer={selectedCustomer}
            getServiceName={getServiceName}
            totalBeforeDiscount={totalBeforeDiscount}
            totalPreTax={totalPreTax}
            totalAfterTax={totalAfterTax}
            vatPct={vatPct}
            onBack={goBack}
            onNext={goNext}
            canAdvance={!!canAdvanceStep2}
            onOpenServiceModalAt={(index) => {
              setInsertAtIndex(index);
              setServiceModalOpen(true);
            }}
          />
        )}

        {step === 3 && (
          <Step3Payment
            form={form}
            setForm={setForm}
            totalAfterTax={totalAfterTax}
            paymentsSum={paymentsSum}
            paymentsMatchTotal={paymentsMatchTotal}
            onBack={goBack}
            onNext={goNext}
            canAdvance={!!canAdvanceStep3}
          />
        )}

        {step === 4 && (
          <Step4Review
            form={form}
            customers={customers}
            contacts={contacts}
            plyniumAgentName={plyniumAgentName}
            getServiceName={getServiceName}
            totalBeforeDiscount={totalBeforeDiscount}
            totalPreTax={totalPreTax}
            totalAfterTax={totalAfterTax}
            vatPct={vatPct}
            paymentsSum={paymentsSum}
            paymentsMatchTotal={paymentsMatchTotal}
            onBack={goBack}
            onCreate={() => router.push(backUrl)}
          />
        )}
      </div>
      </div>
      </PageContentSection>

      <CustomerSelectModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSelectCustomer={(c) => {
          setForm((f) => ({ ...f, id_customer: c.id_customer, id_contact: "" }));
          setCustomerModalOpen(false);
        }}
      />
      <ContactSelectModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        onSelectContact={(c) => {
          setForm((f) => ({
            ...f,
            id_contact: c.id_contact,
            additionalContactIds: f.additionalContactIds.filter((id) => id !== c.id_contact),
          }));
          setContactModalOpen(false);
        }}
        filterByCustomerId={form.id_customer || undefined}
      />
      <ContactSelectModal
        open={additionalContactModalOpen}
        onClose={() => setAdditionalContactModalOpen(false)}
        onSelectContact={(c) => {
          setForm((f) => ({
            ...f,
            additionalContactIds: f.additionalContactIds.includes(c.id_contact)
              ? f.additionalContactIds
              : [...f.additionalContactIds, c.id_contact],
          }));
          setAdditionalContactModalOpen(false);
        }}
        filterByCustomerId={form.id_customer || undefined}
        excludeContactIds={[form.id_contact, ...form.additionalContactIds].filter(Boolean)}
      />
      <ServiceSelectModal
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onConfirm={(service: ServiceRow, extra?: ServiceExtra) => {
          const price = service.tariff_price_eur;
          const newLine: ServiceLine = {
            lineId: `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            id_service: service.id_service,
            description: service.description ?? "",
            specifications: "",
            units: 1,
            discount_pct: 0,
            price,
            ...(extra && "publicationMonth" in extra && { publicationMonth: extra.publicationMonth, publicationYear: extra.publicationYear }),
            ...(extra && "startDate" in extra && { startDate: extra.startDate, endDate: extra.endDate }),
            ...(extra && "id_planned_publication" in extra && {
              id_planned_publication: extra.id_planned_publication,
              ...("pageType" in extra && { magazinePageType: extra.pageType, magazineSlotKey: extra.slotKey }),
            }),
          };
          if (extra && "calculatedPrice" in extra) (newLine as ServiceLine).price = extra.calculatedPrice;
          setForm((f) => ({
            ...f,
            serviceLines: [
              ...f.serviceLines.slice(0, insertAtIndex),
              newLine,
              ...f.serviceLines.slice(insertAtIndex),
            ],
          }));
          setServiceModalOpen(false);
        }}
      />
    </>
  );
};

export default CreateProposalPage;
