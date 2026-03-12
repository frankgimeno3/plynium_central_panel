import type { Metadata } from "next";
import { Ubuntu, Geist_Mono } from "next/font/google";
import "./globals.css";

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plynium Central Panel",
  description: "Plynium Central Panel - Content Management System",
  robots: "noindex, nofollow", // Panel privado
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${ubuntu.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
