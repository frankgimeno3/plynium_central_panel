"use client";

import React, { FC, useState, useEffect } from "react";
import { PortalService } from "@/app/service/PortalService";
import { CompanyCategoryService } from "@/app/service/CompanyCategoryService";
import { CreateCompanyCategoryFormFields } from "./modal_create_company_category_components/CreateCompanyCategoryFormFields";
import { CreateCompanyCategoryFooter } from "./modal_create_company_category_components/CreateCompanyCategoryFooter";
import type { CreateCompanyCategoryModalProps } from "./modal_create_company_category_components/types";

export type { CompanyCategory } from "./modal_create_company_category_components/types";

const CreateCompanyCategoryModal: FC<CreateCompanyCategoryModalProps> = ({
  open,
  onClose,
  existingNames,
  onCreated,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPortals, setSelectedPortals] = useState<number[]>([]);
  const [portals, setPortals] = useState<{ id: number; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const nameTrimmed = name.trim();
  const nameExists = (Array.isArray(existingNames) ? existingNames : [])
    .filter((n): n is string => typeof n === "string" && n.trim().length > 0)
    .some((n) => n.toLowerCase() === nameTrimmed.toLowerCase());
  const canConfirm =
    nameTrimmed.length > 0 &&
    !nameExists &&
    selectedPortals.length > 0 &&
    !submitting;

  useEffect(() => {
    if (open) {
      PortalService.getAllPortals()
        .then((list: { id: number; name?: string; key?: string }[]) => {
          setPortals(
            Array.isArray(list)
              ? list.map((p) => ({
                  id: p.id,
                  name: p.name ?? String(p.key ?? p.id),
                }))
              : []
          );
        })
        .catch(() => setPortals([]));
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open, onClose]);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setError("");
    setSubmitting(true);
    try {
      await CompanyCategoryService.createCategory({
        category_name: nameTrimmed,
        category_description: description.trim(),
        portal_ids: selectedPortals,
      });
      setName("");
      setDescription("");
      setSelectedPortals([]);
      onCreated();
      onClose();
    } catch (err: unknown) {
      const axErr = err as {
        message?: string;
        response?: { data?: unknown; status?: number };
      };
      const data = axErr?.response?.data;
      const message =
        (typeof data === "object" && data && "message" in data
          ? String((data as { message?: unknown }).message ?? "")
          : typeof data === "string"
            ? data
            : axErr?.message) || "Failed to create company category";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setName("");
      setDescription("");
      setSelectedPortals([]);
      setError("");
      onClose();
    }
  };

  const togglePortal = (portalId: number) => {
    setSelectedPortals((prev) =>
      prev.includes(portalId)
        ? prev.filter((p) => p !== portalId)
        : [...prev, portalId]
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Create Company Category
          </h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-50"
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
        <div className="p-4 overflow-y-auto space-y-4">
          <CreateCompanyCategoryFormFields
            name={name}
            description={description}
            nameExists={nameExists}
            nameTrimmed={nameTrimmed}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            portals={portals}
            selectedPortals={selectedPortals}
            submitting={submitting}
            error={error}
            onTogglePortal={togglePortal}
          />
        </div>
        <CreateCompanyCategoryFooter
          submitting={submitting}
          disabledConfirm={!canConfirm}
          onCancel={handleClose}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
};

export default CreateCompanyCategoryModal;
