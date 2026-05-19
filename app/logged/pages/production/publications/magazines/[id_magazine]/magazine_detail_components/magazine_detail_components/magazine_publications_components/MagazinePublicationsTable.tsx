"use client";

import React, { FC } from "react";
import type { PublicationRow } from "../types";

type Props = {
  publications: PublicationRow[];
};

export const MagazinePublicationsTable: FC<Props> = ({ publications }) => (
  <div className="overflow-x-auto border border-gray-200 rounded-lg">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edition name</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue #</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {publications.map((p) => (
          <tr key={p.id_publication} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.id_publication}</td>
            <td className="px-4 py-3 text-sm text-gray-900">{p.publication_edition_name || "—"}</td>
            <td className="px-4 py-3 text-sm text-gray-700">{p.publication_status}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{p.publication_year ?? "—"}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{p.magazine_this_year_issue ?? "—"}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{p.real_publication_month_date ?? "—"}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{p.publication_format}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
