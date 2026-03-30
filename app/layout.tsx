import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cafes Around Rawang — Hidden Gems in Bukit Sentosa",
  description:
    "Discover the best cafes in Rawang and Bukit Sentosa, Selangor. Your local guide to cozy kopitiam, specialty coffee, and hidden garden cafes.",
  keywords: ["cafe rawang", "bukit sentosa cafe", "selangor coffee", "kopitiam rawang"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream text-espresso antialiased">{children}</body>
    </html>
  );
}
