"use client";

import React, { FC, useMemo, useState, useEffect } from "react";
import { useCompanyRequests, type CompanyRequest } from "@/app/logged/pages/tickets/hooks/useCompanyRequests";
import { CompanyRequestSelectModalPanel } from "./modal_company_request_select_components/CompanyRequestSelectModalPanel";
import type { CompanyRequestSelectModalProps } from "./modal_company_request_select_components/types";

const CompanyRequestSelectModal: FC<CompanyRequestSelectModalProps> = ({ open, onClose, onSelect }) => {
  const { requests } = useCompanyRequests();
  const [selectedRequest, setSelectedRequest] = useState<CompanyRequest | null>(null);

  const pendingRequests = useMemo(() => {
    return requests
      .filter((r) => r.request_state === "Pending")
      .sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());
  }, [requests]);

  useEffect(() => {
    if (!open) {
      setSelectedRequest(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleConfirm = () => {
    if (!selectedRequest) return;
    onSelect(selectedRequest);
    onClose();
  };

  if (!open) return null;

  return (
    <CompanyRequestSelectModalPanel
      onClose={onClose}
      pendingRequests={pendingRequests}
      selectedRequest={selectedRequest}
      onSelectRow={setSelectedRequest}
      onConfirm={handleConfirm}
    />
  );
};

export default CompanyRequestSelectModal;
