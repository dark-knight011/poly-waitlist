import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Allura } from "next/font/google";

const signature = Allura({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-signature",
});

import "./globals.css";

export const metadata: Metadata = {
  title: "Waitlist",
  description: "Join the waitlist.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={signature.variable}>{children}</body>
    </html>
  );
}
