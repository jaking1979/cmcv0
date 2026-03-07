import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CMC Sober Coach",
  description: "Compassionate, evidence-based coaching for substance use recovery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={`${geistSans.variable} antialiased`}
        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        {children}
      </body>
    </html>
  );
}
