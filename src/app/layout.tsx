import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { WebAnalytics } from "./analytics";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

function getSiteOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();

  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");

    return `https://${host}`;
  }

  return "http://localhost:3000";
}

const siteUrl = getSiteOrigin();
const siteTitle =
  "AI Content Seller | AI viết content Shopee và TikTok Shop";
const siteDescription =
  "AI Content Seller giúp seller Việt Nam tạo caption TikTok Shop, content Shopee, hashtag, mô tả sản phẩm và CTA bán hàng nhanh hơn.";
const siteKeywords = [
  "AI viết content Shopee",
  "AI viết caption TikTok Shop",
  "AI content bán hàng",
  "AI viết mô tả sản phẩm",
  "AI cho seller Việt Nam",
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  keywords: siteKeywords,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: "AI Content Seller",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-zinc-950">
        {children}
        <WebAnalytics />
      </body>
    </html>
  );
}
