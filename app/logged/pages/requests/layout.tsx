"use client";

import { CompanyRequestsProvider } from './hooks/useCompanyRequests';
import { OtherRequestsProvider } from './hooks/useOtherRequests';

export default function AdvertisementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompanyRequestsProvider>
      <OtherRequestsProvider>
        {children}
      </OtherRequestsProvider>
    </CompanyRequestsProvider>
  );
}
