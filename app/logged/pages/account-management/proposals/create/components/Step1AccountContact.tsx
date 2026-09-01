"use client";

import React, { FC, useMemo } from "react";
import Link from "next/link";
import type { Contact, Customer, ProposalForm } from "./types";

const outlineBtnClass =
  "inline-flex w-full items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:border-blue-950 hover:bg-blue-50/40 sm:w-auto";

type Props = {
  form: ProposalForm;
  setForm: React.Dispatch<React.SetStateAction<ProposalForm>>;
  customers: Customer[];
  contacts: Contact[];
  onOpenCustomerModal: () => void;
  onOpenMainContactModal: () => void;
  onOpenAdditionalContactModal: () => void;
  /** Called when the user types in the proposal title so auto-sync stops overwriting. */
  onProposalTitleUserEdit: () => void;
  canAdvance: boolean;
  onNext: () => void;
  onCreateContactFromProposal?: () => void | Promise<void>;
  createContactSaving?: boolean;
};

const Step1AccountContact: FC<Props> = ({
  form,
  setForm,
  customers,
  contacts,
  onOpenCustomerModal,
  onOpenMainContactModal,
  onOpenAdditionalContactModal,
  onProposalTitleUserEdit,
  canAdvance,
  onNext,
  onCreateContactFromProposal,
  createContactSaving = false,
}) => {
  const selectedCustomer = customers.find((c) => c.id_customer === form.id_customer);
  const selectedContact = contacts.find((c) => c.id_contact === form.id_contact);
  const contactsForAccount = useMemo(
    () => contacts.filter((c) => c.id_customer === form.id_customer),
    [contacts, form.id_customer]
  );
  const accountHasNoContacts = Boolean(form.id_customer) && contactsForAccount.length === 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="mb-3 text-sm font-semibold text-gray-700">1) Account selection</p>
        <div className="space-y-4">
          <label className="mb-1 block text-xs text-gray-600">Account (customer)</label>

          {form.id_customer && selectedCustomer ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-base font-semibold text-gray-900">{selectedCustomer.name}</p>
                  <p className="font-mono text-xs text-gray-500">{form.id_customer}</p>
                </div>
                <Link
                  href={`/logged/pages/account-management/customers_db/${encodeURIComponent(form.id_customer)}`}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-900"
                >
                  Open account
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 text-center">
              <p className="mb-3 text-sm text-gray-600">No account selected yet.</p>
              <button type="button" onClick={onOpenCustomerModal} className={outlineBtnClass}>
                Select account
              </button>
            </div>
          )}

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Account doesn&apos;t exist?</p>
              <Link href="/logged/pages/account-management/customers_db/create" className={outlineBtnClass}>
                Create account
              </Link>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Wrong company?</p>
              <button type="button" onClick={onOpenCustomerModal} className={outlineBtnClass}>
                Select another company
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="mb-3 text-sm font-semibold text-gray-700">1.2) Main contact for the proposal</p>
        <div className="space-y-4">
          <label className="mb-1 block text-xs text-gray-600">Contact</label>

          {!form.id_customer ? (
            <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              Select an account first to choose a contact.
            </p>
          ) : accountHasNoContacts && !form.id_contact ? (
            <div className="space-y-3">
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                This account has no contacts yet. Create one to use it as the main contact for this
                proposal.
              </p>
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 text-center">
                <p className="mb-3 text-sm text-gray-600">No main contact selected.</p>
                {onCreateContactFromProposal ? (
                  <button
                    type="button"
                    onClick={() => void onCreateContactFromProposal()}
                    disabled={createContactSaving}
                    className={`${outlineBtnClass} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {createContactSaving ? "Saving proposal…" : "Create contact"}
                  </button>
                ) : (
                  <button type="button" onClick={onOpenMainContactModal} className={outlineBtnClass}>
                    Select contact
                  </button>
                )}
              </div>
            </div>
          ) : form.id_contact && selectedContact ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2 text-sm">
                  <p className="text-base font-semibold text-gray-900">{selectedContact.name}</p>
                  <p className="font-mono text-xs text-gray-500">{form.id_contact}</p>
                  {selectedContact.role ? (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium text-gray-700">Role:</span> {selectedContact.role}
                    </p>
                  ) : null}
                  {selectedContact.email ? (
                    <p className="break-all text-xs text-gray-600">
                      <span className="font-medium text-gray-700">Email:</span> {selectedContact.email}
                    </p>
                  ) : null}
                  {selectedContact.phone ? (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium text-gray-700">Phone:</span> {selectedContact.phone}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/logged/pages/account-management/contacts_db/${encodeURIComponent(form.id_contact)}`}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-900"
                >
                  Open contact
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 text-center">
              <p className="mb-3 text-sm text-gray-600">No main contact selected.</p>
              <button type="button" onClick={onOpenMainContactModal} className={outlineBtnClass}>
                Select contact
              </button>
            </div>
          )}

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Wrong contact?</p>
              <button
                type="button"
                disabled={!form.id_customer}
                onClick={onOpenMainContactModal}
                className={`${outlineBtnClass} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Choose another contact
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Contact doesn&apos;t exist?</p>
              {onCreateContactFromProposal ? (
                <button
                  type="button"
                  onClick={() => void onCreateContactFromProposal()}
                  disabled={createContactSaving || !form.id_customer}
                  className={`${outlineBtnClass} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {createContactSaving ? "Saving proposal…" : "Create contact"}
                </button>
              ) : (
                <Link href="/logged/pages/account-management/contacts_db/create" className={outlineBtnClass}>
                  Create contact
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onOpenAdditionalContactModal}
            disabled={!form.id_customer}
            className="inline-flex items-center justify-center rounded-lg border-2 border-blue-800 bg-white px-4 py-2 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add additional contacts
          </button>
          {form.additionalContactIds.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {form.additionalContactIds.map((id) => {
                const c = contacts.find((x) => x.id_contact === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm text-gray-800"
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
                      className="rounded-full p-0.5 text-gray-500 hover:bg-gray-300 hover:text-gray-700 focus:outline-none"
                      aria-label="Remove contact"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <label className="mb-1 block text-xs text-gray-600">
          Proposal title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => {
            onProposalTitleUserEdit();
            setForm((f) => ({ ...f, title: e.target.value }));
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Glass facade installation"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-600">Creation date</label>
        <input
          type="date"
          value={form.proposal_date}
          onChange={(e) => setForm((f) => ({ ...f, proposal_date: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-600">Estimated expiration date</label>
        <input
          type="date"
          value={form.expiration_date}
          onChange={(e) => setForm((f) => ({ ...f, expiration_date: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-0.5 text-xs text-gray-500">Default: 2 months from creation. Validity of the proposal.</p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next: Products
        </button>
      </div>
    </div>
  );
};

export default Step1AccountContact;
