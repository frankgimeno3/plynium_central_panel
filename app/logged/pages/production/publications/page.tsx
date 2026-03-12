"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

export default function PublicationsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/logged/pages/production/publications/magazines");
  }, [router]);
  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <div className="bg-white rounded-b-lg overflow-hidden">
          <div className="p-6 text-center text-gray-500">
            Redirecting to Magazines…
          </div>
        </div>
      </div>
    </PageContentSection>
  );
}
