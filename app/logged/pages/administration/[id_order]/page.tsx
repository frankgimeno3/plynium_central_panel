"use client";

import React, { FC, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import issuedInvoicesData from "@/app/contents/issued_invoices.json";
import contractsData from "@/app/contents/contracts.json";
import type { AdministrationContract, OrderRow } from "@/app/contents/interfaces";

type ContractRow = { id_contract: string; id_proposal: string };

function findOrderByCode(
  contracts: AdministrationContract[],
  orderCode: string
): OrderRow | null {
  for (const c of contracts) {
    for (const inv of c.invoices) {
      for (const order of inv.orders) {
        if (order.order_code === orderCode) {
          return {
            order_code: order.order_code,
            contract_code: c.contract_code,
            id_contract: c.id_contract,
            invoice_id: inv.invoice_id,
            invoice_state: inv.invoice_state,
            collection_date: order.collection_date,
            payment_status: order.status,
            client_id: c.client_id,
            client_name: c.client_name,
            agent: order.agent ?? c.agent,
            id_contact: order.id_contact,
            id_proposal: (contractsData as ContractRow[]).find((x) => x.id_contract === c.id_contract)?.id_proposal,
            amount_eur: order.amount_eur,
          };
        }
      }
    }
  }
  return null;
}

const OrderDetailPage: FC = () => {
  const params = useParams();
  const idOrder = typeof params?.id_order === "string" ? decodeURIComponent(params.id_order) : null;

  const order = useMemo(() => {
    if (!idOrder) return null;
    return findOrderByCode(issuedInvoicesData as AdministrationContract[], idOrder);
  }, [idOrder]);

  const { setPageMeta } = usePageContent();
  const backBtn = [{ label: "Back to Orders", href: "/logged/pages/administration" }];

  useEffect(() => {
    if (!idOrder) {
      setPageMeta({
        pageTitle: "Invalid order",
        breadcrumbs: [{ label: "Administration", href: "/logged/pages/administration" }, { label: "Orders", href: "/logged/pages/administration" }],
        buttons: backBtn,
      });
    } else if (!order) {
      setPageMeta({
        pageTitle: "Order not found",
        breadcrumbs: [{ label: "Administration", href: "/logged/pages/administration" }, { label: "Orders", href: "/logged/pages/administration" }, { label: idOrder }],
        buttons: backBtn,
      });
    } else {
      setPageMeta({
        pageTitle: `Order — ${order.order_code}`,
        breadcrumbs: [
          { label: "Administration", href: "/logged/pages/administration" },
          { label: "Orders", href: "/logged/pages/administration" },
          { label: order.order_code },
        ],
        buttons: backBtn,
      });
    }
  }, [idOrder, order, setPageMeta]);

  if (!idOrder) {
    return (
      <PageContentSection>
        <p className="text-gray-500">Invalid order.</p>
      </PageContentSection>
    );
  }

  if (!order) {
    return (
      <PageContentSection>
        <p className="text-gray-500">Order not found: {idOrder}</p>
      </PageContentSection>
    );
  }

  return (
    <>
      <PageContentSection>
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
                <td className="px-6 py-3 text-sm text-gray-900">{order.collection_date}</td>
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
      </PageContentSection>
    </>
  );
};

export default OrderDetailPage;
