import type { Metadata } from "next";
import { Onest, Geist_Mono } from "next/font/google";
import "./globals.css";

const onest = Onest({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BYMA 2026 — Beyond Music Awards",
  description:
    "Para quienes imaginan, negocian, producen y mueven la música por el mundo. Plataforma de propuestas BYMA 2026.",
  icons: {
    icon: "/svg/sigil.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${onest.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
