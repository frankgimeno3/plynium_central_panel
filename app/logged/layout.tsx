import type { Metadata } from "next";
import "../globals.css";

import { PageContentProvider } from "./logged_components/context_content/PageContentContext";
import PageContentLayout from "./logged_components/context_content/PageContentLayout";
import Topnav from "./logged_components/nav_components/Topnav";
import Leftnav from "./logged_components/nav_components/Leftnav";
import { CompanyRequestsProvider } from "./pages/network/requests/hooks/useCompanyRequests";

export const metadata: Metadata = {
  title: "Plynium Central Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <Topnav />
      <div className="flex flex-row flex-1 bg-gray-100 min-h-screen text-gray-600 w-full">
        <Leftnav />
        <CompanyRequestsProvider>
          <PageContentProvider>
            <PageContentLayout>{children}</PageContentLayout>
          </PageContentProvider>
        </CompanyRequestsProvider>
      </div>
    </div>
  );
}
