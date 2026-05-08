"use client";

import React, { FC, useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { BillingService } from "@/app/service/BillingService";
import {
  ddmmyyyyToYMD,
  formatAdminDate,
  maskDDMMYYYY,
  ymdToDDMMYYYY,
} from "../../adminDates";

type LinkedRevenueLite = {
  id?: string;
  expected_amount_eur?: number;
  real_amount_eur?: number | null;
  expected_date?: string;
  revenue_payment_status?: string;
};

type OrderRow = {
  order_code: string;
  contract_code: string;
  id_contract?: string;
  invoice_id?: string;
  invoice_state?: string;
  collection_date: string;
  payment_status: string;
  client_id: string;
  client_name: string;
  agent?: string;
  id_contact?: string;
  id_proposal?: string;
  amount_eur: number;
  revenue_id?: string;
  linked_revenue?: LinkedRevenueLite;
};

const OrderDetailPage: FC = () => {
  const params = useParams();
  const idOrder =
    typeof params?.id_order === "string"
      ? decodeURIComponent(params.id_order)
      : null;

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [collectionDraft, setCollectionDraft] = useState("");
  const [amountDraft, setAmountDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<"paid" | "pending">(
    "pending"
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncPromptOpen, setSyncPromptOpen] = useState(false);
  const [pendingPatch, setPendingPatch] = useState<{
    collection_date: string;
    amount_eur: number;
    payment_status: "paid" | "pending";
  } | null>(null);

  const loadOrder = useCallback(async () => {
    if (!idOrder) return;
    setLoading(true);
    setSaveError(null);
    try {
      const data = await BillingService.getOrderById(idOrder);
      setOrder(data ?? null);
      if (data) {
        setAmountDraft(String(data.amount_eur ?? ""));
        setCollectionDraft(ymdToDDMMYYYY(data.collection_date ?? ""));
        setStatusDraft(data.payment_status === "paid" ? "paid" : "pending");
      }
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [idOrder]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const { setPageMeta } = usePageContent();
  const ordersHref = "/logged/pages/administration/orders";

  useEffect(() => {
    const backBtn = [{ label: "Back to Orders", href: ordersHref }];
    if (!idOrder) {
      setPageMeta({
        pageTitle: "Invalid order",
        breadcrumbs: [
          { label: "Administration", href: ordersHref },
          { label: "Orders", href: ordersHref },
        ],
        buttons: backBtn,
      });
    } else if (!order) {
      setPageMeta({
        pageTitle: "Order not found",
        breadcrumbs: [
          { label: "Administration", href: ordersHref },
          { label: "Orders", href: ordersHref },
          { label: idOrder },
        ],
        buttons: backBtn,
      });
    } else {
      setPageMeta({
        pageTitle: `Order — ${order.order_code}`,
        breadcrumbs: [
          { label: "Administration", href: ordersHref },
          { label: "Orders", href: ordersHref },
          { label: order.order_code },
        ],
        buttons: backBtn,
      });
    }
  }, [idOrder, order, setPageMeta, ordersHref]);

  const beginSave = () => {
    setSaveError(null);
    const ymd = ddmmyyyyToYMD(collectionDraft);
    const amt = Number(amountDraft);
    if (!ymd) {
      setSaveError("Invalid collection date. Use dd/mm/yyyy.");
      return;
    }
    if (!Number.isFinite(amt) || amt < 0) {
      setSaveError("Invalid amount.");
      return;
    }
    setPendingPatch({
      collection_date: ymd,
      amount_eur: amt,
      payment_status: statusDraft,
    });
    setSyncPromptOpen(true);
  };

  const commitSave = async (syncRevenue: boolean) => {
    if (!idOrder || !pendingPatch) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await BillingService.updateOrder(idOrder, {
        ...pendingPatch,
        sync_revenue: syncRevenue,
      });
      setOrder(updated ?? null);
      setSyncPromptOpen(false);
      setPendingPatch(null);
      if (updated) {
        setAmountDraft(String(updated.amount_eur ?? ""));
        setCollectionDraft(ymdToDDMMYYYY(updated.collection_date ?? ""));
        setStatusDraft(updated.payment_status === "paid" ? "paid" : "pending");
      }
    } catch (e: unknown) {
      const msg =
        (e as { message?: string })?.message ??
        (typeof e === "string" ? e : null);
      setSaveError(msg ?? "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  if (!idOrder) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
            <p className="text-gray-500">Invalid order.</p>
          </div>
        </div>
      </PageContentSection>
    );
  }

  if (!order) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
            <p className="text-gray-500">
              {loading ? "Loading order…" : `Order not found: ${idOrder}`}
            </p>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const lr = order.linked_revenue;

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
            <p className="text-sm text-gray-600 mb-4 border-l-4 border-blue-200 pl-3 py-2 bg-blue-50/60 rounded-r max-w-2xl">
              <strong className="font-medium text-gray-800">Agreed vs real:</strong>{" "}
              this order carries the contractual agreement. Banks revenue mirrors
              expected and collected cash; discrepancies remain visible until you
              choose to synchronize from either screen.
            </p>

            <div className="overflow-hidden max-w-2xl">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Order ID
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 font-mono text-xs">
                      {order.order_code}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {order.id_contract ? (
                        <Link
                          href={`/logged/pages/account-management/contracts/${encodeURIComponent(order.id_contract)}`}
                          className="text-blue-600 hover:underline"
                        >
                          {order.contract_code}
                        </Link>
                      ) : (
                        order.contract_code
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {order.invoice_id ? (
                        <Link
                          href={`/logged/pages/administration/issued-invoices/${encodeURIComponent(order.invoice_id)}`}
                          className="text-blue-600 hover:underline"
                        >
                          {order.invoice_id}
                        </Link>
                      ) : (
                        <span className="text-gray-500">Not issued yet</span>
                      )}
                    </td>
                  </tr>
                  {order.revenue_id ? (
                    <tr>
                      <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Linked revenue
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <Link
                          href={`/logged/pages/administration/banks/revenues/${encodeURIComponent(order.revenue_id)}`}
                          className="text-blue-600 hover:underline font-mono text-xs"
                        >
                          {order.revenue_id}
                        </Link>
                      </td>
                    </tr>
                  ) : null}
                  {lr ? (
                    <tr>
                      <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase align-top tracking-wider">
                        Banks snapshot
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-800 space-y-1">
                        <div>
                          Expected:{" "}
                          <strong>{(lr.expected_amount_eur ?? 0).toLocaleString()} €</strong>
                        </div>
                        {lr.real_amount_eur != null ? (
                          <div>
                            Real collected:{" "}
                            <strong>{lr.real_amount_eur.toLocaleString()} €</strong>
                          </div>
                        ) : null}
                        <div className="text-xs text-gray-500">
                          Status in revenue:{" "}
                          <span className="font-medium text-gray-700">
                            {lr.revenue_payment_status ?? "—"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  <tr>
                    <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Collection date
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {formatAdminDate(order.collection_date)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment status
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          order.payment_status === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      <Link
                        href={`/logged/pages/account-management/customers_db/${encodeURIComponent(order.client_id)}`}
                        className="text-blue-600 hover:underline"
                      >
                        {order.client_name}
                      </Link>
                    </td>
                  </tr>
                  {order.id_contact ? (
                    <tr>
                      <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        <Link
                          href={`/logged/pages/account-management/contacts_db/${encodeURIComponent(order.id_contact)}`}
                          className="text-blue-600 hover:underline"
                        >
                          {order.id_contact}
                        </Link>
                      </td>
                    </tr>
                  ) : null}
                  {order.id_proposal ? (
                    <tr>
                      <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proposal
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        <Link
                          href={`/logged/pages/account-management/proposals/${encodeURIComponent(order.id_proposal)}`}
                          className="text-blue-600 hover:underline"
                        >
                          {order.id_proposal}
                        </Link>
                      </td>
                    </tr>
                  ) : null}
                  <tr>
                    <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount agreed (€)
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {order.amount_eur.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 max-w-md border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Edit contractual order terms
              </h3>
              {saveError ? (
                <p className="text-sm text-red-600" role="alert">
                  {saveError}
                </p>
              ) : null}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Collection date
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="dd/mm/yyyy"
                  value={collectionDraft}
                  onChange={(e) =>
                    setCollectionDraft(maskDDMMYYYY(e.target.value))
                  }
                  maxLength={10}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Amount (€)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={amountDraft}
                  onChange={(e) => setAmountDraft(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Payment status
                </label>
                <select
                  value={statusDraft}
                  onChange={(e) =>
                    setStatusDraft(e.target.value === "paid" ? "paid" : "pending")
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <button
                type="button"
                onClick={beginSave}
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Continue…
              </button>
            </div>

            {syncPromptOpen ? (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                role="dialog"
                aria-modal="true"
              >
                <div className="max-w-md rounded-xl bg-white p-6 shadow-xl">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    ¿Actualizar también el ingreso en Bancos?
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Se guardarán estos datos en la orden (lo pactado). ¿Quieres
                    aplicar también el mismo importe y fecha previstos y el estado
                    de cobro sobre el ingreso vinculado en Bancos?
                  </p>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-md px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
                      disabled={saving}
                      onClick={() => commitSave(false)}
                    >
                      No, solo orden
                    </button>
                    <button
                      type="button"
                      className="rounded-md px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      disabled={saving || !order.revenue_id}
                      onClick={() => commitSave(true)}
                    >
                      Sí, actualizar ingreso
                    </button>
                  </div>
                  {!order.revenue_id ? (
                    <p className="mt-3 text-xs text-amber-800">
                      There is no linked revenue row (`revenue_id`); syncing to
                      Banks is disabled for this order.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="mt-4 w-full text-sm text-gray-500 hover:text-gray-800"
                    disabled={saving}
                    onClick={() => {
                      setSyncPromptOpen(false);
                      setPendingPatch(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default OrderDetailPage;
