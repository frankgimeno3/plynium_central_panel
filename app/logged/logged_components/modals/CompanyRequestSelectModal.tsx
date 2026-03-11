"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { useCompanyRequests, type CompanyRequest } from "@/app/logged/pages/network/requests/hooks/useCompanyRequests";

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

interface CompanyRequestSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (request: CompanyRequest) => void;
}

const CompanyRequestSelectModal: FC<CompanyRequestSelectModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-request-select-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2
            id="company-request-select-modal-title"
            className="text-xl font-bold text-gray-800"
          >
            Select a Company Creation Request
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
          <p className="text-sm text-gray-600">
            Only pending requests are shown. Select one to associate with the company you are creating.
          </p>

          <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[200px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No pending company requests found.
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((req) => (
                    <tr
                      key={req.companyRequestId}
                      onClick={() => setSelectedRequest(req)}
                      className={`cursor-pointer transition-colors ${
                        selectedRequest?.companyRequestId === req.companyRequestId
                          ? "bg-blue-100 hover:bg-blue-100"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {req.companyRequestId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {req.userId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {req.content.nombre_comercial}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {req.content.pais_empresa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(req.request_date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
              disabled={!selectedRequest}
              className="px-4 py-2 rounded-xl bg-blue-950 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900"
            >
              Select request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyRequestSelectModal;
