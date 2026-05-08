'use client';

import React, { FC, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import { CreateCompanyWizard } from './CreateCompanyWizard';
import { hrefCreateCompanyFromCustomer } from './createCompanyPaths';

const CreateCompanyPageInner: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyCustomerId = (searchParams.get('customerId') ?? '').trim();

  useEffect(() => {
    if (!legacyCustomerId) return;
    router.replace(hrefCreateCompanyFromCustomer(legacyCustomerId));
  }, [legacyCustomerId, router]);

  if (legacyCustomerId) {
    return (
      <PageContentSection className="p-6">
        <p className="text-sm text-gray-600">Redirecting…</p>
      </PageContentSection>
    );
  }

  return <CreateCompanyWizard embeddedCustomerId={null} />;
};

const CreateCompanyPage: FC = () => (
  <Suspense
    fallback={
      <PageContentSection className="p-6">
        <p className="text-sm text-gray-600">Loading…</p>
      </PageContentSection>
    }
  >
    <CreateCompanyPageInner />
  </Suspense>
);

export default CreateCompanyPage;
