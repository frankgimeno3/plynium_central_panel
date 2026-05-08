"use client";

import { Suspense, FC } from "react";
import { useParams } from "next/navigation";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { CreateCustomerWizard } from "../../CreateCustomerWizard";

const CreateCustomerFromCompanyInner: FC = () => {
  const params = useParams();
  const raw = params?.company_id;
  const companyId = decodeURIComponent(Array.isArray(raw) ? (raw[0] ?? "") : String(raw ?? "")).trim();
  if (!companyId) {
    return (
      <PageContentSection className="p-6">
        <p className="text-sm text-red-600">Missing company id in the URL.</p>
      </PageContentSection>
    );
  }
  return <CreateCustomerWizard embeddedCompanyId={companyId} />;
};

const CreateCustomerFromCompanyPage: FC = () => (
  <Suspense
    fallback={
      <PageContentSection className="p-6">
        <p className="text-sm text-gray-600">Loading…</p>
      </PageContentSection>
    }
  >
    <CreateCustomerFromCompanyInner />
  </Suspense>
);

export default CreateCustomerFromCompanyPage;
