import type { MagazineIssue } from "@/app/contents/interfaces";

export type Step = 1 | 2 | 3;

export type IssueFormRow = MagazineIssue & { key: string };

export type FormState = {
  id_magazine: string;
  name: string;
  description: string;
  starting_year: string;
  periodicity: string;
  subscriber_number: string;
  num_issues: number;
  issues: IssueFormRow[];
  /** When true, do NOT auto-create next year issues at end of year (user checked the box). */
  doNotAutoCreateNextYearIssues: boolean;
};
