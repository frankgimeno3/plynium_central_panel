"use client";

import React, { FC } from "react";
import type { ContactRow } from "./types";

type Props = {
  loading: boolean;
  paginated: ContactRow[];
  selectedContact: ContactRow | null;
  onPick: (row: ContactRow) => void;
};

export const ContactSelectTable: FC<Props> = ({ loading, paginated, selectedContact, onPick }) => (
  <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[200px]">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50 sticky top-0">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {loading ? (
          <tr>
            <td colSpan={6} className="px-4 py-5 text-center text-gray-500">
              Loading contacts…
            </td>
          </tr>
        ) : paginated.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-5 text-center text-gray-500">
              No contacts found.
            </td>
          </tr>
        ) : (
          paginated.map((c) => {
            const isSelected = selectedContact?.id_contact === c.id_contact;
            return (
              <tr
                key={c.id_contact}
                onClick={() => onPick(c)}
                className={`cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-100 hover:bg-blue-100" : "hover:bg-gray-100"
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{c.id_contact}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{c.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.role || "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.email || "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.phone || "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.company_name || "—"}</td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);
