import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shelby CDN Explorer - Decentralized Storage & Instant Media CDN",
  description: "Upload images, videos, and PDFs to the Shelby decentralized storage network on Aptos and receive instant edge CDN URLs, rich previews, metadata, and developer integration snippets.",
  keywords: ["Shelby Protocol", "Aptos", "Decentralized Storage", "Web3 Storage", "CDN", "Next.js", "Media Hosting"],
  authors: [{ name: "Shelby Protocol Developers" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-gray-100 min-h-screen flex flex-col antialiased selection:bg-shelby-indigo selection:text-white">
        {children}
      </body>
    </html>
  );
}
