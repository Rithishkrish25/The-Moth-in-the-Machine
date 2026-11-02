import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Moth in the Machine",
  description: "An immersive three-level mechanical laboratory experience",
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
