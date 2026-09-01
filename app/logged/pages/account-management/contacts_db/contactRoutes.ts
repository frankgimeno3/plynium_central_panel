const CONTACTS_BASE = "/logged/pages/account-management/contacts_db";

export function getContactCreateFromProposalHref(idProposal: string): string {
  return `${CONTACTS_BASE}/create/from/${encodeURIComponent(idProposal.trim())}`;
}
