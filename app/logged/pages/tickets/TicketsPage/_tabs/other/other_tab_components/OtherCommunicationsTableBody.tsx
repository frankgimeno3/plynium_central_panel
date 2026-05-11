"use client";

import type { OtherRequest } from "@/app/logged/pages/tickets/hooks/useOtherRequests";

const stateBadgeClass = (): string => "border-blue-500 bg-blue-950/40 font-medium text-blue-300";

type Props = {
  rows: OtherRequest[];
  onRowClick: (reqId: string) => void;
};

export default function OtherCommunicationsTableBody({ rows, onRowClick }: Props) {
  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-5 text-center text-gray-500">
          No requests found for this filter.
        </td>
      </tr>
    );
  }
  return (
    <>
      {rows.map((req) => (
        <tr
          key={req.id}
          role="button"
          tabIndex={0}
          onClick={() => onRowClick(req.id)}
          onKeyDown={(e) => e.key === "Enter" && onRowClick(req.id)}
          className="hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{req.id}</td>
          <td className="px-6 py-4 text-sm text-gray-900">{req.author}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span
              className={`inline-flex rounded-r-md border-l-2 py-1.5 pl-2 pr-3 text-xs font-medium uppercase ${stateBadgeClass()}`}
            >
              {req.request_state}
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">{req.content}</td>
        </tr>
      ))}
    </>
  );
}
