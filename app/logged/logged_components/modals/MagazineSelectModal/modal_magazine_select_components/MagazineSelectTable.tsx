"use client";

import type { Magazine } from "@/app/contents/interfaces";

interface Props {
  loading: boolean;
  rows: Magazine[];
  selectedMagazine: Magazine | null;
  onSelectRow: (m: Magazine) => void;
}

export function MagazineSelectTable({ loading, rows, selectedMagazine, onSelectRow }: Props) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[200px]">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={2} className="px-4 py-5 text-center text-gray-500">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-4 py-5 text-center text-gray-500">
                No magazines found.
              </td>
            </tr>
          ) : (
            rows.map((m) => {
              const isSelected = selectedMagazine?.id_magazine === m.id_magazine;
              return (
                <tr
                  key={m.id_magazine}
                  onClick={() => onSelectRow(m)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-100 hover:bg-blue-100" : "hover:bg-gray-100"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{m.id_magazine}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{m.name}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
