import { redirect } from "next/navigation";

export default async function LegacyCompanyRequestDetailRedirect({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const { id } = await params;
  const cleaned = decodeURIComponent(String(id ?? "")).trim();
  redirect(`/logged/pages/tickets/company/${encodeURIComponent(cleaned)}`);
}
