"use client";

import React, { FC, useMemo, useState } from "react";
import providersData from "@/app/contents/providers.json";
import type { Provider } from "@/app/contents/interfaces";

const ProvidersPage: FC = () => {
  const all = (providersData as Provider[]).slice();
  const [filter, setFilter] = useState({ name: "", id: "" });

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id)
      list = list.filter((p) =>
        p.id_provider.toLowerCase().includes(filter.id.toLowerCase())
      );
    if (filter.name)
      list = list.filter((p) =>
        p.name.toLowerCase().includes(filter.name.toLowerCase())
      );
    return list;
  }, [all, filter]);

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="flex items-center justify-center gap-3 flex-wrap bg-blue-950/70 p-5 text-white">
        <p className="text-2xl">Providers</p>
      </div>

      <div className="flex flex-col w-full gap-4 p-12">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ID</label>
              <input
                type="text"
                value={filter.id}
                onChange={(e) => setFilter((f) => ({ ...f, id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provider ID"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={filter.name}
                onChange={(e) => setFilter((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provider name"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((p) => (
                <tr key={p.id_provider} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.id_provider}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.contact_email ?? "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.contact_phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No providers match the filters.</p>
        )}
      </div>
    </div>
  );
};

export default ProvidersPage;
