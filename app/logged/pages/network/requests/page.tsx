import { redirect } from "next/navigation";

export default function LegacyRequestsIndexRedirect() {
  redirect("/logged/pages/tickets");
}
