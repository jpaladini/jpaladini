import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Azure DevOps Enterprise Console",
  description:
    "A clone-and-customize web console for your organization's Azure DevOps.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
