"use client";

import React, { FC, useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { BillingService } from "@/app/service/BillingService";
import { formatAdminDate } from "../../adminDates";

type OrderRow = {
  order_code: string;
  contract_code: string;
  id_contract?: string;
  invoice_id: string;
  invoice_state?: string;
  collection_date: string;
  payment_status: string;
  client_id: string;
  client_name: string;
  agent?: string;
  id_contact?: string;
  id_proposal?: string;
  amount_eur: number;
};

const OrderDetailPage: FC = () => {
  const params = useParams();
  const idOrder = typeof params?.id_order === "string" ? decodeURIComponent(params.id_order) : null;

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const loadOrder = useCallback(async () => {
    if (!idOrder) return;
    setLoading(true);
    try {
      const data = await BillingService.getOrderById(idOrder);
      setOrder(data ?? null);
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
  const backBtn = [{ label: "Back to Orders", href: ordersHref }];

  useEffect(() => {
    if (!idOrder) {
      setPageMeta({
        pageTitle: "Invalid order",
        breadcrumbs: [{ label: "Administration", href: ordersHref }, { label: "Orders", href: ordersHref }],
        buttons: backBtn,
      });
    } else if (!order) {
      setPageMeta({
        pageTitle: "Order not found",
        breadcrumbs: [{ label: "Administration", href: ordersHref }, { label: "Orders", href: ordersHref }, { label: idOrder }],
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
  }, [idOrder, order, setPageMeta]);

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

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
        <div className="overflow-hidden max-w-2xl">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Order
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">{order.order_code}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">
                  {order.id_contract ? (
                    <Link href={`/logged/pages/account-management/contracts/${encodeURIComponent(order.id_contract)}`} className="text-blue-600 hover:underline">
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
                  <Link href={`/logged/pages/administration/issued-invoices/${encodeURIComponent(order.invoice_id)}`} className="text-blue-600 hover:underline">
                    {order.invoice_id}
                  </Link>
                </td>
              </tr>
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
                  <Link href={`/logged/pages/account-management/customers_db/${encodeURIComponent(order.client_id)}`} className="text-blue-600 hover:underline">
                    {order.client_name}
                  </Link>
                </td>
              </tr>
              {order.id_contact && (
                <tr>
                  <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    <Link href={`/logged/pages/account-management/contacts_db/${encodeURIComponent(order.id_contact)}`} className="text-blue-600 hover:underline">
                      {order.id_contact}
                    </Link>
                  </td>
                </tr>
              )}
              {order.id_proposal && (
                <tr>
                  <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proposal
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    <Link href={`/logged/pages/account-management/proposals/${encodeURIComponent(order.id_proposal)}`} className="text-blue-600 hover:underline">
                      {order.id_proposal}
                    </Link>
                  </td>
                </tr>
              )}
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount (€)
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">
                  {order.amount_eur.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default OrderDetailPage;
