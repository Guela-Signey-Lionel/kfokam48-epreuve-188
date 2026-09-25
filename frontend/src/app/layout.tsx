import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Assidu — Présence & relecture par les pairs",
  description:
    "Application de gestion de présence, de dépôt d'exercices et de relecture par les pairs pour la formation KFOKAM48. Auteur : GUELA Signey Lionel (matricule 188).",
  keywords: [
    "Assidu",
    "KFOKAM48",
    "présence",
    "relecture par les pairs",
    "formation",
    "Next.js",
  ],
  authors: [{ name: "GUELA Signey Lionel" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <SonnerToaster />
      </body>
    </html>
  );
}
