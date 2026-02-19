import type { Metadata } from "next";
import "../globals.css";
import Topnav from "./logged_components/Topnav";
import Leftnav from "./logged_components/Leftnav";

  
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
              {children}
           </div>
        </div>
  );
}
