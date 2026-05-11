"use client";

import React, { FC } from "react";
import type { ContactFilterState, ContactRow } from "./types";

type SelectContactModalPanelProps = {
  filter: ContactFilterState;
  error: string | null;
  loading: boolean;
  filtered: ContactRow[];
  selectedId: string;
  selected: ContactRow | null;
  onClose: () => void;
  onFilterChange: (next: ContactFilterState) => void;
  onSelectId: (id: string) => void;
  onConfirm: () => void;
};

const SelectContactModalPanel: FC<SelectContactModalPanelProps> = ({
  filter,
  error,
  loading,
  filtered,
  selectedId,
  selected,
  onClose,
  onFilterChange,
  onSelectId,
  onConfirm,
}) => {
  return (
    <div
      className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Select contact</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">ID</label>
            <input
              value={filter.id}
              onChange={(e) => onFilterChange({ ...filter, id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by id"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Name</label>
            <input
              value={filter.name}
              onChange={(e) => onFilterChange({ ...filter, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by name"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email</label>
            <input
              value={filter.email}
              onChange={(e) => onFilterChange({ ...filter, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by email"
            />
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-gray-500">Loading contacts...</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                      No contacts found
                    </td>
                  </tr>
                ) : (
                  filtered.map((contact) => {
                    const isSelected = selectedId === contact.id_contact;
                    return (
                      <tr
                        key={contact.id_contact}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectId(contact.id_contact)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelectId(contact.id_contact);
                          }
                        }}
                        aria-selected={isSelected}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          isSelected
                            ? "bg-blue-100 outline outline-2 outline-blue-500 outline-offset-[-2px]"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">{contact.id_contact}</td>
                        <td
                          className={`px-4 py-3 text-sm ${isSelected ? "font-semibold text-blue-950" : "text-gray-900"}`}
                        >
                          {contact.name ?? "—"}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm ${isSelected ? "text-blue-950" : "text-gray-700"}`}
                        >
                          {contact.email ?? "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 p-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!selectedId || !selected}
          className="px-4 py-2 text-sm rounded-lg bg-blue-950 text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default SelectContactModalPanel;
