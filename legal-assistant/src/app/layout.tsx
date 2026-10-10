import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Legal Drafting Assistant",
  description:
    "Create a first draft of an NDA, service agreement or business letter. General drafts only, not legal advice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
