import "./globals.css";
import type { Metadata } from "next";
import { QueryProvider } from "../components/query-provider";

export const metadata: Metadata = {
  title: "BiteHub Admin",
  description: "Operations dashboard for BiteHub"
};

export default function RootLayout({
  children
}: {
  children: any;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
