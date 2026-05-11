"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { CompanyService } from "@/app/service/CompanyService";
import { CompaniesDbSelectModalPanel } from "./modal_companies_db_select_components/CompaniesDbSelectModalPanel";
import {
  PAGE_SIZE,
  type CompaniesDbRow,
  type CompaniesDbSelectModalProps,
} from "./modal_companies_db_select_components/types";

export type { CompaniesDbRow } from "./modal_companies_db_select_components/types";

const CompaniesDbSelectModal: FC<CompaniesDbSelectModalProps> = ({ open, onClose, onSelectCompany }) => {
  const [companies, setCompanies] = useState<CompaniesDbRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CompaniesDbRow | null>(null);
  const [page, setPage] = useState(0);

  const [nameFilter, setNameFilter] = useState("");
  const [idFilter, setIdFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected(null);
    setPage(0);
    setNameFilter("");
    setIdFilter("");
    setCountryFilter("");
    CompanyService.getAllCompanies()
      .then((data: unknown) => {
        setCompanies(Array.isArray(data) ? (data as CompaniesDbRow[]) : []);
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    let list = [...companies];
    const qName = nameFilter.trim().toLowerCase();
    const qId = idFilter.trim().toLowerCase();
    const qCountry = countryFilter.trim().toLowerCase();
    if (qName) {
      list = list.filter((c) => (c.commercialName ?? "").toLowerCase().includes(qName));
    }
    if (qId) {
      list = list.filter((c) => (c.companyId ?? "").toLowerCase().includes(qId));
    }
    if (qCountry) {
      list = list.filter((c) => (c.country ?? "").toLowerCase().includes(qCountry));
    }
    return list;
  }, [companies, nameFilter, idFilter, countryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * PAGE_SIZE;
  const pageRows = useMemo(() => filtered.slice(start, start + PAGE_SIZE), [filtered, start]);

  useEffect(() => {
    if (page >= totalPages && totalPages > 0) setPage(totalPages - 1);
  }, [page, totalPages]);

  const handleConfirm = () => {
    if (!selected) return;
    onSelectCompany({
      companyId: selected.companyId,
      commercialName: selected.commercialName ?? selected.companyId,
      country: selected.country ?? "",
    });
    onClose();
  };

  const onFilterChange = ({
    nameFilter: n,
    idFilter: i,
    countryFilter: c,
  }: {
    nameFilter: string;
    idFilter: string;
    countryFilter: string;
  }) => {
    setNameFilter(n);
    setIdFilter(i);
    setCountryFilter(c);
    setPage(0);
    setSelected(null);
  };

  if (!open) return null;

  return (
    <CompaniesDbSelectModalPanel
      onClose={onClose}
      loading={loading}
      nameFilter={nameFilter}
      idFilter={idFilter}
      countryFilter={countryFilter}
      onFilterChange={onFilterChange}
      pageRows={pageRows}
      selected={selected}
      onSelectRow={setSelected}
      currentPage={currentPage}
      totalPages={totalPages}
      filteredCount={filtered.length}
      onPageChange={(p) => {
        setPage(p);
        setSelected(null);
      }}
      onConfirm={handleConfirm}
    />
  );
};

export default CompaniesDbSelectModal;
