import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Reem_Kufi } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const reemKufi = Reem_Kufi({
  subsets: ["arabic", "latin"],
  variable: "--font-display",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CariUstadz — Temukan Ustadz untuk Kebutuhan Dakwah Anda",
  description:
    "Platform pencarian dan booking ustadz terpercaya di Indonesia. Cari ustadz sesuai spesialisasi, lokasi, dan jadwal. Untuk kajian, ceramah, nikah, dan konsultasi.",
  keywords: [
    "cari ustadz",
    "booking ustadz",
    "pendakwah",
    "kajian islam",
    "ceramah agama",
    "ustadz indonesia",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${jakarta.variable} ${reemKufi.variable}`}>
      <body className="font-sans">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
