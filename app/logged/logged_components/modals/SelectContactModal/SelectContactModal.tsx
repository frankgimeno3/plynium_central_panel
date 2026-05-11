"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ContactService } from "@/app/service/ContactService";
import SelectContactModalPanel from "./modal_select_contact_components/SelectContactModalPanel";
import type { ContactFilterState, ContactRow, SelectContactModalProps } from "./modal_select_contact_components/types";

export default function SelectContactModal({ open, onClose, onConfirm }: SelectContactModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<ContactFilterState>({ id: "", name: "", email: "" });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSelectedId("");
    ContactService.getAllContacts()
      .then((list) => setContacts(Array.isArray(list) ? (list as ContactRow[]) : []))
      .catch((e: unknown) => {
        const message =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Error loading contacts";
        setError(message);
        setContacts([]);
      })
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const idQ = filter.id.trim().toLowerCase();
    const nameQ = filter.name.trim().toLowerCase();
    const emailQ = filter.email.trim().toLowerCase();
    return contacts.filter((contact) => {
      const cid = String(contact.id_contact ?? "").toLowerCase();
      const name = String(contact.name ?? "").toLowerCase();
      const email = String(contact.email ?? "").toLowerCase();
      return (
        (!idQ || cid.includes(idQ)) &&
        (!nameQ || name.includes(nameQ)) &&
        (!emailQ || email.includes(emailQ))
      );
    });
  }, [contacts, filter]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return contacts.find((contact) => contact.id_contact === selectedId) ?? null;
  }, [contacts, selectedId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <SelectContactModalPanel
        filter={filter}
        error={error}
        loading={loading}
        filtered={filtered}
        selectedId={selectedId}
        selected={selected}
        onClose={onClose}
        onFilterChange={setFilter}
        onSelectId={setSelectedId}
        onConfirm={() => {
          if (selected) onConfirm(selected);
        }}
      />
    </div>
  );
}
