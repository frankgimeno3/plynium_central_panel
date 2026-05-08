"use client";

import { Suspense, FC } from "react";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { CreateCustomerWizard } from "./CreateCustomerWizard";

const CreateCustomerPage: FC = () => (
  <Suspense
    fallback={
      <PageContentSection className="p-6">
        <p className="text-sm text-gray-600">Loading…</p>
      </PageContentSection>
    }
  >
    <CreateCustomerWizard embeddedCompanyId={null} />
  </Suspense>
);

export default CreateCustomerPage;
