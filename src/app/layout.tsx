import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AuthProvider } from "@/contexts/AuthContext";
import { SSEProvider } from "@/contexts/SSEContext";
import AuthGuard from "@/components/auth/AuthGuard";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "WP-AutoHealer Control Panel",
  description: "WordPress Self-Healing System - Production-grade autonomous SRE/Support Engineer",
  keywords: ["WordPress", "AutoHealer", "SRE", "DevOps", "Monitoring", "Self-Healing"],
};

/**
 * Root layout component for the WP-AutoHealer application.
 * Provides global providers for authentication and server-sent events.
 * 
 * @param props - The component props
 * @param props.children - The child components to render within the layout
 * @returns The root layout JSX element with providers wrapped around children
 */
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
            <AuthGuard>
              {children}
            </AuthGuard>
          </SSEProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
