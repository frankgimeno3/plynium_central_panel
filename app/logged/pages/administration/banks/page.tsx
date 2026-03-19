"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { BillingService } from "@/app/service/BillingService";
import { ProviderService } from "@/app/service/ProviderService";
import { BanksForecastService } from "@/app/service/BanksForecastService";
import ForecastedItemCreateModal from "./ForecastedItemCreateModal";
import {
  normalizeAdminDateToYMD as normalizeToYMD,
  formatAdminDate,
  ymdToDDMMYYYY,
  ddmmyyyyToYMD,
  maskDDMMYYYY,
  pad2,
} from "../adminDates";

type ForecastItem = {
  id: string;
  type: "revenue" | "payment";
  label: string;
  date: string;
  amount_eur: number;
  reference: string;
};

type OrderRow = {
  order_code: string;
  client_name: string;
  collection_date: string;
  payment_status: "paid" | "pending";
  amount_eur: number;
};

type ProviderInvoice = {
  id: string;
  provider_name: string;
  payment_date: string;
  amount_eur: number;
  label?: string;
};

/** Order/invoice-derived rows must not use `rev-` / `pay-` — the forecast API treats those as DB ids. */
const DERIVED_REV_ID_PREFIX = "src-rev-";
const DERIVED_PAY_ID_PREFIX = "src-pay-";

function getForecastedRevenues(orders: OrderRow[]): ForecastItem[] {
  const items: ForecastItem[] = [];
  for (const o of orders) {
    if (o.payment_status !== "pending") continue;
    const dateYmd = normalizeToYMD(o.collection_date);
    if (!dateYmd) continue;
    items.push({
      id: `${DERIVED_REV_ID_PREFIX}${o.order_code}`,
      type: "revenue",
      label: `Order ${o.order_code} (${o.client_name})`,
      date: dateYmd,
      amount_eur: o.amount_eur,
      reference: o.order_code,
    });
  }
  return items.sort((a, b) => (a.date > b.date ? 1 : -1));
}

function providerInvoiceDisplayLabel(inv: ProviderInvoice) {
  const custom = inv.label != null && String(inv.label).trim() !== "";
  return custom ? String(inv.label).trim() : `${inv.provider_name} — ${inv.id}`;
}

function getForecastedPayments(invoices: ProviderInvoice[]): ForecastItem[] {
  return invoices
    .map((inv): ForecastItem | null => {
      const dateYmd = normalizeToYMD(inv.payment_date);
      if (!dateYmd) return null;
      return {
        id: `${DERIVED_PAY_ID_PREFIX}${inv.id}`,
        type: "payment",
        label: providerInvoiceDisplayLabel(inv),
        date: dateYmd,
        amount_eur: inv.amount_eur,
        reference: inv.id,
      };
    })
    .filter((row): row is ForecastItem => row != null)
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

function getLocalTodayYMD() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addYearsToYMD(ymd: string, years: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  dt.setFullYear(dt.getFullYear() + years);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

function extractConcept(row: ForecastItem) {
  return row.reference || row.id;
}

function extractProviderOrCustomer(row: ForecastItem) {
  if (!row.label) return row.reference || "";

  // Manual entries: "Revenue — CustomerName" / "Payment — ProviderName"
  if (row.label.startsWith("Revenue — ")) {
    return row.label.replace("Revenue — ", "").trim();
  }
  if (row.label.startsWith("Payment — ")) {
    return row.label.replace("Payment — ", "").trim();
  }

  // Base revenues: "Order <code> (<customerName>)"
  const revMatch = /^Order\s+\S+\s+\(([^)]+)\)\s*$/.exec(row.label.trim());
  if (revMatch?.[1]) return revMatch[1].trim();

  // Base payments: "<providerName> — <id>"
  if (row.label.includes(" — ")) {
    const [left] = row.label.split(" — ");
    if (left && left.trim().length > 0) return left.trim();
  }

  return row.reference || "";
}

const BanksPage: FC = () => {
  const router = useRouter();
  const { setPageMeta } = usePageContent();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [providerInvoices, setProviderInvoices] = useState<ProviderInvoice[]>([]);
  const [dbForecastItems, setDbForecastItems] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [actualBankValue, setActualBankValue] = useState<string>("");

  const [createModalOpen, setCreateModalOpen] = useState(false);

  /** Recalculated on each render so “today” stays correct and matches server dates. */
  const todayYMD = getLocalTodayYMD();

  const [activeTab, setActiveTab] = useState<"revenues" | "payments" | "all">("all");

  const defaultCurrentFromYMD = useMemo(() => addYearsToYMD(todayYMD, -1) ?? todayYMD, [todayYMD]);
  /** Default “extract as of” = today (statement-style snapshot). */
  const defaultCustomDateYMD = todayYMD;

  const [historyTab, setHistoryTab] = useState<"current" | "custom">("current");

  const [currentFromDraft, setCurrentFromDraft] = useState<string>(() =>
    ymdToDDMMYYYY(defaultCurrentFromYMD)
  );
  const [currentToDraft, setCurrentToDraft] = useState<string>(() =>
    ymdToDDMMYYYY(todayYMD)
  );
  const [showPaymentsDraft, setShowPaymentsDraft] = useState(true);
  const [showRevenuesDraft, setShowRevenuesDraft] = useState(true);

  const [currentFromAppliedYMD, setCurrentFromAppliedYMD] = useState<string>(defaultCurrentFromYMD);
  const [currentToAppliedYMD, setCurrentToAppliedYMD] = useState<string>(todayYMD);
  const [showPaymentsApplied, setShowPaymentsApplied] = useState(true);
  const [showRevenuesApplied, setShowRevenuesApplied] = useState(true);

  const [currentHistoryPage, setCurrentHistoryPage] = useState(0);
  const [currentHistoryError, setCurrentHistoryError] = useState<string | null>(null);

  const [customDateDraft, setCustomDateDraft] = useState<string>(() =>
    ymdToDDMMYYYY(defaultCustomDateYMD)
  );
  const [customDateAppliedYMD, setCustomDateAppliedYMD] = useState<string>(defaultCustomDateYMD);
  const [customHistoryError, setCustomHistoryError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ord, pay, manualItems] = await Promise.all([
        BillingService.getAllOrders(),
        ProviderService.getAllProviderInvoices(),
        BanksForecastService.getAllForecastedItems(),
      ]);
      setOrders(Array.isArray(ord) ? ord : []);
      setProviderInvoices(Array.isArray(pay) ? pay : []);
      setDbForecastItems(Array.isArray(manualItems) ? manualItems : []);
    } catch {
      setOrders([]);
      setProviderInvoices([]);
      setDbForecastItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const revenues = useMemo(() => {
    const base = getForecastedRevenues(orders);
    const extra = dbForecastItems
      .filter((i) => i.type === "revenue")
      .map((i) => ({ ...i, date: normalizeToYMD(i.date) }))
      .filter((i) => Boolean(i.date));
    const all = [...base, ...extra];
    return all.sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [orders, dbForecastItems]);

  const payments = useMemo(() => {
    const base = getForecastedPayments(providerInvoices);
    const extra = dbForecastItems
      .filter((i) => i.type === "payment")
      .map((i) => ({ ...i, date: normalizeToYMD(i.date) }))
      .filter((i) => Boolean(i.date));
    const all = [...base, ...extra];
    return all.sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [providerInvoices, dbForecastItems]);

  const allMovementsSorted = useMemo(() => {
    const all = [...revenues, ...payments];
    return all.sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [revenues, payments]);

  const movements = useMemo(() => {
    // Estimated bank position: only lines whose movement date is on or before today (exclude future-dated forecast).
    return allMovementsSorted.filter((i) => {
      const ymd = normalizeToYMD(i.date);
      return ymd !== "" && ymd <= todayYMD;
    });
  }, [allMovementsSorted, todayYMD]);

  const estimatedNet = useMemo(() => {
    let totalRevenues = 0;
    let totalPayments = 0;
    for (const item of movements) {
      if (item.type === "revenue") totalRevenues += item.amount_eur;
      if (item.type === "payment") totalPayments += item.amount_eur;
    }
    return {
      totalRevenues,
      totalPayments,
      net: totalRevenues - totalPayments,
    };
  }, [movements]);

  const actualBankValueNumber = useMemo(() => {
    if (!actualBankValue.trim()) return null;
    const n = Number(actualBankValue);
    return Number.isFinite(n) ? n : null;
  }, [actualBankValue]);

  const diff = useMemo(() => {
    if (actualBankValueNumber == null) return null;
    const d = actualBankValueNumber - estimatedNet.net;
    return Math.round(d * 100) / 100;
  }, [actualBankValueNumber, estimatedNet.net]);

  const CURRENT_HISTORY_PAGE_SIZE = 30;

  const currentHistoryFiltered = useMemo(() => {
    const from = currentFromAppliedYMD;
    const to = currentToAppliedYMD;

    let items = allMovementsSorted.filter((i) => {
      const ymd = normalizeToYMD(i.date);
      if (!ymd) return false;
      return ymd >= from && ymd <= to;
    });

    if (!showPaymentsApplied) {
      items = items.filter((i) => i.type !== "payment");
    }
    if (!showRevenuesApplied) {
      items = items.filter((i) => i.type !== "revenue");
    }

    return items;
  }, [
    allMovementsSorted,
    currentFromAppliedYMD,
    currentToAppliedYMD,
    showPaymentsApplied,
    showRevenuesApplied,
  ]);

  const currentHistoryTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(currentHistoryFiltered.length / CURRENT_HISTORY_PAGE_SIZE));
  }, [currentHistoryFiltered.length]);

  useEffect(() => {
    setCurrentHistoryPage((p) => Math.min(p, currentHistoryTotalPages - 1));
  }, [currentHistoryTotalPages]);

  const currentHistoryPageItems = useMemo(() => {
    const start = currentHistoryPage * CURRENT_HISTORY_PAGE_SIZE;
    return currentHistoryFiltered.slice(start, start + CURRENT_HISTORY_PAGE_SIZE);
  }, [currentHistoryFiltered, currentHistoryPage]);

  const handleUpdateCurrentHistory = useCallback(() => {
    setCurrentHistoryError(null);

    const fromYMD = ddmmyyyyToYMD(currentFromDraft);
    const toYMD = ddmmyyyyToYMD(currentToDraft);

    if (!fromYMD) {
      setCurrentHistoryError("Invalid 'Movements from' date. Use dd/mm/yyyy.");
      return;
    }
    if (!toYMD) {
      setCurrentHistoryError("Invalid 'to' date. Use dd/mm/yyyy.");
      return;
    }

    if (toYMD > todayYMD) {
      setCurrentHistoryError("'to' date cannot be after today.");
      return;
    }
    if (fromYMD > toYMD) {
      setCurrentHistoryError("'Movements from' cannot be after 'to'.");
      return;
    }
    if (!showPaymentsDraft && !showRevenuesDraft) {
      setCurrentHistoryError("Select at least one between 'show payments' and 'show revenues'.");
      return;
    }

    setCurrentFromAppliedYMD(fromYMD);
    setCurrentToAppliedYMD(toYMD);
    setShowPaymentsApplied(showPaymentsDraft);
    setShowRevenuesApplied(showRevenuesDraft);
    setCurrentHistoryPage(0);
  }, [
    currentFromDraft,
    currentToDraft,
    showPaymentsDraft,
    showRevenuesDraft,
    todayYMD,
  ]);

  /** All movements with date on or before the “extract as of” date (bank statement snapshot). */
  const customRowsAsOf = useMemo(() => {
    return allMovementsSorted.filter((i) => {
      const ymd = normalizeToYMD(i.date);
      return ymd !== "" && ymd <= customDateAppliedYMD;
    });
  }, [allMovementsSorted, customDateAppliedYMD]);

  /**
   * Running balance from oldest → newest (implicit opening 0), then rows reversed for display
   * (newest first), like a statement read from the as-of date backwards in time.
   */
  const customRowsWithBalance = useMemo(() => {
    const sortedAsc = [...customRowsAsOf].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      if (a.type !== b.type) return a.type === "revenue" ? -1 : 1;
      return a.label.localeCompare(b.label);
    });

    let running = 0;
    const forward = sortedAsc.map((row) => {
      running += row.type === "revenue" ? row.amount_eur : -row.amount_eur;
      return { row, balanceAfter: running };
    });

    return forward.reverse();
  }, [customRowsAsOf]);

  const handleUpdateCustomHistory = useCallback(() => {
    setCustomHistoryError(null);

    const dateYMD = ddmmyyyyToYMD(customDateDraft);
    if (!dateYMD) {
      setCustomHistoryError("Invalid date. Use dd/mm/yyyy (4-digit year).");
      return;
    }

    setCustomDateAppliedYMD(dateYMD);
  }, [customDateDraft]);

  useEffect(() => {
    setPageMeta({
      pageTitle: "Banks — Cash flow reconciliation",
      breadcrumbs: [
        { label: "Administration", href: "/logged/pages/administration" },
        { label: "Banks — Cash flow reconciliation" },
      ],
      buttons: [],
    });
  }, [setPageMeta]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
            <p className="text-gray-600 mb-2">
              Cash flow entries (revenues and payments). You can add past omissions
              or future movements.
            </p>

            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Add bank entry
              </button>
            </div>

            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveTab("all")}
                className={`
                  relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                  ${activeTab === "all" ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}
                `}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("revenues")}
                className={`
                  relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                  ${activeTab === "revenues" ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}
                `}
              >
                Forecasted revenues
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`
                  relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                  ${activeTab === "payments" ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}
                `}
              >
                Forecasted payments
              </button>
            </div>

            {activeTab === "all" ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Today</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatAdminDate(todayYMD)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-600">Estimated bank balance</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {estimatedNet.net.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      €
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Actual bank balance (for reconciliation)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    value={actualBankValue}
                    onChange={(e) => setActualBankValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="text-sm">
                    {actualBankValueNumber == null ? (
                      <span className="text-gray-600">
                        Enter your actual bank balance to see the difference.
                      </span>
                    ) : diff == null ? (
                      <span className="text-gray-600">Enter a valid number.</span>
                    ) : diff === 0 ? (
                      <span className="text-green-700 font-medium">
                        Difference {diff.toLocaleString()} € (reconciled)
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">
                        Difference {diff.toLocaleString()} € (adjust movements)
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex border-b border-gray-200 mb-4">
                    <button
                      type="button"
                      onClick={() => setHistoryTab("current")}
                      className={`
                        relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                        ${
                          historyTab === "current"
                            ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }
                      `}
                    >
                      Current bank movements history
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryTab("custom")}
                      className={`
                        relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                        ${
                          historyTab === "custom"
                            ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }
                      `}
                    >
                      Custom bank movements history
                    </button>
                  </div>

                  {historyTab === "current" ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                        <div className="flex flex-wrap gap-6 items-end justify-between">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">
                              Movements from
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="dd/mm/yyyy"
                              value={currentFromDraft}
                              onChange={(e) =>
                                setCurrentFromDraft(maskDDMMYYYY(e.target.value))
                              }
                              maxLength={10}
                              className="w-44 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">to</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="dd/mm/yyyy"
                              value={currentToDraft}
                              onChange={(e) =>
                                setCurrentToDraft(maskDDMMYYYY(e.target.value))
                              }
                              maxLength={10}
                              className="w-44 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-700">
                              Filters
                            </span>
                            <div className="flex flex-wrap items-center gap-4">
                              <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={showPaymentsDraft}
                                  onChange={(e) => setShowPaymentsDraft(e.target.checked)}
                                />
                                show payments
                              </label>
                              <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={showRevenuesDraft}
                                  onChange={(e) => setShowRevenuesDraft(e.target.checked)}
                                />
                                show revenues
                              </label>
                            </div>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={handleUpdateCurrentHistory}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                              Update
                            </button>
                          </div>
                        </div>

                        {currentHistoryError && (
                          <p className="text-red-600 text-sm" role="alert">
                            {currentHistoryError}
                          </p>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Label / Reference
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount (€)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                              <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                                  Loading bank movements…
                                </td>
                              </tr>
                            ) : currentHistoryPageItems.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                                  No movements found for the selected range.
                                </td>
                              </tr>
                            ) : (
                              currentHistoryPageItems.map((row) => {
                                const href =
                                  row.type === "payment"
                                    ? `/logged/pages/administration/banks/payments/${encodeURIComponent(
                                        row.id
                                      )}`
                                    : `/logged/pages/administration/banks/revenues/${encodeURIComponent(
                                        row.id
                                      )}`;

                                return (
                                  <tr
                                    key={row.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => router.push(href)}
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span
                                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                          row.type === "revenue"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-amber-100 text-amber-800"
                                        }`}
                                      >
                                        {row.type === "revenue" ? "Revenue" : "Payment"}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                      <div className="font-medium">{row.label}</div>
                                      {row.reference ? (
                                        <div className="text-xs text-gray-500">
                                          Ref: {row.reference}
                                        </div>
                                      ) : null}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {formatAdminDate(row.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                      {row.type === "payment" ? "-" : ""}
                                      {row.amount_eur.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentHistoryPage((p) => Math.max(0, p - 1))}
                          disabled={currentHistoryPage <= 0}
                          className="px-3 py-2 text-sm font-medium bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ←
                        </button>
                        <span className="text-sm text-gray-600">
                          Page {currentHistoryPage + 1} / {currentHistoryTotalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentHistoryPage((p) =>
                              Math.min(currentHistoryTotalPages - 1, p + 1)
                            )
                          }
                          disabled={currentHistoryPage >= currentHistoryTotalPages - 1}
                          className="px-3 py-2 text-sm font-medium bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">
                              Statement as-of date
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="dd/mm/yyyy"
                              value={customDateDraft}
                              onChange={(e) => setCustomDateDraft(maskDDMMYYYY(e.target.value))}
                              maxLength={10}
                              className="w-52 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleUpdateCustomHistory}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                          >
                            Update
                          </button>
                        </div>

                        <p className="text-xs text-gray-600">
                          As-of extract: all movements (past or forecast) with date on or before the
                          chosen day, listed from <span className="font-medium">newest to oldest</span>.
                          The balance after each row is the running total in chronological order from
                          an implicit opening balance of zero.
                        </p>

                        {customHistoryError && (
                          <p className="text-red-600 text-sm" role="alert">
                            {customHistoryError}
                          </p>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Movement
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Concept
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Provider/Customer
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Balance after op (€)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                              <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                                  Loading custom movements…
                                </td>
                              </tr>
                            ) : customRowsWithBalance.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                                  No movements on or before{" "}
                                  {formatAdminDate(customDateAppliedYMD)}.
                                </td>
                              </tr>
                            ) : (
                              customRowsWithBalance.map(({ row, balanceAfter }) => {
                                const href =
                                  row.type === "payment"
                                    ? `/logged/pages/administration/banks/payments/${encodeURIComponent(
                                        row.id
                                      )}`
                                    : `/logged/pages/administration/banks/revenues/${encodeURIComponent(
                                        row.id
                                      )}`;

                                const rowYmd = normalizeToYMD(row.date);
                                const occurred =
                                  rowYmd !== "" && rowYmd <= todayYMD;
                                return (
                                  <tr
                                    key={row.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => router.push(href)}
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span
                                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                          row.type === "revenue"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-amber-100 text-amber-800"
                                        }`}
                                      >
                                        {row.type === "revenue" ? "Revenue" : "Payment"}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {occurred ? "Occurred" : "Forecasted"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {formatAdminDate(row.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {extractConcept(row)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {extractProviderOrCustomer(row)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                      {balanceAfter.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}{" "}
                                      €
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label / Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (€)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                          Loading forecast…
                        </td>
                      </tr>
                    ) : (
                      (activeTab === "revenues" ? revenues : payments).map((row) => {
                        const href =
                          row.type === "payment"
                            ? `/logged/pages/administration/banks/payments/${encodeURIComponent(
                                row.id
                              )}`
                            : `/logged/pages/administration/banks/revenues/${encodeURIComponent(
                                row.id
                              )}`;

                        return (
                          <tr
                            key={row.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(href)}
                          >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                row.type === "revenue" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {row.type === "revenue" ? "Revenue" : "Payment"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{row.label}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatAdminDate(row.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {row.type === "payment" ? "-" : ""}
                            {row.amount_eur.toLocaleString()}
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
        </div>
      </PageContentSection>

      <ForecastedItemCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onPublished={loadData}
      />
    </>
  );
};

export default BanksPage;
