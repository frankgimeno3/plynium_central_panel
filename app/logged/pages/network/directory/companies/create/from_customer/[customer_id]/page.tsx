'use client';

import React, { FC, Suspense } from 'react';
import { useParams } from 'next/navigation';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import { CreateCompanyWizard } from '../../CreateCompanyWizard';

const CreateCompanyFromCustomerInner: FC = () => {
  const params = useParams();
  const raw = params?.customer_id;
  const customerId = decodeURIComponent(Array.isArray(raw) ? (raw[0] ?? '') : String(raw ?? '')).trim();
  if (!customerId) {
    return (
      <PageContentSection className="p-6">
        <p className="text-sm text-red-600">Missing customer id in the URL.</p>
      </PageContentSection>
    );
  }
  return <CreateCompanyWizard embeddedCustomerId={customerId} />;
};

const CreateCompanyFromCustomerPage: FC = () => (
  <Suspense
    fallback={
      <PageContentSection className="p-6">
        <p className="text-sm text-gray-600">Loading…</p>
      </PageContentSection>
    }
  >
    <CreateCompanyFromCustomerInner />
  </Suspense>
);

export default CreateCompanyFromCustomerPage;
