"use client";

import React, { FC } from "react";
import type { ContractRow } from "./types";

type ContractSelectModalTableProps = {
  loading: boolean;
  loadError: string | null;
  contracts: ContractRow[];
  selectedContract: ContractRow | null;
  onSelectContract: (contract: ContractRow) => void;
};

function formatAmount(eur: number): string {
  if (!Number.isFinite(eur)) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(eur);
}

const ContractSelectModalTable: FC<ContractSelectModalTableProps> = ({
  loading,
  loadError,
  contracts,
  selectedContract,
  onSelectContract,
}) => (
  <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[200px]">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50 sticky top-0">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Contract ID
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Title
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Customer
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Process
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Payment
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Amount
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {loading ? (
          <tr>
            <td colSpan={6} className="px-4 py-5 text-center text-gray-500">
              Loading contracts…
            </td>
          </tr>
        ) : loadError ? (
          <tr>
            <td colSpan={6} className="px-4 py-5 text-center">
              <p className="text-amber-700 font-medium">Could not load contracts</p>
              <p className="text-sm text-gray-600 mt-1">{loadError}</p>
            </td>
          </tr>
        ) : contracts.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-5 text-center text-gray-500">
              No contracts found.
            </td>
          </tr>
        ) : (
          contracts.map((contract) => {
            const isSelected = selectedContract?.id_contract === contract.id_contract;
            return (
              <tr
                key={contract.id_contract}
                onClick={() => onSelectContract(contract)}
                className={`cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-100 hover:bg-blue-100" : "hover:bg-gray-100"
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                  {contract.id_contract}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{contract.title || "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                  {contract.id_customer || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {contract.process_state || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {contract.payment_state || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {formatAmount(contract.amount_eur)}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);

export default ContractSelectModalTable;
