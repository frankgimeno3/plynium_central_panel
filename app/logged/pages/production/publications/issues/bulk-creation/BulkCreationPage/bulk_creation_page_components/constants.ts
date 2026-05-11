import type { Magazine } from "@/app/contents/interfaces";
import type { PlannedIssueSlot, PublicationFormat } from "../../issueBulkPlan";

export const BASE = "/logged/pages/production/publications";
export const ISSUES_URL = `${BASE}/issues`;
export const HORIZON_DAYS = 365;

export const FORMAT_OPTIONS: { value: PublicationFormat; label: string }[] = [
  { value: "informer", label: "Informer" },
  { value: "flipbook", label: "Flipbook" },
  { value: "both", label: "Both" },
];

export type WizardStep = 1 | 2 | 3 | 4;

export const stepLabels: Record<WizardStep, string> = {
  1: "Select magazines",
  2: "Review & configure",
  3: "Summary",
  4: "Creating",
};

export type MagazinePlan = {
  magazine: Magazine;
  slots: PlannedIssueSlot[];
  loadError: string | null;
};
