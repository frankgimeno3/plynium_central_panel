"use client";

import type { UnifiedNotification } from "@/app/contents/notifications.types";

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

type Props = {
  rows: UnifiedNotification[];
  onRowClick: (id: string) => void;
};

export default function ProductTicketsTableBody({ rows, onRowClick }: Props) {
  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-5 text-center text-gray-500">
          No product tickets found for this filter.
        </td>
      </tr>
    );
  }
  return (
    <>
      {rows.map((t) => (
        <tr
          key={t.id}
          role="button"
          tabIndex={0}
          onClick={() => onRowClick(t.id)}
          onKeyDown={(e) => e.key === "Enter" && onRowClick(t.id)}
          className="hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{t.id}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{t.sender_company || "—"}</td>
          <td className="px-6 py-4 text-sm text-gray-900">{t.brief_description || "—"}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{String(t.state)}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(t.date)}</td>
        </tr>
      ))}
    </>
  );
}
