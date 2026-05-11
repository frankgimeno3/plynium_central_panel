"use client";

import type { CompanyRequest } from "@/app/logged/pages/tickets/hooks/useCompanyRequests";

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

const stateBadgeClass = (): string => "border-blue-500 bg-blue-950/40 font-medium text-blue-300";

type Props = {
  rows: CompanyRequest[];
  onRowClick: (id: string) => void;
};

export default function CompanyRequestsTableBody({ rows, onRowClick }: Props) {
  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={6} className="px-4 py-5 text-center text-gray-500">
          No company requests found for this filter.
        </td>
      </tr>
    );
  }
  return (
    <>
      {rows.map((req) => (
        <tr
          key={req.companyRequestId}
          role="button"
          tabIndex={0}
          onClick={() => onRowClick(req.companyRequestId)}
          onKeyDown={(e) => e.key === "Enter" && onRowClick(req.companyRequestId)}
          className="hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{req.companyRequestId}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{req.userId}</td>
          <td className="px-6 py-4 text-sm text-gray-900">{req.content.nombre_comercial}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{req.content.pais_empresa}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`inline-flex rounded-r-md border-l-2 py-1.5 pl-2 pr-3 text-xs font-medium uppercase ${stateBadgeClass()}`}
            >
              {req.request_state}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(req.request_date)}</td>
        </tr>
      ))}
    </>
  );
}
