import { redirect } from "next/navigation";

export default async function LegacyOtherRequestDetailRedirect({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const { id } = await params;
  const cleaned = decodeURIComponent(String(id ?? "")).trim();
  redirect(`/logged/pages/tickets/other/${encodeURIComponent(cleaned)}`);
}
