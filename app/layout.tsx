import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ClickSpark from "../components/ui/ClickSpark/ClickSpark";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "gocaudio",
  description: "gocaudio - Nền tảng đọc & nghe truyện online",
  icons: {
    icon: "/logo.jpg",
  },
};

import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { ConditionalLayout } from "@/components/providers/ConditionalLayout";
import { ThemeProvider } from "next-themes";
import { AudioPlayerProvider } from "@/components/providers/AudioPlayerContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        {process.env.NODE_ENV === "development" && (
          <Script 
            src="//unpkg.com/react-grab/dist/index.global.js" 
            crossOrigin="anonymous" 
            strategy="beforeInteractive" 
          />
        )}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <AudioPlayerProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </AudioPlayerProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
