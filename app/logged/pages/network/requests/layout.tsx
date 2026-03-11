"use client";

import { OtherRequestsProvider } from './hooks/useOtherRequests';

export default function AdvertisementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OtherRequestsProvider>
      {children}
    </OtherRequestsProvider>
  );
}
