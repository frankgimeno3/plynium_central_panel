"use client";

import React, { FC, useState, useMemo, useEffect, useCallback } from "react";
import { ContactService } from "@/app/service/ContactService";
import { ContactSelectFilters } from "./modal_contact_select_components/ContactSelectFilters";
import { ContactSelectTable } from "./modal_contact_select_components/ContactSelectTable";
import {
  CONTACT_SELECT_PAGE_SIZE,
  type ContactFilterState,
  type ContactRow,
  type ContactSelectModalProps,
} from "./modal_contact_select_components/types";

export type { ContactRow } from "./modal_contact_select_components/types";

const ContactSelectModal: FC<ContactSelectModalProps> = ({
  open,
  onClose,
  onSelectContact,
  filterByCustomerId,
  excludeContactIds,
}) => {
  const [allContacts, setAllContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactRow | null>(null);
  const [filter, setFilter] = useState<ContactFilterState>({ id: "", name: "", role: "", company: "" });
  const [currentPage, setCurrentPage] = useState(1);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await ContactService.getAllContacts();
      setAllContacts(Array.isArray(list) ? list.filter((c) => c && typeof c.id_contact === "string") : []);
    } catch {
      setAllContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadContacts();
  }, [open, loadContacts]);

  const excludedSet = useMemo(() => new Set(excludeContactIds ?? []), [excludeContactIds]);

  const filtered = useMemo(() => {
    let list = [...allContacts];
    if (filterByCustomerId) list = list.filter((c) => c.id_customer === filterByCustomerId);
    if (excludedSet.size > 0) list = list.filter((c) => !excludedSet.has(c.id_contact));
    if (filter.id) list = list.filter((c) => c.id_contact.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.name) list = list.filter((c) => (c.name || "").toLowerCase().includes(filter.name.toLowerCase()));
    if (filter.role) list = list.filter((c) => (c.role || "").toLowerCase().includes(filter.role.toLowerCase()));
    if (filter.company) list = list.filter((c) => (c.company_name || "").toLowerCase().includes(filter.company.toLowerCase()));
    return list;
  }, [allContacts, filter, filterByCustomerId, excludedSet]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / CONTACT_SELECT_PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * CONTACT_SELECT_PAGE_SIZE;
    return filtered.slice(start, start + CONTACT_SELECT_PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    if (!open) {
      setSelectedContact(null);
      setFilter({ id: "", name: "", role: "", company: "" });
      setCurrentPage(1);
    }
  }, [open]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter.id, filter.name, filter.role, filter.company, filterByCustomerId, excludeContactIds]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleConfirm = () => {
    if (!selectedContact) return;
    onSelectContact(selectedContact);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-select-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="contact-select-modal-title" className="text-xl font-bold text-gray-800">
            Select contact account
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
          <p className="text-sm text-gray-600">Filter and select a contact account.</p>
          <ContactSelectFilters filter={filter} onFilterChange={setFilter} />
          <ContactSelectTable
            loading={loading}
            paginated={paginated}
            selectedContact={selectedContact}
            onPick={setSelectedContact}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  aria-label="Previous page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  aria-label="Next page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedContact}
              className="px-4 py-2 rounded-xl bg-blue-950 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900"
            >
              Select account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSelectModal;
