import type { PreferentialSlotApiRow } from "@/app/logged/pages/production/publications/publication_components/_shared";

export type PreferentialPagesTabId = "table-format" | "ui-format";

export type PortalRow = { id: number; key: string; name: string };

export type PendingPreferentialSlotRow = {
  preferential_slot_id: string;
  position_in_magazine: string;
  section_title: string;
  state: string;
  contract_id: string | null;
  assigned_customer_id: string | null;
  proposal_ids: string[];
  publication_id: string;
  publication_edition_name: string;
  publication_status: string;
  magazine_id: string | null;
  magazine_name: string | null;
  portal_names: string;
  service_group_id: string;
  service_group_name: string;
};

export type PublicationPreferentialSnapshot = {
  publication_id: string;
  publication_edition_name: string;
  publication_status: string;
  slots: PreferentialSlotApiRow[];
};

export function slotMatchesCustomer(slot: PreferentialSlotApiRow, customerId: string): boolean {
  const normalizedCustomerId = customerId.trim().toLowerCase();
  if (!normalizedCustomerId) return true;
  const assigned = String(slot.assigned_customer_id ?? "").trim().toLowerCase();
  if (assigned && assigned === normalizedCustomerId) return true;
  return (slot.proposal_summaries ?? []).some(
    (proposal) => String(proposal.customer_id ?? "").trim().toLowerCase() === normalizedCustomerId
  );
}

export function slotIsSold(slot: PreferentialSlotApiRow): boolean {
  const state = String(slot.state ?? "").trim().toLowerCase();
  return state === "bought" || Boolean(slot.contract_id?.trim());
}
