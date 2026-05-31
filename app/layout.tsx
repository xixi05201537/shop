import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pink Pay Shop",
  description: "A cute single-product PayPal checkout site.",
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
