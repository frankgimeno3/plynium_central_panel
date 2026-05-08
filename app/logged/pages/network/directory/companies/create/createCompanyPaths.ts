/** Canonical URL for “create directory company” prefilled from a CRM customer (`customers_db`). */
export function hrefCreateCompanyFromCustomer(customerId: string) {
  const id = String(customerId ?? "").trim();
  return `/logged/pages/network/directory/companies/create/from_customer/${encodeURIComponent(id)}`;
}
