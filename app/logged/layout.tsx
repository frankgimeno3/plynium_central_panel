import type { Metadata } from "next";
import "../globals.css";

import { PageContentProvider } from "./logged_components/context_content/PageContentContext";
import PageContentLayout from "./logged_components/context_content/PageContentLayout";
import Topnav from "./logged_components/nav_components/Topnav";
import TopnavProviders from "./logged_components/nav_components/TopnavProviders";
import Leftnav from "./logged_components/nav_components/Leftnav";

export const metadata: Metadata = {
  title: "Plynium Central Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TopnavProviders>
      <div className="flex flex-col min-h-screen">
        <Topnav />
        <div className="flex flex-row flex-1 min-h-screen text-slate-200 w-full">
          <Leftnav />
          <PageContentProvider>
            <PageContentLayout>{children}</PageContentLayout>
          </PageContentProvider>
        </div>
      </div>
    </TopnavProviders>
  );
}
