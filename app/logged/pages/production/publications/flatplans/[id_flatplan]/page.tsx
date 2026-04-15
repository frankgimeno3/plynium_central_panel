"use client";

import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function FlatplanDetailLegacyRedirectPage({ params }: { params: Promise<{ id_flatplan: string }> }) {
  const router = useRouter();
  const { id_flatplan } = use(params);
  useEffect(() => {
    router.replace(`/logged/pages/production/publications/${encodeURIComponent(id_flatplan)}`);
  }, [router, id_flatplan]);
  return (
    <PageContentSection>
      <div className="p-6 text-center text-gray-500">Redirecting to Issue…</div>
    </PageContentSection>
  );
}
