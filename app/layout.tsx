import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaClient } from "./pwa-client";
import "./globals.css";
import "./ios-redesign.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const base = `${protocol}://${host}`;

  return {
    metadataBase: new URL(base),
    title: { default: "LifeInbox - Drop it in. Know what matters next.", template: "%s | LifeInbox" },
    description: "Drop text, images, PDFs, or voice. LifeInbox organizes every action or preserves the information as a permanent note with AI.",
    applicationName: "LifeInbox",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "default", title: "LifeInbox" },
    icons: {
      icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title: "LifeInbox - Drop it in. LifeInbox handles the rest.",
      description: "One capture becomes accurate actions or a permanent note in a calm personal workspace.",
      type: "website",
      images: [{ url: `${base}/og.png`, width: 1200, height: 630, alt: "LifeInbox turns a compound capture into organized actions" }],
    },
    twitter: { card: "summary_large_image", title: "LifeInbox", description: "Drop it in. LifeInbox handles the rest.", images: [`${base}/og.png`] },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#f5f5f7" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}<PwaClient /></body>
    </html>
  );
}
