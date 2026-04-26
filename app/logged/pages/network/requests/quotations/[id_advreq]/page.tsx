import { redirect } from "next/navigation";

export default async function LegacyAdvertisementDetailRedirect({
  params,
}: {
  params: Promise<{ id_advreq?: string }>;
}) {
  const { id_advreq } = await params;
  const cleaned = decodeURIComponent(String(id_advreq ?? "")).trim();
  redirect(`/logged/pages/tickets/quotations/${encodeURIComponent(cleaned)}`);
}
