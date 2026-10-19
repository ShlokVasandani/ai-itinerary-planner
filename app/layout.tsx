import type { Metadata, Viewport } from "next";
import { Outfit, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ScrollFX from "@/components/ScrollFX";
import { cityIndex } from "@/lib/data/catalog";
import { SITE_NAME, jsonLd, siteUrl } from "@/lib/site";

const display = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-outfit",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-source",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `Sekai: day-by-day itineraries for ${cityIndex.length} cities`, template: "%s | Sekai" },
  description:
    `Day-by-day trips for ${cityIndex.length} cities built from real places on Wikidata and OpenStreetMap, with real dates, distances and opening hours. No invented venues.`,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF7F0",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@graph": [
                { "@type": "WebSite", name: SITE_NAME, url: siteUrl() },
                { "@type": "Organization", name: SITE_NAME, url: siteUrl() },
              ],
            }),
          }}
        />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <ScrollFX />
        <SiteHeader />
        <div id="main">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
