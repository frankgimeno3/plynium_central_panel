import { redirect } from "next/navigation";

export default function LegacyCompanyRequestsRedirect() {
  redirect("/logged/pages/tickets?tab=company");
}
