"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { BanksForecastService } from "@/app/service/BanksForecastService";
import { BillingService } from "@/app/service/BillingService";
import {
  ddmmyyyyToYMD,
  formatAdminDate,
  maskDDMMYYYY,
  ymdToDDMMYYYY,
} from "../../../adminDates";

type ForecastItem = {
  id: string;
  type: "revenue" | "payment";
  label: string;
  date: string;
  amount_eur: number;
  reference: string;
};

const BASE_BACK = "/logged/pages/administration/banks";

/** Must match banks page — derived from pending orders, not revenues_db. */
const DERIVED_REV_ID_PREFIX = "src-rev-";

function orderToForecastRevenueItem(
  id: string,
  o: {
    order_code: string;
    client_name?: string;
    collection_date?: string;
    amount_eur?: number;
    payment_status?: string;
  }
): ForecastItem {
  const ymd =
    typeof o.collection_date === "string"
      ? o.collection_date.slice(0, 10)
      : "";
  return {
    id,
    type: "revenue",
    label: `Order ${o.order_code} (${o.client_name ?? ""})`,
    date: ymd,
    amount_eur: Number(o.amount_eur) || 0,
    reference: o.order_code,
  };
}

const RevenueEditPage: FC = () => {
  const router = useRouter();
  const params = useParams();

  const id = useMemo(() => {
    const raw = params?.id;
    return typeof raw === "string" ? decodeURIComponent(raw) : null;
  }, [params]);

  const [item, setItem] = useState<ForecastItem | null>(null);
  const [itemSource, setItemSource] = useState<"forecast" | "order" | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const [amountEur, setAmountEur] = useState<string>("");
  const parsedAmountEur = useMemo(() => {
    const n = Number(amountEur);
    return Number.isFinite(n) ? n : null;
  }, [amountEur]);

  const [collectionDateDraft, setCollectionDateDraft] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">(
    "pending"
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItem = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setItemSource(null);
    setCollectionDateDraft("");
    setPaymentStatus("pending");
    try {
      if (id.startsWith(DERIVED_REV_ID_PREFIX)) {
        const code = id.slice(DERIVED_REV_ID_PREFIX.length);
        const order = await BillingService.getOrderById(code);
        const mapped = orderToForecastRevenueItem(id, order);
        setItem(mapped);
        setAmountEur(String(mapped.amount_eur));
        setCollectionDateDraft(ymdToDDMMYYYY(mapped.date || ""));
        setPaymentStatus(
          order.payment_status === "paid" ? "paid" : "pending"
        );
        setItemSource("order");
        return;
      }

      try {
        const data = await BanksForecastService.getForecastedItemById(id);
        if (data && data.type === "revenue") {
          setItem(data);
          setAmountEur(String(data.amount_eur));
          setItemSource("forecast");
          return;
        }
      } catch (e: unknown) {
        const status = (e as { status?: number })?.status;
        if (status !== 404) {
          setItem(null);
          return;
        }
      }

      if (id.startsWith("rev-")) {
        const code = id.slice(4);
        if (code) {
          try {
            const order = await BillingService.getOrderById(code);
            const mapped = orderToForecastRevenueItem(id, order);
            setItem(mapped);
            setAmountEur(String(mapped.amount_eur));
            setCollectionDateDraft(ymdToDDMMYYYY(mapped.date || ""));
            setPaymentStatus(
              order.payment_status === "paid" ? "paid" : "pending"
            );
            setItemSource("order");
            return;
          } catch {
            /* fall through */
          }
        }
      }

      setItem(null);
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    if (!id) {
      setPageMeta({
        pageTitle: "Edit revenue",
        breadcrumbs: [
          { label: "Administration", href: "/logged/pages/administration" },
          { label: "Banks", href: BASE_BACK },
          { label: "Edit revenue" },
        ],
        buttons: [{ label: "Back to Banks", href: BASE_BACK }],
      });
      return;
    }

    if (!item) {
      setPageMeta({
        pageTitle: "Revenue not found",
        breadcrumbs: [
          { label: "Administration", href: "/logged/pages/administration" },
          { label: "Banks", href: BASE_BACK },
          { label: id },
        ],
        buttons: [{ label: "Back to Banks", href: BASE_BACK }],
      });
      return;
    }

    setPageMeta({
      pageTitle: `Edit revenue — ${item.id}`,
      breadcrumbs: [
        { label: "Administration", href: "/logged/pages/administration" },
        { label: "Banks", href: BASE_BACK },
        { label: item.id },
      ],
      buttons: [{ label: "Back to Banks", href: BASE_BACK }],
    });
  }, [id, item, setPageMeta]);

  const handleSave = async () => {
    if (!id || !item || !itemSource) return;
    if (parsedAmountEur == null || parsedAmountEur < 0) {
      setError("Invalid amount. Use a number >= 0.");
      return;
    }

    let collectionYmd: string | null = null;
    if (itemSource === "order") {
      collectionYmd = ddmmyyyyToYMD(collectionDateDraft);
      if (!collectionYmd) {
        setError("Invalid collection date. Use dd/mm/yyyy.");
        return;
      }
      if (!item.reference) {
        setError("Missing order code.");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      if (itemSource === "forecast") {
        await BanksForecastService.updateForecastedItem(id, {
          amount_eur: parsedAmountEur,
        });
      } else if (collectionYmd && item.reference) {
        await BillingService.updateOrder(item.reference, {
          collection_date: collectionYmd,
          amount_eur: parsedAmountEur,
          payment_status: paymentStatus,
        });
      }
      router.push(BASE_BACK);
    } catch (e: unknown) {
      const msg =
        (e as { message?: string; data?: { message?: string } })?.message ??
        (e as { data?: { message?: string } })?.data?.message ??
        (typeof e === "string" ? e : null);
      setError(msg ?? "Failed to save revenue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <div className="bg-white rounded-b-lg overflow-hidden p-6">
          {!id ? (
            <p className="text-gray-500">Invalid revenue id.</p>
          ) : loading ? (
            <p className="text-gray-500">Loading revenue…</p>
          ) : !item ? (
            <p className="text-gray-500">Revenue not found.</p>
          ) : (
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {itemSource === "order" ? "Edit collection (order)" : "Edit revenue"}
              </h2>

              <div className="space-y-3 mb-6">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Label:</span> {item.label}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Reference:</span>{" "}
                  {item.reference || "—"}
                </div>
                {itemSource === "forecast" ? (
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Date:</span>{" "}
                    {formatAdminDate(item.date)}
                  </div>
                ) : null}
              </div>

              {itemSource === "order" ? (
                <p className="mb-4 text-sm text-gray-600">
                  Changes are saved to the order record (collection date, amount, payment status).
                </p>
              ) : null}

              {error && (
                <p className="mb-4 text-red-600 text-sm" role="alert">
                  {error}
                </p>
              )}

              {itemSource === "order" ? (
                <div className="mb-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Collection date
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/yyyy"
                      value={collectionDateDraft}
                      onChange={(e) =>
                        setCollectionDateDraft(maskDDMMYYYY(e.target.value))
                      }
                      maxLength={10}
                      className="w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) =>
                        setPaymentStatus(
                          e.target.value === "paid" ? "paid" : "pending"
                        )
                      }
                      className="w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>
              ) : null}

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
                />
                <div className="mt-1 text-xs text-gray-500">
                  Loaded value: {item.amount_eur.toLocaleString()} €
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push(BASE_BACK)}
                  disabled={saving}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving…" : "Save & go back"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContentSection>
  );
};

export default RevenueEditPage;

