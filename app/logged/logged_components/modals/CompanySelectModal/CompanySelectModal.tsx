"use client";

import React, { FC, useState, useEffect, useCallback, useMemo } from "react";
import { CompanyService } from "@/app/service/CompanyService";
import { CompanySelectModalPanel } from "./modal_company_select_components/CompanySelectModalPanel";
import {
  COMPANY_SELECT_PAGE_SIZE,
  type CompanyRow,
  type CompanySelectModalProps,
} from "./modal_company_select_components/types";

export type { CompanyRow } from "./modal_company_select_components/types";

const CompanySelectModal: FC<CompanySelectModalProps> = ({ open, onClose, onSelectCompany, publications }) => {
  const [selectedPortalId, setSelectedPortalId] = useState<number | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(null);
  const [page, setPage] = useState(0);

  const fetchCompanies = useCallback(async (portalId: number) => {
    setLoading(true);
    try {
      const data = await CompanyService.getCompaniesByPortal(portalId);
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (publications.length === 1) {
      setSelectedPortalId(publications[0].portalId);
    } else {
      setSelectedPortalId(null);
    }
    setNameFilter("");
    setSelectedCompany(null);
    setPage(0);
  }, [open, publications]);

  useEffect(() => {
    if (open && selectedPortalId != null) {
      fetchCompanies(selectedPortalId);
    } else {
      setCompanies([]);
    }
  }, [open, selectedPortalId, fetchCompanies]);

  const filteredCompanies = useMemo(() => {
    const list = [...companies];
    if (nameFilter.trim()) {
      const q = nameFilter.trim().toLowerCase();
      return list.filter(
        (c) =>
          (c.commercialName ?? "").toLowerCase().includes(q) ||
          (c.companyId ?? "").toLowerCase().includes(q) ||
          (c.country ?? "").toLowerCase().includes(q) ||
          (c.region ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [companies, nameFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / COMPANY_SELECT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * COMPANY_SELECT_PAGE_SIZE;
  const pageCompanies = useMemo(
    () => filteredCompanies.slice(start, start + COMPANY_SELECT_PAGE_SIZE),
    [filteredCompanies, start]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (page >= totalPages && totalPages > 0) setPage(totalPages - 1);
  }, [page, totalPages]);

  const handleConfirm = () => {
    if (!selectedCompany) return;
    onSelectCompany({
      companyId: selectedCompany.companyId,
      commercialName: selectedCompany.commercialName ?? selectedCompany.companyId,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <CompanySelectModalPanel
      onClose={onClose}
      publicationsEmpty={publications.length === 0}
      publicationsMultiple={publications.length > 1}
      publications={publications}
      selectedPortalId={selectedPortalId}
      setSelectedPortalId={setSelectedPortalId}
      resetPaginationOnPortalChange={() => {
        setPage(0);
        setSelectedCompany(null);
      }}
      nameFilter={nameFilter}
      setNameFilter={setNameFilter}
      resetPaginationAndSelection={() => {
        setPage(0);
        setSelectedCompany(null);
      }}
      loading={loading}
      pageCompanies={pageCompanies}
      selectedCompany={selectedCompany}
      setSelectedCompany={setSelectedCompany}
      currentPage={currentPage}
      totalPages={totalPages}
      filteredCount={filteredCompanies.length}
      setPage={setPage}
      onConfirm={handleConfirm}
    />
  );
};

export default CompanySelectModal;
