"use client";

import React, { FC, useEffect } from 'react';
import { usePageContent } from '@/app/logged/logged_components/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/PageContentSection';
import AdvertisementTable from '../advertisement_components/AdvertisementTable';

interface QuotationsProps {}

const Quotations: FC<QuotationsProps> = () => {
  const breadcrumbs = [
    { label: "Requests", href: "/logged/pages/network/requests" },
    { label: "Advertisement quotations" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Advertisement Quotations", breadcrumbs });
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
