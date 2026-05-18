import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eğitim İhtiyacı Analiz Otomasyonu",
  description: "Çalışan değerlendirme ve eğitim ihtiyacı analiz sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="tr">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
