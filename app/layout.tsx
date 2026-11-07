import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chocobites — Handcrafted Chocolate Gifts",
  description: "Small-batch chocolate, beautifully made and thoughtfully gifted.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
