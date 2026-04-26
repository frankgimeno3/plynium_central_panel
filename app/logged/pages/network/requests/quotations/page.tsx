import { redirect } from "next/navigation";

export default function LegacyQuotationsRedirect() {
  redirect("/logged/pages/tickets?tab=quotations");
}
