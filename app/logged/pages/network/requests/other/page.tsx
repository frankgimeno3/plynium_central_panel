import { redirect } from "next/navigation";

export default function LegacyOtherRequestsRedirect() {
  redirect("/logged/pages/tickets?tab=other");
}
