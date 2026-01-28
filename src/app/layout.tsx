import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SSEProvider } from "@/contexts/SSEContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "WP-AutoHealer Control Panel",
  description: "WordPress Self-Healing System - Production-grade autonomous SRE/Support Engineer",
  keywords: ["WordPress", "AutoHealer", "SRE", "DevOps", "Monitoring", "Self-Healing"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <SSEProvider>
            {children}
          </SSEProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
