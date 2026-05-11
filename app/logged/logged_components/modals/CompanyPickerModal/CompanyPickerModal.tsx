"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { CompanyService } from "@/app/service/CompanyService";
import { CompanyPickerModalPanel } from "./modal_company_picker_components/CompanyPickerModalPanel";
import {
  COMPANY_PICKER_PAGE_SIZE,
  type CompanyPickerModalProps,
  type CompanyPickerRow,
} from "./modal_company_picker_components/types";

const CompanyPickerModal: FC<CompanyPickerModalProps> = ({
  open,
  onClose,
  excludeCompanyIds = [],
  onSelectCompany,
  confirmLabel = "Link company",
}) => {
  const [all, setAll] = useState<CompanyPickerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CompanyPickerRow | null>(null);

  const exclude = useMemo(() => new Set((excludeCompanyIds || []).map((x) => String(x).trim())), [excludeCompanyIds]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await CompanyService.getAllCompanies();
      const list = Array.isArray(data)
        ? data
            .filter((c) => c && typeof (c as CompanyPickerRow).companyId === "string")
            .map((c) => c as CompanyPickerRow)
        : [];
      setAll(list);
    } catch (e) {
      setAll([]);
      setLoadError(e instanceof Error ? e.message : "Could not load companies.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) {
      setFilter("");
      setPage(1);
      setSelected(null);
      setLoadError(null);
    }
  }, [open]);

  const filtered = useMemo(() => {
    let list = all.filter((c) => !exclude.has(c.companyId));
    const q = filter.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          (c.commercialName || "").toLowerCase().includes(q) ||
          (c.companyId || "").toLowerCase().includes(q) ||
          (c.country || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [all, filter, exclude]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / COMPANY_PICKER_PAGE_SIZE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * COMPANY_PICKER_PAGE_SIZE;
    return filtered.slice(start, start + COMPANY_PICKER_PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <CompanyPickerModalPanel
      onClose={onClose}
      filter={filter}
      onFilterChange={setFilter}
      loading={loading}
      loadError={loadError}
      pageRows={pageRows}
      page={page}
      totalPages={totalPages}
      filteredLength={filtered.length}
      selected={selected}
      onSelectRow={setSelected}
      onPageChange={setPage}
      confirmLabel={confirmLabel}
      excludeCount={exclude.size}
      onConfirm={() => {
        if (!selected) return;
        onSelectCompany({
          companyId: selected.companyId,
          commercialName: selected.commercialName || selected.companyId,
        });
        onClose();
      }}
    />
  );
};

export default CompanyPickerModal;
