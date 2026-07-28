import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ClickSpark from "../components/ui/ClickSpark/ClickSpark";
import Script from "next/script";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { ConditionalLayout } from "@/components/providers/ConditionalLayout";
import { ThemeProvider } from "next-themes";
import { AudioPlayerProvider } from "@/components/providers/AudioPlayerContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://goctruyen.wtfdev.qzz.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Góc Truyện - Nền tảng đọc & nghe truyện online",
    template: "%s | Góc Truyện",
  },
  description: "Góc Truyện - Nền tảng đọc truyện chữ, nghe truyện audio online chất lượng cao, cập nhật chương mới nhất nhanh chóng với kho truyện phong phú.",
  keywords: [
    "Góc Truyện",
    "Goc Truyện",
    "Góc Audio",
    "GocAudio",
    "đọc truyện online",
    "nghe truyện audio",
    "truyện ngôn tình",
    "truyện tiên hiệp",
    "truyện đô thị",
    "truyện huyền huyễn"
  ],
  applicationName: "Góc Truyện",
  authors: [{ name: "Góc Truyện" }],
  publisher: "Góc Truyện",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  verification: {
    google: "google401b8afe13c18fe1",
  },
  openGraph: {
    title: "Góc Truyện - Nền tảng đọc & nghe truyện online",
    description: "Góc Truyện - Nền tảng đọc truyện chữ, nghe truyện audio online chất lượng cao.",
    url: siteUrl,
    siteName: "Góc Truyện",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/logo.jpg",
        width: 800,
        height: 800,
        alt: "Góc Truyện Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Góc Truyện - Nền tảng đọc & nghe truyện online",
    description: "Đọc & nghe truyện online cập nhật liên tục.",
    images: ["/logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Góc Truyện",
  "alternateName": ["Góc Audio", "GocTruyen", "GocAudio", "gocaudio"],
  "url": siteUrl,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${siteUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
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

