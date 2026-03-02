"use client";

import React, { FC } from "react";
import { useRouter } from "next/navigation";
import customersData from "@/app/contents/customers.json";

type Customer = {
  id_customer: string;
  name: string;
  cif: string;
  country: string;
  contact: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  comments: unknown[];
  proposals: string[];
  contracts: string[];
  projects: string[];
};

const CustomersDbPage: FC = () => {
  const router = useRouter();
  const customers = customersData as Customer[];
  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="text-center bg-blue-950/70 p-5 text-white">
        <p className="text-2xl">Customers DB</p>
      </div>

      <div className="overflow-x-auto p-12">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CIF</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposals</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contracts</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((c) => (
              <tr
                key={c.id_customer}
                onClick={() => router.push(`/logged/pages/pm/customers_db/${c.id_customer}`)}
                className={rowClass}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.id_customer}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.cif}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.country}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{c.contact?.name} ({c.contact?.role})</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.proposals || []).length}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.contracts || []).length}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.projects || []).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomersDbPage;
