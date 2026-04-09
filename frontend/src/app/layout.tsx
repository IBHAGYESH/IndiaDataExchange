import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "@/providers";

export const metadata = {
  title: "India Data Exchange — Where Indian Knowledge Becomes AI Fuel",
  description:
    "Decentralized data marketplace on Algorand. Buy and sell Indian datasets using USDC.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
