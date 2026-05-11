export const MAGAZINES_BASE = "/logged/pages/production/publications/magazines";
export const MAX_ISSUES_PER_YEAR = 12;
export const DELETE_CONFIRM_WORD = "confirm";

export const PERIODICITY_OPTIONS = [
  { value: "Annually", label: "Annually" },
  { value: "Semiannually", label: "Semiannually" },
  { value: "Every four months", label: "Every four months" },
  { value: "Quarterly", label: "Quarterly" },
  { value: "Bimonthly", label: "Bimonthly" },
  { value: "Monthly", label: "Monthly" },
] as const;

export const FORMAT_OPTIONS = [
  { value: "informer", label: "Informer" },
  { value: "flipbook", label: "Flipbook" },
  { value: "both", label: "Both" },
] as const;

export const MONTH_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
  value: m,
  label: new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" }),
}));
