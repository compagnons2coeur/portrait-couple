import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import TikTokPixel from "@/components/TikTokPixel";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Portrait de Couple IA — Compagnons de Cœur",
  description:
    "Créez un portrait artistique IA de votre couple. Boutique Compagnons de Cœur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} min-h-screen antialiased`}>
        <TikTokPixel />
        {children}
      </body>
    </html>
  );
}
