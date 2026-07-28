import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";
import HydrationWrapper from "@/components/HydrationWrapper";
import CookieConsentBanner from "@/components/CookieConsentBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GM's Second Brain — Мастерская Подземелий",
  description: "Интерактивные карты, библиотека NPC, генерация лута и управление сюжетом D&D-кампаний в одном хабе.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <HydrationWrapper>
          {children}
        </HydrationWrapper>
        <Toaster />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
