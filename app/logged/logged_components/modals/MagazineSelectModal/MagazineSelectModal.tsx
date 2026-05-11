"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import type { Magazine } from "@/app/contents/interfaces";
import { MagazineService } from "@/app/service/MagazineService";
import { MagazineSelectFilters } from "./modal_magazine_select_components/MagazineSelectFilters";
import { MagazineSelectTable } from "./modal_magazine_select_components/MagazineSelectTable";
import { MagazineSelectFooter } from "./modal_magazine_select_components/MagazineSelectFooter";
import type { MagazineSelectModalProps } from "./modal_magazine_select_components/types";

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
    let active = true;
    void (async () => {
      await Promise.resolve();
      if (!active) return;
      setLoading(true);
      try {
        const data = await MagazineService.getAllMagazines();
        if (active) setAllMagazines(Array.isArray(data) ? data : []);
      } catch {
        if (active) setAllMagazines([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open]);

  const filtered = useMemo(() => {
    let list = allMagazines.filter((m) => m && typeof m.id_magazine === "string");
    if (filter.id)
      list = list.filter((m) => m.id_magazine.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.name)
      list = list.filter((m) => (m.name || "").toLowerCase().includes(filter.name.toLowerCase()));
    return list;
  }, [allMagazines, filter]);

  useEffect(() => {
    if (open) return;
    const id = requestAnimationFrame(() => {
      setSelectedMagazine(null);
      setFilter({ id: "", name: "" });
    });
    return () => cancelAnimationFrame(id);
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
          <MagazineSelectFilters filter={filter} onChangeFilter={setFilter} />

          <MagazineSelectTable
            loading={loading}
            rows={filtered}
            selectedMagazine={selectedMagazine}
            onSelectRow={setSelectedMagazine}
          />

          <MagazineSelectFooter
            confirmLabel={confirmLabel}
            canConfirm={!!selectedMagazine}
            onCancel={onClose}
            onConfirm={handleConfirm}
          />
        </div>
      </div>
    </div>
  );
};

export default MagazineSelectModal;
