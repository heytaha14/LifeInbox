import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const base = `${protocol}://${host}`;

  return {
    metadataBase: new URL(base),
    title: { default: "LifeInbox - Turn life admin into a clear next step", template: "%s | LifeInbox" },
    description: "Capture anything. LifeInbox turns it into organized actions, calm daily briefings, and searchable life threads.",
    openGraph: {
      title: "LifeInbox - Your life, finally out of your head",
      description: "One calm inbox for plans, paperwork, reminders, receipts, and everything in between.",
      type: "website",
      images: [{ url: `${base}/og-bright.png`, width: 1200, height: 630, alt: "Bright LifeInbox product preview" }],
    },
    twitter: { card: "summary_large_image", title: "LifeInbox", description: "Capture anything. Know what matters next.", images: [`${base}/og-bright.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
