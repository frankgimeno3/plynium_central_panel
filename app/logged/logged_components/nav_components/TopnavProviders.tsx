"use client";

import type { ReactNode } from "react";
import { CompanyRequestsProvider } from "@/app/logged/pages/tickets/hooks/useCompanyRequests";
import { OtherRequestsProvider } from "@/app/logged/pages/tickets/hooks/useOtherRequests";
import { AdvertisementsProvider } from "@/app/logged/pages/tickets/hooks/useAdvertisements";

export default function TopnavProviders({ children }: { children: ReactNode }) {
  return (
    <CompanyRequestsProvider>
      <OtherRequestsProvider>
        <AdvertisementsProvider>{children}</AdvertisementsProvider>
      </OtherRequestsProvider>
    </CompanyRequestsProvider>
  );
}

