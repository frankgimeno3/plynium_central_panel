"use client";

import React, { FC, useState, useEffect, useCallback } from "react";
import { CompanyCategoryService } from "@/app/service/CompanyCategoryService";
import { CategoriesModalPanel } from "./modal_categories_components/CategoriesModalPanel";
import { CategoriesUntagConfirm } from "./modal_categories_components/CategoriesUntagConfirm";
import type { CategoriesModalProps, CategoryItem } from "./modal_categories_components/types";

export type { CategoryItem } from "./modal_categories_components/types";

const CategoriesModal: FC<CategoriesModalProps> = ({
  open,
  onClose,
  selectedCategoryNames = [],
  onSelectCategories,
}) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CategoryItem[]>([]);
  const [confirmUntag, setConfirmUntag] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const list = await CompanyCategoryService.getAllCategories();
      const raw = Array.isArray(list) ? list : [];
      const normalized: CategoryItem[] = raw
        .filter((c) => c != null && typeof c === "object")
        .map((c) => {
          const row = c as {
            category_id?: unknown;
            category_name?: unknown;
            portals_array?: unknown;
          };
          return {
            id_category: String(row.category_id ?? ""),
            name: String(row.category_name ?? ""),
            portals_array: Array.isArray(row.portals_array) ? row.portals_array : [],
          };
        });
      setCategories(normalized);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setConfirmUntag(null);
      return;
    }
    loadCategories();
  }, [open, loadCategories]);

  useEffect(() => {
    if (!open || categories.length === 0) return;
    const names = Array.isArray(selectedCategoryNames) ? selectedCategoryNames : [];
    const initial = names.length ? categories.filter((c) => names.includes(c.name)) : [];
    setSelected(initial);
  }, [open, selectedCategoryNames, categories]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmUntag) setConfirmUntag(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, confirmUntag]);

  const addCategory = (cat: CategoryItem) => {
    if (selected.some((c) => c.id_category === cat.id_category)) return;
    setSelected((prev) => [...prev, cat]);
  };

  const confirmUntagYes = () => {
    if (!confirmUntag) return;
    setSelected((prev) => prev.filter((c) => c.name !== confirmUntag));
    setConfirmUntag(null);
  };

  const handleConfirm = () => {
    onSelectCategories(selected);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <CategoriesModalPanel
        onClose={onClose}
        loading={loading}
        categories={categories}
        selected={selected}
        onConfirmSelection={handleConfirm}
        onRequestUntag={(name) => setConfirmUntag(name)}
        onPickCategory={addCategory}
      />
      {confirmUntag && (
        <CategoriesUntagConfirm
          categoryName={confirmUntag}
          onCancel={() => setConfirmUntag(null)}
          onConfirm={confirmUntagYes}
        />
      )}
    </>
  );
};

export default CategoriesModal;
