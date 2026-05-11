"use client";

import type { CustomerRow } from "./types";

type Props = {
  loading: boolean;
  loadError: string | null;
  paginated: CustomerRow[];
  selectedCustomer: CustomerRow | null;
  onSelect: (row: CustomerRow) => void;
};

export function CustomerSelectTableRows({
  loading,
  loadError,
  paginated,
  selectedCustomer,
  onSelect,
}: Props) {
  if (loading) {
    return (
      <tr>
        <td colSpan={8} className="px-4 py-5 text-center text-gray-500">
          Loading customers…
        </td>
      </tr>
    );
  }
  if (loadError) {
    return (
      <tr>
        <td colSpan={8} className="px-4 py-5 text-center">
          <p className="text-amber-700 font-medium">Could not load customers</p>
          <p className="text-sm text-gray-600 mt-1">{loadError}</p>
          <p className="text-xs text-gray-500 mt-2">
            Check .env (DATABASE_*) and that the customers_db table exists in your RDS.
          </p>
        </td>
      </tr>
    );
  }
  if (paginated.length === 0) {
    return (
      <tr>
        <td colSpan={8} className="px-4 py-5 text-center text-gray-500">
          No customers found.
        </td>
      </tr>
    );
  }
  return (
    <>
      {paginated.map((c) => {
        const isSelected = selectedCustomer?.id_customer === c.id_customer;
        return (
          <tr
            key={c.id_customer}
            onClick={() => onSelect(c)}
            className={`cursor-pointer transition-colors ${
              isSelected ? "bg-blue-100 hover:bg-blue-100" : "hover:bg-gray-100"
            }`}
          >
            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{c.id_customer}</td>
            <td className="px-6 py-4 text-sm text-gray-900">{c.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.cif || "—"}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.country || "—"}</td>
            <td className="px-6 py-4 text-sm text-gray-600">
              {c.contact?.name ? `${c.contact.name} (${c.contact.role || ""})` : "—"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.proposals || []).length}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.contracts || []).length}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.projects || []).length}</td>
          </tr>
        );
      })}
    </>
  );
}
