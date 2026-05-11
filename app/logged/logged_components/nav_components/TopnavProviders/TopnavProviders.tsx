"use client";

import type { ReactNode } from "react";
import TopnavProviderStack from "./nav_topnav_providers_components/TopnavProviderStack";

export default function TopnavProviders({ children }: { children: ReactNode }) {
  return <TopnavProviderStack>{children}</TopnavProviderStack>;
}
