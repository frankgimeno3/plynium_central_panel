"use client";

import React, { FC } from "react";
import { Magazine } from "@/app/contents/interfaces";

const ROW_CLASS = "cursor-pointer hover:bg-blue-50/80 transition-colors";

type Props = {
  magazines: Magazine[];
  basePath: string;
  onRowNavigate: (path: string) => void;
};

export const MagazinesTable: FC<Props> = ({ magazines, basePath, onRowNavigate }) => (
  <div className="overflow-x-auto mt-6">
    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Starting year</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodicity</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {magazines.map((m) => (
          <tr key={m.id_magazine} onClick={() => onRowNavigate(`${basePath}/${m.id_magazine}`)} className={ROW_CLASS}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.id_magazine}</td>
            <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.name}</td>
            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{m.description ?? "—"}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {m.first_year != null ? String(m.first_year) : "—"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {m.periodicity && m.periodicity.trim() !== "" ? m.periodicity : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
