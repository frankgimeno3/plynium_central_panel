export type PublicationFormat = "informer" | "flipbook" | "both";

export type ExistingPublicationRow = {
  id_publication: string;
  publication_status: string;
  publication_year: number | null;
  magazine_this_year_issue: number | null;
  publication_expected_publication_month: number | null;
};

export type PlannedIssueSlot = {
  key: string;
  magazineId: string;
  publicationYear: number;
  issueInYear: number;
  expectedMonth: number;
  expectedDate: string;
  exists: boolean;
  existingPublicationId?: string;
  is_special_edition: boolean;
  publication_theme: string;
  publication_format: PublicationFormat;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function issuesPerYearFromPeriodicity(periodicity: string | undefined | null): number {
  const p = String(periodicity ?? "")
    .trim()
    .toLowerCase();
  if (p === "annually") return 1;
  if (p === "semiannually") return 2;
  if (p === "every four months") return 3;
  if (p === "quarterly") return 4;
  if (p === "bimonthly") return 6;
  if (p === "monthly") return 12;
  return 0;
}

export function expectedMonthForIssue(periodicity: string | undefined | null, issueInYear: number): number | null {
  const perYear = issuesPerYearFromPeriodicity(periodicity);
  if (perYear < 1 || issueInYear < 1 || issueInYear > perYear) return null;
  if (perYear === 12) return issueInYear;
  if (perYear === 6) return issueInYear * 2 - 1;
  if (perYear === 4) return (issueInYear - 1) * 3 + 1;
  if (perYear === 3) return (issueInYear - 1) * 4 + 1;
  if (perYear === 2) return issueInYear === 1 ? 1 : 7;
  return 1;
}

export function lastDayOfMonthIso(year: number, month1to12: number): string {
  const d = new Date(year, month1to12, 0);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function slotKey(magazineId: string, year: number, issueInYear: number): string {
  return `${magazineId}:${year}:${issueInYear}`;
}

function findExistingPublication(
  existing: ExistingPublicationRow[],
  year: number,
  issueInYear: number,
  expectedMonth: number
): ExistingPublicationRow | undefined {
  return existing.find((row) => {
    if (row.publication_year !== year) return false;
    if (row.magazine_this_year_issue === issueInYear) return true;
    return row.publication_expected_publication_month === expectedMonth;
  });
}

export function buildPlannedIssueSlots(params: {
  magazineId: string;
  periodicity: string | undefined | null;
  firstYear?: number | null;
  existing: ExistingPublicationRow[];
  horizonStart?: Date;
  horizonDays?: number;
  defaultFormat?: PublicationFormat;
}): PlannedIssueSlot[] {
  const {
    magazineId,
    periodicity,
    firstYear,
    existing,
    horizonStart = new Date(),
    horizonDays = 365,
    defaultFormat = "flipbook",
  } = params;

  const perYear = issuesPerYearFromPeriodicity(periodicity);
  if (perYear < 1) return [];

  const start = new Date(horizonStart.getFullYear(), horizonStart.getMonth(), horizonStart.getDate());
  const end = new Date(start.getTime() + horizonDays * MS_PER_DAY);
  const minYear = Math.max(start.getFullYear(), Number(firstYear) || start.getFullYear());
  const maxYear = end.getFullYear();
  const slots: PlannedIssueSlot[] = [];

  for (let year = minYear; year <= maxYear; year += 1) {
    for (let issueInYear = 1; issueInYear <= perYear; issueInYear += 1) {
      const expectedMonth = expectedMonthForIssue(periodicity, issueInYear);
      if (expectedMonth == null) continue;
      const expectedDate = lastDayOfMonthIso(year, expectedMonth);
      const date = new Date(`${expectedDate}T12:00:00`);
      if (date < start || date > end) continue;

      const match = findExistingPublication(existing, year, issueInYear, expectedMonth);
      slots.push({
        key: slotKey(magazineId, year, issueInYear),
        magazineId,
        publicationYear: year,
        issueInYear,
        expectedMonth,
        expectedDate,
        exists: Boolean(match),
        existingPublicationId: match?.id_publication,
        is_special_edition: false,
        publication_theme: "",
        publication_format: defaultFormat,
      });
    }
  }

  return slots.sort((a, b) => {
    if (a.expectedDate !== b.expectedDate) return a.expectedDate.localeCompare(b.expectedDate);
    return a.issueInYear - b.issueInYear;
  });
}

export function monthLabel(month: number | null | undefined): string {
  if (month == null || month < 1 || month > 12) return "—";
  return new Date(2000, month - 1, 1).toLocaleString("default", { month: "long" });
}
