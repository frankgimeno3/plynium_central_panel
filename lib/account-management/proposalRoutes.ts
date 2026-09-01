export const PROPOSALS_BASE = "/logged/pages/account-management/proposals";

export const normalizeProposalStatus = (s: string | undefined | null): string =>
  String(s ?? "")
    .trim()
    .toLowerCase();

/** Draft rows open the wizard; other statuses open the detail page. */
export const getProposalRowHref = (
  idProposal: string,
  options: { activeTabStatus: string; rowStatus?: string }
): string => {
  const id = encodeURIComponent(idProposal.trim());
  const onDraftTab = normalizeProposalStatus(options.activeTabStatus) === "draft";
  const rowIsDraft = normalizeProposalStatus(options.rowStatus) === "draft";
  if (onDraftTab || rowIsDraft) {
    return `${PROPOSALS_BASE}/create/${id}`;
  }
  return `${PROPOSALS_BASE}/${id}`;
};

export const getProposalWizardHref = (idProposal: string): string =>
  `${PROPOSALS_BASE}/create/${encodeURIComponent(idProposal.trim())}`;

export const getProposalDetailHref = (idProposal: string): string =>
  `${PROPOSALS_BASE}/${encodeURIComponent(idProposal.trim())}`;

/** New draft wizard prefilled from an existing proposal (variation). */
export const getProposalVariationCreateHref = (sourceProposalId: string): string =>
  `${PROPOSALS_BASE}/create/from/${encodeURIComponent(sourceProposalId.trim())}`;

/** Edit products & payments (wizard steps 2–4) for an existing proposal. */
export const getProposalEditHref = (idProposal: string): string =>
  `${PROPOSALS_BASE}/edit/${encodeURIComponent(idProposal.trim())}`;
