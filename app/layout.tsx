import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Misaki shop",
  description: "A cute Misaki live stream PayPal checkout site.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
