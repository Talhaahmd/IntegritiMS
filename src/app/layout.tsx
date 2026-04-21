import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntegritiMS — Operations Hub",
  description: "Premium internal operations management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
