"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

export default function PublishedDetailLegacyRedirectPage({ params }: { params: Promise<{ id_publication: string }> }) {
  const router = useRouter();
  const { id_publication } = use(params);
  useEffect(() => {
    router.replace(`/logged/pages/production/publications/${encodeURIComponent(id_publication)}`);
  }, [router, id_publication]);
  return (
    <PageContentSection>
      <div className="p-6 text-center text-gray-500">Redirecting to Issue…</div>
    </PageContentSection>
  );
}
