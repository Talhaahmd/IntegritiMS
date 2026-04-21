import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Integriti — Operations Hub",
  description: "Premium internal operations management system",
  icons: {
    icon: "/logo.webp",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
