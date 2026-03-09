"use client";

import React, { FC, useState, useEffect } from "react";
import { PortalService } from "@/app/service/PortalService";

export interface Portal {
  id: number;
  key: string;
  name: string;
  domain: string;
  defaultLocale: string;
  theme: string;
  createdAt: string | null;
}

const PortalsPage: FC = () => {
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortals = async () => {
    try {
      const data = await PortalService.getAllPortals();
      setPortals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching portals:", error);
      setPortals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortals();
  }, []);

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white">
        <p className="text-2xl">Portals</p>
      </div>

      <div className="px-36 mx-7 mb-8 mt-5">
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading portals...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Locale
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Theme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {portals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No portals found
                    </td>
                  </tr>
                ) : (
                  portals.map((portal) => (
                    <tr key={portal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        {portal.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200 font-mono">
                        {portal.key}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-200">
                        {portal.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        {portal.domain || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        {portal.defaultLocale}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                        {portal.theme || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">
                        {formatDate(portal.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalsPage;
