"use client";

import React, { FC, useEffect } from 'react';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import AdvertisementTable from '../other/advertisement_components/AdvertisementTable';

interface QuotationsProps {}

const Quotations: FC<QuotationsProps> = () => {
  const breadcrumbs = [
    { label: "Advertisement quotations" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Advertisement Quotations", breadcrumbs, buttons: [] });
  }, [setPageMeta, breadcrumbs]);

  return (
    <>
      <PageContentSection>
        <AdvertisementTable />
      </PageContentSection>
    </>
  );
};

export default Quotations;
