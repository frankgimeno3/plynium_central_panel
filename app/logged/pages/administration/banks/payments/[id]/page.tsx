"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { BanksForecastService } from "@/app/service/BanksForecastService";
import { ProviderService } from "@/app/service/ProviderService";
import {
  ddmmyyyyToYMD,
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

type ForecastPaymentApi = ForecastItem & {
  id_provider?: string;
  provider_name?: string;
};

type ProviderRow = { id_provider: string; name: string };

const BASE_BACK = "/logged/pages/administration/banks";

/** Must match banks page — derived from provider invoices, not payments_db. */
const DERIVED_PAY_ID_PREFIX = "src-pay-";

function invoiceToForecastPaymentItem(
  id: string,
  inv: {
    id: string;
    id_provider?: string;
    provider_name?: string;
    label?: string;
    payment_date?: string;
    amount_eur?: number;
  }
): ForecastItem {
  const ymd =
    typeof inv.payment_date === "string"
      ? inv.payment_date.slice(0, 10)
      : "";
  const defaultLabel = `${inv.provider_name ?? ""} — ${inv.id}`;
  return {
    id,
    type: "payment",
    label: inv.label?.trim() ? inv.label.trim() : defaultLabel,
    date: ymd,
    amount_eur: Number(inv.amount_eur) || 0,
    reference: inv.id,
  };
}

const PaymentEditPage: FC = () => {
  const router = useRouter();
  const params = useParams();

  const id = useMemo(() => {
    const raw = params?.id;
    return typeof raw === "string" ? decodeURIComponent(raw) : null;
  }, [params]);

  const [item, setItem] = useState<ForecastItem | null>(null);
  const [itemSource, setItemSource] = useState<"forecast" | "provider" | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const [providers, setProviders] = useState<ProviderRow[]>([]);

  const [labelDraft, setLabelDraft] = useState("");
  const [idProvider, setIdProvider] = useState("");
  const [providerNameDraft, setProviderNameDraft] = useState("");

  const [amountEur, setAmountEur] = useState<string>("");
  const parsedAmountEur = useMemo(() => {
    const n = Number(amountEur);
    return Number.isFinite(n) ? n : null;
  }, [amountEur]);

  const [paymentDateDraft, setPaymentDateDraft] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await ProviderService.getAllProviders();
        if (!cancelled && Array.isArray(list)) {
          setProviders(
            list.map((p: { id_provider?: string; name?: string }) => ({
              id_provider: String(p.id_provider ?? ""),
              name: String(p.name ?? ""),
            }))
          );
        }
      } catch {
        if (!cancelled) setProviders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyProviderSelection = useCallback(
    (nextId: string) => {
      setIdProvider(nextId);
      const p = providers.find((x) => x.id_provider === nextId);
      setProviderNameDraft(p?.name ?? "");
    },
    [providers]
  );

  const providerSelectOptions = useMemo(() => {
    const seen = new Set(providers.map((p) => p.id_provider));
    const extra: ProviderRow[] = [];
    if (idProvider && !seen.has(idProvider)) {
      extra.push({
        id_provider: idProvider,
        name: providerNameDraft || idProvider,
      });
    }
    return [...extra, ...providers];
  }, [providers, idProvider, providerNameDraft]);

  const loadItem = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setItemSource(null);
    setPaymentDateDraft("");
    setLabelDraft("");
    setIdProvider("");
    setProviderNameDraft("");
    try {
      if (id.startsWith(DERIVED_PAY_ID_PREFIX)) {
        const invId = id.slice(DERIVED_PAY_ID_PREFIX.length);
        const inv = await ProviderService.getProviderInvoiceById(invId);
        const mapped = invoiceToForecastPaymentItem(id, inv);
        setItem(mapped);
        setAmountEur(String(mapped.amount_eur));
        setPaymentDateDraft(ymdToDDMMYYYY(mapped.date || ""));
        setLabelDraft(
          typeof inv.label === "string" && inv.label.trim() !== ""
            ? inv.label.trim()
            : ""
        );
        setIdProvider(inv.id_provider ?? "");
        setProviderNameDraft(inv.provider_name ?? "");
        setItemSource("provider");
        return;
      }

      try {
        const data = (await BanksForecastService.getForecastedItemById(
          id
        )) as ForecastPaymentApi | null;
        if (data && data.type === "payment") {
          setItem(data);
          setAmountEur(String(data.amount_eur));
          setPaymentDateDraft(ymdToDDMMYYYY(data.date || ""));
          setLabelDraft(typeof data.label === "string" ? data.label : "");
          setIdProvider(data.id_provider ?? "");
          setProviderNameDraft(data.provider_name ?? "");
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

      if (id.startsWith("pay-")) {
        const invId = id.slice(4);
        if (invId) {
          try {
            const inv = await ProviderService.getProviderInvoiceById(invId);
            const mapped = invoiceToForecastPaymentItem(id, inv);
            setItem(mapped);
            setAmountEur(String(mapped.amount_eur));
            setPaymentDateDraft(ymdToDDMMYYYY(mapped.date || ""));
            setLabelDraft(
              typeof inv.label === "string" && inv.label.trim() !== ""
                ? inv.label.trim()
                : ""
            );
            setIdProvider(inv.id_provider ?? "");
            setProviderNameDraft(inv.provider_name ?? "");
            setItemSource("provider");
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
        pageTitle: "Edit payment",
        breadcrumbs: [
          { label: "Administration", href: "/logged/pages/administration" },
          { label: "Banks", href: BASE_BACK },
          { label: "Edit payment" },
        ],
        buttons: [{ label: "Back to Banks", href: BASE_BACK }],
      });
      return;
    }

    if (!item) {
      setPageMeta({
        pageTitle: "Payment not found",
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
      pageTitle: `Edit payment — ${item.id}`,
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

    const paymentYmd = ddmmyyyyToYMD(paymentDateDraft);
    if (!paymentYmd) {
      setError("Invalid payment date. Use dd/mm/yyyy.");
      return;
    }

    if (itemSource === "provider") {
      if (!item.reference) {
        setError("Missing invoice id.");
        return;
      }
      if (!idProvider.trim()) {
        setError("Select a provider.");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      if (itemSource === "forecast") {
        await BanksForecastService.updateForecastedItem(id, {
          amount_eur: parsedAmountEur,
          label: labelDraft.trim(),
          id_provider: idProvider.trim() || "",
          provider_name: providerNameDraft,
          payment_date: paymentYmd,
        });
      } else {
        await ProviderService.updateProviderInvoice(item.reference, {
          amount_eur: parsedAmountEur,
          payment_date: paymentYmd,
          id_provider: idProvider.trim(),
          provider_name: providerNameDraft.trim(),
          label: labelDraft.trim(),
        });
      }
      router.push(BASE_BACK);
    } catch (e: unknown) {
      const msg =
        (e as { message?: string; data?: { message?: string } })?.message ??
        (e as { data?: { message?: string } })?.data?.message ??
        (typeof e === "string" ? e : null);
      setError(msg ?? "Failed to save payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <div className="bg-white rounded-b-lg overflow-hidden p-6">
          {!id ? (
            <p className="text-gray-500">Invalid payment id.</p>
          ) : loading ? (
            <p className="text-gray-500">Loading payment…</p>
          ) : !item ? (
            <p className="text-gray-500">Payment not found.</p>
          ) : (
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Edit payment
              </h2>

              <div className="space-y-2 mb-6 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Reference:</span>{" "}
                  {item.reference || "—"}
                </div>
                {itemSource === "forecast" ? (
                  <p className="text-xs text-gray-500">
                    Manual bank forecast entry (payments_db).
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Provider invoice record.
                  </p>
                )}
              </div>

              {error && (
                <p className="mb-4 text-red-600 text-sm" role="alert">
                  {error}
                </p>
              )}

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={labelDraft}
                    onChange={(e) => setLabelDraft(e.target.value)}
                    maxLength={512}
                    placeholder={
                      itemSource === "provider"
                        ? `Default: ${providerNameDraft || "Provider"} — ${item.reference}`
                        : "Payment description"
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to use the default title (provider — invoice id)
                    on the banks list.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider
                  </label>
                  <select
                    value={idProvider}
                    onChange={(e) => applyProviderSelection(e.target.value)}
                    className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {itemSource === "forecast" ? (
                      <option value="">— None —</option>
                    ) : null}
                    {providerSelectOptions.map((p) => (
                      <option key={p.id_provider} value={p.id_provider}>
                        {p.name || p.id_provider}
                      </option>
                    ))}
                  </select>
                  {itemSource === "forecast" && !idProvider ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Optional link to a provider catalog entry.
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment date
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="dd/mm/yyyy"
                    value={paymentDateDraft}
                    onChange={(e) =>
                      setPaymentDateDraft(maskDDMMYYYY(e.target.value))
                    }
                    maxLength={10}
                    className="w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

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

export default PaymentEditPage;
