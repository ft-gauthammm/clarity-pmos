import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clarity — PMOS Cognitive Companion",
  description:
    "Understand PMOS (formerly PCOS) and track cognitive health with clarity. Built for young women.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0a0b] text-zinc-100">
        {children}
      </body>
    </html>
  );
}