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
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              <AdvertisementTable />
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default Quotations;
