import { redirect } from "next/navigation";

/** Campaign creation lives under newsletters/create; keep this route as an alias. */
export default function CampaignCreatePage() {
  redirect("/logged/pages/production/newsletters/create");
}
