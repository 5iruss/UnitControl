import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "UnitControl",
    template: "%s — UnitControl",
  },
  // docs/01_Product_Overview.md §1 — "a web-based academic planning system
  // for Computer Engineering students."
  description: "Academic planning assistant for Computer Engineering students.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // docs/03_UX_UI_Specification.md §22, §24 — primary content language is
  // Persian with an RTL layout (curriculum data is entirely Persian).
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
