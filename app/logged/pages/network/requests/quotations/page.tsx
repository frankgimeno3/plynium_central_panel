"use client";

import React, { FC } from 'react';
import PageContentLayout from '@/app/logged/logged_components/PageContentLayout';
import PageContentSection from '@/app/logged/logged_components/PageContentSection';
import AdvertisementTable from '../advertisement_components/AdvertisementTable';

interface QuotationsProps {}

const Quotations: FC<QuotationsProps> = () => {
  const breadcrumbs = [
    { label: "Requests", href: "/logged/pages/network/requests" },
    { label: "Advertisement quotations" },
  ];

  return (
    <PageContentLayout
      pageTitle="Advertisement Quotations"
      breadcrumbs={breadcrumbs}
    >
      <PageContentSection>
        <AdvertisementTable />
      </PageContentSection>
    </PageContentLayout>
  );
};

export default Quotations;
