import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "GLP-1 Tracker",
  description: "Track GLP-1 doses, daily habits, and weight progress.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <main className="flex-1">{children}</main>
        <footer className="px-4 pb-4">
          <AffiliateDisclosure />
        </footer>
      </body>
    </html>
  );
}
