import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workplace Judgement Practice",
  description:
    "High-standard workplace judgement practice with 50 original professional scenarios.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
