"use client";

import type { AdvertisementRequest } from "@/app/logged/pages/tickets/hooks/useAdvertisements";

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

const formatState = (state: string): string => {
  return state
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const stateBadgeClass = (): string => "border-blue-500 bg-blue-950/40 font-medium text-blue-300";

type Props = {
  rows: AdvertisementRequest[];
  onRowClick: (idAdvReq: string) => void;
};

export default function AdvertisementQuotationsTableBody({ rows, onRowClick }: Props) {
  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-5 text-center text-gray-500">
          No advertisement requests found for this filter.
        </td>
      </tr>
    );
  }
  return (
    <>
      {rows.map((advertisement) => (
        <tr
          key={advertisement.idAdvReq}
          role="button"
          tabIndex={0}
          onClick={() => onRowClick(advertisement.idAdvReq)}
          onKeyDown={(e) => e.key === "Enter" && onRowClick(advertisement.idAdvReq)}
          className="hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{advertisement.idAdvReq}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{advertisement.senderEmail}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{advertisement.senderCompany}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`inline-flex rounded-r-md border-l-2 py-1.5 pl-2 pr-3 text-xs font-medium uppercase ${stateBadgeClass()}`}
            >
              {formatState(advertisement.advReqState)}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(advertisement.senderDate)}</td>
        </tr>
      ))}
    </>
  );
}
