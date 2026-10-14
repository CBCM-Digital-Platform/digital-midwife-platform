import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/providers/auth-provider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "MidwifeConnect",
  description: "Professional Mentoring for Healthcare Practitioners",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}