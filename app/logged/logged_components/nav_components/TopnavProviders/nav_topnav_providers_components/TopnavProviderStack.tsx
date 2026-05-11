"use client";

import type { ReactNode } from "react";
import { AdvertisementsProvider } from "@/app/logged/pages/tickets/hooks/useAdvertisements";
import { CompanyRequestsProvider } from "@/app/logged/pages/tickets/hooks/useCompanyRequests";
import { OtherRequestsProvider } from "@/app/logged/pages/tickets/hooks/useOtherRequests";

type TopnavProviderStackProps = {
  children: ReactNode;
};

export default function TopnavProviderStack({ children }: TopnavProviderStackProps) {
  return (
    <CompanyRequestsProvider>
      <OtherRequestsProvider>
        <AdvertisementsProvider>{children}</AdvertisementsProvider>
      </OtherRequestsProvider>
    </CompanyRequestsProvider>
  );
}
