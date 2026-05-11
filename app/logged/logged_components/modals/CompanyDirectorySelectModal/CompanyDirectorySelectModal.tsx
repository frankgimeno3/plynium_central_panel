"use client";

import React, { FC, useState, useEffect, useMemo } from "react";
import { CompanyService } from "@/app/service/CompanyService";
import type { Company } from "@/app/contents/interfaces";
import { CompanyDirectorySelectModalPanel } from "./modal_company_directory_select_components/CompanyDirectorySelectModalPanel";
import type { CompanyDirectorySelectModalProps } from "./modal_company_directory_select_components/types";

const CompanyDirectorySelectModal: FC<CompanyDirectorySelectModalProps> = ({ open, onClose, onSelectCompany }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setNameFilter("");
    setSelectedCompany(null);
    CompanyService.getAllCompanies()
      .then((data: unknown) => {
        setCompanies(Array.isArray(data) ? (data as Company[]) : []);
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filteredCompanies = useMemo(() => {
    if (!nameFilter.trim()) return companies;
    const q = nameFilter.trim().toLowerCase();
    return companies.filter(
      (c) =>
        (c.commercialName ?? "").toLowerCase().includes(q) ||
        (c.companyId ?? "").toLowerCase().includes(q) ||
        (c.country ?? "").toLowerCase().includes(q) ||
        (c.category ?? "").toLowerCase().includes(q)
    );
  }, [companies, nameFilter]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleConfirm = () => {
    if (!selectedCompany) return;
    onSelectCompany(selectedCompany.companyId, selectedCompany.commercialName ?? undefined);
    onClose();
  };

  if (!open) return null;

  return (
    <CompanyDirectorySelectModalPanel
      onClose={onClose}
      loading={loading}
      nameFilter={nameFilter}
      onFilterChange={(v) => {
        setNameFilter(v);
        setSelectedCompany(null);
      }}
      filteredCompanies={filteredCompanies}
      selectedCompany={selectedCompany}
      onSelectCompanyRow={setSelectedCompany}
      onConfirm={handleConfirm}
    />
  );
};

export default CompanyDirectorySelectModal;
