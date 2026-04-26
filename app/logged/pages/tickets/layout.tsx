"use client";

import type { ReactNode } from "react";
import { CompanyRequestsProvider } from "./hooks/useCompanyRequests";
import { OtherRequestsProvider } from "./hooks/useOtherRequests";
import { AdvertisementsProvider } from "./hooks/useAdvertisements";

export default function TicketsLayout({ children }: { children: ReactNode }) {
  return (
    <CompanyRequestsProvider>
      <OtherRequestsProvider>
        <AdvertisementsProvider>{children}</AdvertisementsProvider>
      </OtherRequestsProvider>
    </CompanyRequestsProvider>
  );
}

