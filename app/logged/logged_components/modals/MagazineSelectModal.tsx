"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { MagazineService } from "@/app/service/MagazineService";
import { Magazine } from "@/app/contents/interfaces";

interface MagazineSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectMagazine: (magazine: Magazine) => void;
  confirmLabel?: string;
}

const MagazineSelectModal: FC<MagazineSelectModalProps> = ({
  open,
  onClose,
  onSelectMagazine,
  confirmLabel = "Select magazine",
}) => {
  const [allMagazines, setAllMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMagazine, setSelectedMagazine] = useState<Magazine | null>(null);
  const [filter, setFilter] = useState({ id: "", name: "" });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    MagazineService.getAllMagazines()
      .then((data) => setAllMagazines(Array.isArray(data) ? data : []))
      .catch(() => setAllMagazines([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    let list = allMagazines.filter((m) => m && typeof m.id_magazine === "string");
    if (filter.id) list = list.filter((m) => m.id_magazine.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.name) list = list.filter((m) => (m.name || "").toLowerCase().includes(filter.name.toLowerCase()));
    return list;
  }, [allMagazines, filter]);

  useEffect(() => {
    if (!open) {
      setSelectedMagazine(null);
      setFilter({ id: "", name: "" });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleConfirm = () => {
    if (!selectedMagazine) return;
    onSelectMagazine(selectedMagazine);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="magazine-select-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="magazine-select-modal-title" className="text-xl font-bold text-gray-800">
            Select magazine
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ID</label>
              <input
                type="text"
                value={filter.id}
                onChange={(e) => setFilter((f) => ({ ...f, id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                placeholder="Search by ID"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={filter.name}
                onChange={(e) => setFilter((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                placeholder="Search by name"
              />
            </div>
          </div>

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
                    <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                      No magazines found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => {
                    const isSelected = selectedMagazine?.id_magazine === m.id_magazine;
                    return (
                      <tr
                        key={m.id_magazine}
                        onClick={() => setSelectedMagazine(m)}
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

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedMagazine}
              className="px-4 py-2 rounded-xl bg-blue-950 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagazineSelectModal;
