import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { ConditionalFooter } from "@/components/conditional-footer";
import { StructuredData } from "@/components/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://transcriptai.conn.digital";

export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: "TranscriptAI - AI-Powered YouTube Transcript Analysis",
    template: "%s | TranscriptAI"
  },
  description:
    "Transform YouTube videos into actionable insights. Download transcripts instantly and analyze them with AI. Get summaries, extract code snippets, quotes, and action items from any YouTube video. Free during beta.",

  // Keywords for SEO
  keywords: [
    "YouTube transcript",
    "video transcription",
    "AI transcript analysis",
    "YouTube summary",
    "video to text",
    "transcript download",
    "AI summarization",
    "code extraction",
    "video analysis",
    "content extraction",
    "YouTube captions",
    "subtitle download"
  ],

  // Authors and creator
  authors: [{ name: "Conn.Digital", url: "https://conn.digital" }],
  creator: "Conn.Digital",
  publisher: "Conn.Digital",

  // Application metadata
  applicationName: "TranscriptAI",
  category: "productivity",

  // Open Graph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "TranscriptAI",
    title: "TranscriptAI - AI-Powered YouTube Transcript Analysis",
    description:
      "Transform YouTube videos into actionable insights with AI. Download transcripts, get summaries, extract code, quotes, and action items. Free during beta.",
  },

  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "TranscriptAI - AI-Powered YouTube Transcript Analysis",
    description:
      "Transform YouTube videos into actionable insights with AI. Download transcripts, get summaries, extract code, quotes, and action items.",
    images: [`${siteUrl}/android-chrome-512x512.png`],
    creator: "@ConnDigital",
    site: "@ConnDigital",
  },

  // Verification and ownership
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },

  // Robots directives
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

  // Icons
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
    ],
  },

  // Web app manifest
  manifest: "/site.webmanifest",

  // Additional metadata
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Navbar />
            <main className="flex-1">{children}</main>
            <ConditionalFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
