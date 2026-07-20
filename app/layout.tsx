import type React from "react"
import type { Metadata } from "next"
import { Outfit, Barlow } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { ScrollToTop } from "@/components/scroll-to-top"
import { business, siteUrl } from "@/lib/business"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
})

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl("/")),
  title: {
    default: `${business.brandName} — ${business.primaryService} in ${business.city}, ${business.state}`,
    template: `%s | ${business.brandName}`,
  },
  description: `${business.brandName}: ${business.serviceList} in ${business.city}, ${business.state}. Book online, same-week availability.`,
  alternates: {
    canonical: "/",
    types: { "text/markdown": siteUrl("/agent.md") },
  },
  openGraph: {
    type: "website",
    url: siteUrl("/"),
    siteName: business.brandName,
    title: `${business.brandName} — ${business.primaryService} in ${business.city}, ${business.state}`,
    description: `Book ${business.serviceList} in ${business.city}, ${business.state}.`,
    images: [{ url: business.ogImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${business.brandName} — ${business.primaryService} in ${business.city}, ${business.state}`,
    description: `Book ${business.serviceList} in ${business.city}, ${business.state}.`,
    images: [business.ogImage],
  },
  robots: { index: true, follow: true },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${outfit.variable} ${barlow.variable} antialiased`}>
        <ScrollToTop />
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  )
}
