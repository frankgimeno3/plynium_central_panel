"use client";

import React, { type FC, useEffect, useMemo, useState } from "react";
import { BanksForecastService } from "@/app/service/BanksForecastService";
import {
  ddmmyyyyToYMD,
  formatAdminDate,
  maskDDMMYYYY,
} from "../adminDates";
import { CustomerService } from "@/app/service/CustomerService";
import { ProviderService } from "@/app/service/ProviderService";

type EntryType = "revenue" | "payment";

interface ForecastedItemCreateModalProps {
  open: boolean;
  onClose: () => void;
  onPublished?: () => void | Promise<void>;
}

const ToggleSwitch: FC<{
  checked: boolean;
  onToggle: () => void;
  label: string;
}> = ({ checked, onToggle, label }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-sm text-gray-600">{checked ? "Yes" : "No"}</span>
    </div>
  );
};

const ForecastedItemCreateModal: FC<ForecastedItemCreateModalProps> = ({
  open,
  onClose,
  onPublished,
}) => {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [entryType, setEntryType] = useState<EntryType>("revenue");

  const [amountEur, setAmountEur] = useState<string>("");
  const [dateDraft, setDateDraft] = useState<string>("");

  const [relatedEnabled, setRelatedEnabled] = useState(false);
  const [relatedId, setRelatedId] = useState<string>("");
  const [relatedValidated, setRelatedValidated] = useState(false);
  const [relatedName, setRelatedName] = useState<string>("");
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setEntryType("revenue");
    setAmountEur("");
    setDateDraft("");
    setRelatedEnabled(false);
    setRelatedId("");
    setRelatedValidated(false);
    setRelatedName("");
    setRelatedError(null);
    setIsValidating(false);
    setPublishError(null);
    setIsPublishing(false);
  }, [open]);

  const parsedAmount = useMemo(() => {
    const n = Number(amountEur);
    return Number.isFinite(n) ? n : NaN;
  }, [amountEur]);

  const dateYmd = useMemo(() => ddmmyyyyToYMD(dateDraft), [dateDraft]);

  const canGoToStep1 = parsedAmount > 0;
  const canGoToStep2 = Boolean(dateYmd);
  const canGoToStep4 = !relatedEnabled || relatedValidated;

  const validateRelated = async () => {
    const rawId = relatedId.trim();
    if (!rawId) {
      setRelatedError("Missing ID.");
      setRelatedValidated(false);
      return;
    }

    setIsValidating(true);
    setRelatedError(null);
    setRelatedValidated(false);
    setRelatedName("");

    try {
      if (entryType === "revenue") {
        const customer = await CustomerService.getCustomerById(rawId);
        setRelatedValidated(true);
        setRelatedName(customer?.name ?? rawId);
      } else {
        const provider = await ProviderService.getProviderById(rawId);
        setRelatedValidated(true);
        setRelatedName(provider?.name ?? rawId);
      }
    } catch (e: any) {
      const msg =
        e?.message ??
        e?.data?.message ??
        (typeof e === "string" ? e : null) ??
        "ID not found";
      setRelatedError(msg);
    } finally {
      setIsValidating(false);
    }
  };

  const handlePublish = async () => {
    if (entryType !== "revenue" && entryType !== "payment") return;
    if (!(parsedAmount > 0)) return;
    if (!dateYmd) return;
    if (relatedEnabled && !relatedValidated) return;

    setIsPublishing(true);
    setPublishError(null);

    try {
      const baseLabel =
        entryType === "revenue" ? "Forecasted revenue" : "Forecasted payment";
      const relatedLabel = relatedEnabled
        ? `${entryType === "revenue" ? "Revenue" : "Payment"} — ${
            relatedName || relatedId.trim()
          }`
        : baseLabel;

      const reference = relatedEnabled ? relatedId.trim() : "";

      await BanksForecastService.createForecastedItem({
        type: entryType,
        amount_eur: parsedAmount,
        forecast_date: dateYmd,
        related_id: relatedEnabled ? relatedId.trim() : null,
        label: relatedLabel,
        reference,
      });

      await onPublished?.();
      onClose();
    } catch (e: any) {
      const msg =
        e?.message ??
        e?.data?.message ??
        (typeof e === "string" ? e : null) ??
        "Failed to publish";
      setPublishError(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!open) return null;

  const typeLabel = entryType === "revenue" ? "Forecasted revenues" : "Forecasted payments";
  const relatedEntityLabel =
    entryType === "revenue" ? "customer account (customers_db)" : "provider (providers_db)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl rounded-lg bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Add {typeLabel}</h2>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none p-1"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-auto max-h-[70vh]">
          {publishError && (
            <p className="mb-4 text-red-600 text-sm" role="alert">
              {publishError}
            </p>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                First, define if this forecast is a <span className="font-medium">revenue</span> or a{" "}
                <span className="font-medium">payment</span>.
              </p>

              <div className="flex items-center justify-between gap-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <span className="text-sm text-gray-700">Revenue</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={entryType === "payment"}
                  onClick={() => {
                    const next: EntryType = entryType === "payment" ? "revenue" : "payment";
                    setEntryType(next);
                    // Changing the type invalidates any customer/provider validation state.
                    setRelatedEnabled(false);
                    setRelatedId("");
                    setRelatedValidated(false);
                    setRelatedName("");
                    setRelatedError(null);
                    setIsValidating(false);
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    entryType === "payment" ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                      entryType === "payment" ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">Payment</span>
              </div>

              <div className="text-xs text-gray-500">
                {entryType === "revenue" ? "Collections incoming" : "Payments outgoing"}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (€)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={amountEur}
                  onChange={(e) => setAmountEur(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                <div className="mt-1 text-xs text-gray-500">
                  This value must be greater than 0.
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="dd/mm/yyyy"
                  value={dateDraft}
                  onChange={(e) => setDateDraft(maskDDMMYYYY(e.target.value))}
                  maxLength={10}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <ToggleSwitch
                checked={relatedEnabled}
                label={`Related to a ${relatedEntityLabel}?`}
                onToggle={() => {
                  setRelatedEnabled((v) => {
                    const next = !v;
                    if (!next) {
                      setRelatedId("");
                      setRelatedValidated(false);
                      setRelatedName("");
                      setRelatedError(null);
                      setIsValidating(false);
                    }
                    return next;
                  });
                }}
              />

              {relatedEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {entryType === "revenue" ? "Customer ID" : "Provider ID"}
                    </label>
                    <input
                      type="text"
                      value={relatedId}
                      onChange={(e) => {
                        setRelatedId(e.target.value);
                        setRelatedValidated(false);
                        setRelatedName("");
                        setRelatedError(null);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={entryType === "revenue" ? "e.g. cus-001" : "e.g. prov-001"}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={validateRelated}
                      disabled={!relatedId.trim() || isValidating}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isValidating ? "Validating..." : "Validate"}
                    </button>

                    {relatedValidated && (
                      <span className="text-sm text-green-700 font-medium">
                        Validated: {relatedName}
                      </span>
                    )}
                  </div>

                  {relatedError && (
                    <p className="text-red-600 text-sm" role="alert">
                      {relatedError}
                    </p>
                  )}

                  <div className="text-xs text-gray-500">
                    If the ID does not exist, publication will be blocked.
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Type:</span>{" "}
                  {entryType === "revenue" ? "Revenue" : "Payment"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Amount:</span>{" "}
                  {parsedAmount.toFixed(2)} €
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Date:</span>{" "}
                  {dateYmd ? formatAdminDate(dateYmd) : dateDraft || "—"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Related:</span>{" "}
                  {!relatedEnabled ? "No" : `Yes — ${relatedName || relatedId.trim()}`}
                </p>
              </div>

              <p className="text-xs text-gray-500">
                Confirming will publish the forecast into RDS ({entryType === "revenue" ? "revenues_db" : "payments_db"}).
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s > 0 ? ((s - 1) as any) : s))}
              disabled={isPublishing}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
            >
              Back
            </button>
          )}

          {step < 4 && (
            <button
              type="button"
              onClick={() => setStep((s) => ((s + 1) as any))}
              disabled={
                isPublishing ||
                (step === 0 ? false : step === 1 ? !canGoToStep1 : step === 2 ? !canGoToStep2 : step === 3 ? !canGoToStep4 : false)
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={
                isPublishing || !(canGoToStep4 && parsedAmount > 0 && dateYmd)
              }
              className={`px-4 py-2 text-sm font-medium rounded-lg text-white ${
                isPublishing ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPublishing ? "Publishing..." : "Confirm and publish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForecastedItemCreateModal;

