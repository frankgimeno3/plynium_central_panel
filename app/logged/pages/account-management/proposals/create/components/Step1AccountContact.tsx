"use client";

import React, { FC } from "react";
import Link from "next/link";
import type { Contact, Customer, ProposalForm } from "./types";

type Props = {
  form: ProposalForm;
  setForm: React.Dispatch<React.SetStateAction<ProposalForm>>;
  customers: Customer[];
  contacts: Contact[];
  onOpenCustomerModal: () => void;
  onOpenMainContactModal: () => void;
  onOpenAdditionalContactModal: () => void;
  canAdvance: boolean;
  onNext: () => void;
};

const Step1AccountContact: FC<Props> = ({
  form,
  setForm,
  customers,
  contacts,
  onOpenCustomerModal,
  onOpenMainContactModal,
  onOpenAdditionalContactModal,
  canAdvance,
  onNext,
}) => {
  const selectedCustomer = customers.find((c) => c.id_customer === form.id_customer);
  const selectedContact = contacts.find((c) => c.id_contact === form.id_contact);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">1) Account selection</p>
        <div className="space-y-2">
          <label className="block text-xs text-gray-600 mb-1">Account (customer)</label>
          <button
            type="button"
            onClick={onOpenCustomerModal}
            className={`w-full px-4 py-2 border-2 rounded-lg text-sm font-medium transition-colors ${
              form.id_customer
                ? "border-blue-800 bg-blue-800 text-white hover:bg-blue-900 hover:border-blue-900"
                : "border-dashed border-gray-300 text-gray-700 hover:border-blue-950 hover:bg-blue-50/30"
            }`}
          >
            {form.id_customer ? (selectedCustomer?.name ?? form.id_customer) : "Select account"}
          </button>
          <p className="text-xs text-gray-500">
            Account doesn&apos;t exist?{" "}
            <Link href="/logged/pages/account-management/customers_db/create" className="text-blue-600 hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">1.2) Main contact for the proposal</p>
        <div className="space-y-2">
          <label className="block text-xs text-gray-600 mb-1">Contact</label>
          <button
            type="button"
            onClick={onOpenMainContactModal}
            disabled={!form.id_customer}
            className={`w-full px-4 py-2 border-2 rounded-lg text-sm font-medium transition-colors ${
              !form.id_customer
                ? "border-dashed border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                : form.id_contact
                  ? "border-blue-800 bg-blue-800 text-white hover:bg-blue-900 hover:border-blue-900"
                  : "border-dashed border-gray-300 text-gray-700 hover:border-blue-950 hover:bg-blue-50/30"
            }`}
          >
            {form.id_contact ? (selectedContact?.name ?? form.id_contact) : "Select contact"}
          </button>
          <p className="text-xs text-gray-500">
            Contact doesn&apos;t exist?{" "}
            <Link href="/logged/pages/account-management/contacts_db/create" className="text-blue-600 hover:underline">
              Create contact
            </Link>
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onOpenAdditionalContactModal}
            disabled={!form.id_customer}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add additional contacts
          </button>
          {form.additionalContactIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {form.additionalContactIds.map((id) => {
                const c = contacts.find((x) => x.id_contact === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-sm text-gray-800"
                  >
                    {c?.name ?? id}
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          additionalContactIds: f.additionalContactIds.filter((x) => x !== id),
                        }))
                      }
                      className="p-0.5 rounded-full hover:bg-gray-300 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label="Remove contact"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Proposal title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Glass facade installation"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Creation date</label>
        <input
          type="date"
          value={form.proposal_date}
          onChange={(e) => setForm((f) => ({ ...f, proposal_date: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Estimated expiration date</label>
        <input
          type="date"
          value={form.expiration_date}
          onChange={(e) => setForm((f) => ({ ...f, expiration_date: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-0.5">Default: 2 months from creation. Validity of the proposal.</p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Products
        </button>
      </div>
    </div>
  );
};

export default Step1AccountContact;

