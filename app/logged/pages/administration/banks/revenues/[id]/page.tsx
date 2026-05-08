"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { BanksForecastService } from "@/app/service/BanksForecastService";
import { BillingService } from "@/app/service/BillingService";
import Link from "next/link";
import {
  ddmmyyyyToYMD,
  formatAdminDate,
  maskDDMMYYYY,
  ymdToDDMMYYYY,
} from "../../../adminDates";

type ForecastRevenueItem = {
  id: string;
  type: "revenue" | "payment";
  label: string;
  date: string;
  amount_eur: number;
  reference: string;
  order_id?: string;
  revenue_payment_status?: string;
  revenue_real_amount_eur?: number | null;
};

type OrderRowLite = {
  order_code: string;
  payment_status?: string;
  collection_date?: string;
  amount_eur?: number;
  linked_revenue?: {
    expected_amount_eur?: number;
    real_amount_eur?: number | null;
    revenue_payment_status?: string;
  };
};

const BASE_BACK = "/logged/pages/administration/banks";

const DERIVED_REV_ID_PREFIX = "src-rev-";

function orderToForecastRevenueItem(
  fid: string,
  o: OrderRowLite
): ForecastRevenueItem {
  const ymd =
    typeof o.collection_date === "string"
      ? o.collection_date.slice(0, 10)
      : "";
  return {
    id: fid,
    type: "revenue",
    label: `Order ${o.order_code} (${""})`,
    date: ymd,
    amount_eur: Number(o.amount_eur) || 0,
    reference: o.order_code,
    order_id: o.order_code,
    revenue_payment_status: o.payment_status,
  };
}

const RevenueEditPage: FC = () => {
  const router = useRouter();
  const params = useParams();

  const id = useMemo(() => {
    const raw = params?.id;
    return typeof raw === "string" ? decodeURIComponent(raw) : null;
  }, [params]);

  const [item, setItem] = useState<ForecastRevenueItem | null>(null);
  const [itemSource, setItemSource] = useState<"forecast" | "order" | null>(
    null
  );
  const [linkedOrder, setLinkedOrder] = useState<OrderRowLite | null>(null);
  const [loading, setLoading] = useState(true);

  const [amountEur, setAmountEur] = useState<string>("");
  const [realAmountEur, setRealAmountEur] = useState<string>("");
  const parsedAmountEur = useMemo(() => {
    const n = Number(amountEur);
    return Number.isFinite(n) ? n : null;
  }, [amountEur]);
  const parsedRealAmountEur = useMemo(() => {
    const s = realAmountEur.trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }, [realAmountEur]);

  const [forecastDateDraft, setForecastDateDraft] = useState("");
  const [collectionDateDraft, setCollectionDateDraft] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">(
    "pending"
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Modal before persisting changes */
  const [syncPrompt, setSyncPrompt] = useState<{
    kind: "forecast" | "order";
    payload: Record<string, unknown>;
  } | null>(null);

  const loadItem = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setItemSource(null);
    setLinkedOrder(null);
    setCollectionDateDraft("");
    setForecastDateDraft("");
    setPaymentStatus("pending");
    setRealAmountEur("");
    try {
      if (id.startsWith(DERIVED_REV_ID_PREFIX)) {
        const code = id.slice(DERIVED_REV_ID_PREFIX.length);
        const order = await BillingService.getOrderById(code);
        const mapped = orderToForecastRevenueItem(id, order);
        mapped.label = `Order ${order.order_code} (${order.client_name ?? ""})`;
        setItem(mapped);
        setAmountEur(String(mapped.amount_eur));
        setCollectionDateDraft(ymdToDDMMYYYY(mapped.date || ""));
        setPaymentStatus(
          order.payment_status === "paid" ? "paid" : "pending"
        );
        setItemSource("order");
        setLinkedOrder(null);
        return;
      }

      try {
        const data = await BanksForecastService.getForecastedItemById(id);
        if (data && data.type === "revenue") {
          const rev = data as ForecastRevenueItem;
          setItem(rev);
          setAmountEur(String(data.amount_eur));
          setForecastDateDraft(ymdToDDMMYYYY(data.date?.slice(0, 10) ?? ""));
          setPaymentStatus(
            data.revenue_payment_status === "paid" ? "paid" : "pending"
          );
          if (
            data.revenue_real_amount_eur != null &&
            typeof data.revenue_real_amount_eur === "number"
          ) {
            setRealAmountEur(String(data.revenue_real_amount_eur));
          }
          setItemSource("forecast");
          const oid = (rev.order_id || rev.reference || "").trim();
          if (oid) {
            try {
              const o = await BillingService.getOrderById(oid);
              setLinkedOrder({
                order_code: o.order_code,
                payment_status: o.payment_status,
                collection_date: o.collection_date,
                amount_eur: o.amount_eur,
                linked_revenue: o.linked_revenue,
              });
            } catch {
              setLinkedOrder(null);
            }
          }
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
            mapped.label = `Order ${order.order_code} (${order.client_name ?? ""})`;
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

  const runForecastSaveWithSyncChoice = async (syncOrder: boolean) => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const p = syncPrompt?.payload;
      await BanksForecastService.updateForecastedItem(id, {
        ...(typeof p === "object" && p !== null ? p : {}),
        sync_order: syncOrder,
      });
      setSyncPrompt(null);
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

  const runOrderSaveWithSyncChoice = async (syncRevenue: boolean) => {
    if (!item?.reference && !linkedOrder?.order_code) return;
    const code = linkedOrder?.order_code || item!.reference;

    const collectionYmd: string | null = ddmmyyyyToYMD(collectionDateDraft);
    if (!collectionYmd) {
      setError("Invalid collection date. Use dd/mm/yyyy.");
      return;
    }

    const p = syncPrompt?.payload;
    setSaving(true);
    setError(null);
    try {
      await BillingService.updateOrder(code, {
        ...(typeof p === "object" && p !== null ? p : {}),
        sync_revenue: syncRevenue,
      });
      setSyncPrompt(null);
      router.push(BASE_BACK);
    } catch (e: unknown) {
      const msg =
        (e as { message?: string; data?: { message?: string } })?.message ??
        (e as { data?: { message?: string } })?.data?.message ??
        (typeof e === "string" ? e : null);
      setError(msg ?? "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  /** Validate and open modal (always for forecast edits; always for order-based edits too) */
  const handleSaveClick = () => {
    if (!id || !item || !itemSource) return;
    setError(null);
    if (parsedAmountEur == null || parsedAmountEur < 0) {
      setError("Invalid amount. Use a number >= 0.");
      return;
    }
    if (parsedRealAmountEur != null && parsedRealAmountEur < 0) {
      setError("Invalid real amount. Use a number >= 0 or leave empty.");
      return;
    }

    if (itemSource === "forecast") {
      const forecastYmd = ddmmyyyyToYMD(forecastDateDraft);
      if (!forecastYmd) {
        setError("Invalid forecast date. Use dd/mm/yyyy.");
        return;
      }
      setSyncPrompt({
        kind: "forecast",
        payload: {
          amount_eur: parsedAmountEur,
          date: forecastYmd,
          revenue_payment_status: paymentStatus,
          revenue_real_amount_eur:
            parsedRealAmountEur === null ? null : parsedRealAmountEur,
        },
      });
      return;
    }

    const collectionYmd: string | null = ddmmyyyyToYMD(collectionDateDraft);
    if (!collectionYmd) {
      setError("Invalid collection date. Use dd/mm/yyyy.");
      return;
    }
    if (!item.reference) {
      setError("Missing order code.");
      return;
    }

    setSyncPrompt({
      kind: "order",
      payload: {
        collection_date: collectionYmd,
        amount_eur: parsedAmountEur,
        payment_status: paymentStatus,
      },
    });
  };

  const orderHref = linkedOrder?.order_code
    ? `/logged/pages/administration/orders/${encodeURIComponent(linkedOrder.order_code)}`
    : null;

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
            <div className="max-w-2xl space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {itemSource === "order"
                  ? "Edit collection (order)"
                  : "Edit revenue (Banks)"}
              </h2>

              <p className="text-sm text-gray-600 border-l-4 border-blue-200 pl-3 py-2 bg-blue-50/60 rounded-r">
                <strong className="font-medium text-gray-800">Administración:</strong>{" "}
                la orden refleja lo pactado por contrato; el ingreso en Bancos refleja la
                previsión y, si procede, el cobro real. Si solo cambias el ingreso y no la
                orden, ambos pueden diferir hasta que sincronices.
              </p>

              <div className="space-y-2">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Label:</span> {item.label}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Order ID (link):</span>{" "}
                  {item.order_id || item.reference ? (
                    <span className="font-mono text-xs">{item.order_id || item.reference}</span>
                  ) : (
                    "—"
                  )}
                </div>
              </div>

              {linkedOrder?.order_code && orderHref ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                  <div className="font-medium text-gray-800 mb-2">
                    Linked order (agreed contract terms)
                  </div>
                  <div className="grid gap-1 text-gray-700">
                    <div>
                      Order:{" "}
                      <Link href={orderHref} className="text-blue-600 hover:underline font-mono text-xs">
                        {linkedOrder.order_code}
                      </Link>
                    </div>
                    <div>
                      Agreed amount:{" "}
                      {(linkedOrder.amount_eur ?? 0).toLocaleString()} € — status:{" "}
                      <span className="font-medium">{linkedOrder.payment_status}</span>
                    </div>
                    <div>
                      Collection (order):{" "}
                      {formatAdminDate(linkedOrder.collection_date || "") || "—"}
                    </div>
                  </div>
                </div>
              ) : null}

              {itemSource === "forecast" && linkedOrder ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                  Comparación: orden (pactado){" "}
                  <strong>{(linkedOrder.amount_eur ?? 0).toLocaleString()} €</strong> vs este
                  ingreso (previsto) <strong>{parsedAmountEur?.toLocaleString() ?? item.amount_eur.toLocaleString()} €</strong>
                  {parsedRealAmountEur != null ? (
                    <> vs cobro real <strong>{parsedRealAmountEur.toLocaleString()} €</strong></>
                  ) : item.revenue_real_amount_eur != null ? (
                    <> vs cobro real registrado <strong>{Number(item.revenue_real_amount_eur).toLocaleString()} €</strong></>
                  ) : null}
                </div>
              ) : null}

              {error && (
                <p className="text-red-600 text-sm" role="alert">
                  {error}
                </p>
              )}

              {itemSource === "forecast" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Forecast date (expected)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/yyyy"
                      value={forecastDateDraft}
                      onChange={(e) =>
                        setForecastDateDraft(maskDDMMYYYY(e.target.value))
                      }
                      maxLength={10}
                      className="w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment status (revenue record)
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Real collected amount (€), optional
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={realAmountEur}
                      onChange={(e) => setRealAmountEur(e.target.value)}
                      placeholder="Leave empty if same as forecast"
                      className="w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  Changes below update the order (agreed terms). You will be asked whether
                  to mirror expected fields on the linked Banks revenue.
                </p>
              )}

              {itemSource === "order" ? (
                <div className="space-y-4">
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
                  {itemSource === "forecast"
                    ? "Expected amount (€)"
                    : "Amount — order (€)"}
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
                  onClick={handleSaveClick}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue…
                </button>
              </div>

              {syncPrompt ? (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="max-w-md rounded-xl bg-white p-6 shadow-xl">
                    {syncPrompt.kind === "forecast" ? (
                      <>
                        <h3 className="text-base font-semibold text-gray-900 mb-2">
                          ¿Actualizar también la orden?
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                          Los cambios se guardan primero en el ingreso en Bancos
                          (previsión/fecha prevista/importe real cuando lo indiques).
                          ¿Quieres que la orden vinculada por el mismo order ID también
                          se actualice con el importe y fecha previstos y el estado de
                          cobro, manteniendo alineados lo pactado y la previsión?
                        </p>
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-md px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
                            onClick={() => runForecastSaveWithSyncChoice(false)}
                            disabled={saving}
                          >
                            No, solo ingreso
                          </button>
                          <button
                            type="button"
                            className="rounded-md px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            onClick={() => runForecastSaveWithSyncChoice(true)}
                            disabled={saving}
                          >
                            Sí, actualizar orden
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-base font-semibold text-gray-900 mb-2">
                          ¿Actualizar también el ingreso en Bancos?
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                          Los cambios se guardan en la orden (contrato pactado).
                          ¿Replicamos el importe y fecha previstos y el estado de cobro
                          en la fila de ingreso enlazada de Bancos?
                        </p>
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-md px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
                            onClick={() => runOrderSaveWithSyncChoice(false)}
                            disabled={saving}
                          >
                            No, solo orden
                          </button>
                          <button
                            type="button"
                            className="rounded-md px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            onClick={() => runOrderSaveWithSyncChoice(true)}
                            disabled={saving}
                          >
                            Sí, actualizar ingreso
                          </button>
                        </div>
                      </>
                    )}
                    <button
                      type="button"
                      className="mt-4 w-full text-sm text-gray-500 hover:text-gray-800"
                      disabled={saving}
                      onClick={() => setSyncPrompt(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </PageContentSection>
  );
};

export default RevenueEditPage;
