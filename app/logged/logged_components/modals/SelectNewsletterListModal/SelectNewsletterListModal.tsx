"use client";

import React, { useEffect, useMemo, useState } from "react";
import apiClient from "@/app/apiClient";
import SelectNewsletterListModalPanel from "./modal_select_newsletter_list_components/SelectNewsletterListModalPanel";
import type {
  NewsletterListFilterState,
  NewsletterListRow,
  SelectNewsletterListModalProps,
} from "./modal_select_newsletter_list_components/types";

export type { NewsletterListRow } from "./modal_select_newsletter_list_components/types";

export default function SelectNewsletterListModal({
  open,
  onClose,
  onConfirm,
  portalIdFilter = null,
}: SelectNewsletterListModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lists, setLists] = useState<NewsletterListRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<NewsletterListFilterState>({
    id: "",
    name: "",
    usersSummary: "",
    topic: "",
  });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSelectedId("");
    const params =
      portalIdFilter != null && Number.isFinite(Number(portalIdFilter))
        ? { portal_id: Number(portalIdFilter) }
        : {};
    apiClient
      .get("/api/v1/user-lists", { params })
      .then((res) => setLists(Array.isArray(res.data) ? (res.data as NewsletterListRow[]) : []))
      .catch((e: unknown) => {
        const message =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Error loading newsletter lists";
        setError(message);
        setLists([]);
      })
      .finally(() => setLoading(false));
  }, [open, portalIdFilter]);

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
    const usersQ = filter.usersSummary.trim().toLowerCase();
    const topicQ = filter.topic.trim().toLowerCase();
    return lists.filter((list) => {
      const id = String(list.userList_id ?? "").toLowerCase();
      const name = String(list.userListName ?? "").toLowerCase();
      const usersSummary = String(list.userListPortal ?? "").toLowerCase();
      const topic = String(list.userListTopic ?? "").toLowerCase();
      return (
        (!idQ || id.includes(idQ)) &&
        (!nameQ || name.includes(nameQ)) &&
        (!usersQ || usersSummary.includes(usersQ)) &&
        (!topicQ || topic.includes(topicQ))
      );
    });
  }, [lists, filter]);

  const selected = useMemo(
    () => lists.find((list) => list.userList_id === selectedId) ?? null,
    [lists, selectedId]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <SelectNewsletterListModalPanel
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
