"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

export default function FlatplansLegacyRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/logged/pages/production/publications/issues");
  }, [router]);
  return (
    <PageContentSection>
      <div className="p-6 text-center text-gray-500">Redirecting to Issues…</div>
    </PageContentSection>
  );
}
