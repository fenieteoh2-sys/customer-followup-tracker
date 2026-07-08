import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Customer Follow-Up Tracker",
  description: "Track customer requests, tasks, notes, and urgent follow-ups.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
