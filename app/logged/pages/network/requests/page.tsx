"use client";

import React, { FC, useEffect } from 'react';
import Link from 'next/link';
import { usePageContent } from '@/app/logged/logged_components/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/PageContentSection';

interface AdvertisementProps {}

const Advertisement: FC<AdvertisementProps> = () => {
  const breadcrumbs = [{ label: "Requests" }];
  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Requests", breadcrumbs });
  }, [setPageMeta, breadcrumbs]);

  return (
    <>
      <PageContentSection>
        <p className="text-sm text-gray-500 mb-6">Select a request type to manage</p>
        <div className="flex flex-col gap-4">
          <Link
            href="/logged/pages/network/requests/quotations"
            className="flex flex-col p-6 rounded-lg border border-gray-200 bg-white hover:bg-blue-50/50 hover:border-blue-950/30 transition-colors"
          >
            <span className="font-semibold text-gray-900">Advertisement quotations</span>
            <span className="text-sm text-gray-500 mt-1">Manage advertisement requests and quotations</span>
          </Link>
          <Link
            href="/logged/pages/network/requests/company"
            className="flex flex-col p-6 rounded-lg border border-gray-200 bg-white hover:bg-blue-50/50 hover:border-blue-950/30 transition-colors"
          >
            <span className="font-semibold text-gray-900">Company</span>
            <span className="text-sm text-gray-500 mt-1">Requests to create a company profile in the directory</span>
          </Link>
          <Link
            href="/logged/pages/network/requests/requests"
            className="flex flex-col p-6 rounded-lg border border-gray-200 bg-white hover:bg-blue-50/50 hover:border-blue-950/30 transition-colors"
          >
            <span className="font-semibold text-gray-900">Other requests</span>
            <span className="text-sm text-gray-500 mt-1">General contact and other inquiries</span>
          </Link>
        </div>
      </PageContentSection>
    </>
  );
};

export default Advertisement;
