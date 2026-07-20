import type { Metadata } from "next";
import Script from "next/script";
import {
  business,
  formatPhoneUS,
  formatBusinessHours,
  hoursToSchema,
  siteUrl,
} from "@/lib/business";
import { availableServices, isBundleService, type CatalogService } from "@/lib/services-catalog";
import { faqs } from "@/lib/faqs";

const PAGE_PATH = "/estimate/services";
const PAGE_URL = siteUrl(PAGE_PATH);
const STARTING_PRICE = lowestStartingPrice();

export const metadata: Metadata = {
  title: `Book ${business.primaryService} in ${business.city}, ${business.state}`,
  description:
    `Book online: ${business.serviceList} in ${business.city}, ${business.state}. ` +
    `Starting at $${STARTING_PRICE}. Same-week availability. ` +
    `${formatBusinessHours(business.businessHours)}. Call ${formatPhoneUS(business.businessPhone)}.`,
  alternates: {
    canonical: PAGE_PATH,
    types: { "text/markdown": siteUrl("/agent.md") },
  },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: business.brandName,
    title: `Book ${business.primaryService} in ${business.city}, ${business.state}`,
    description: `Online booking for ${business.serviceList} in ${business.city}, ${business.state}.`,
    images: [{ url: business.ogImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Book ${business.primaryService} in ${business.city}, ${business.state}`,
    description: `Online booking for ${business.serviceList} in ${business.city}, ${business.state}.`,
    images: [business.ogImage],
  },
};

function lowestStartingPrice(): number {
  const prices = availableServices
    .flatMap((s): number[] => {
      if (s.variants && s.variants.length > 0) {
        return s.variants.map((v) => v.unitPrice).filter((p) => p > 0);
      }
      return s.unitPrice > 0 ? [s.unitPrice] : [];
    })
    .sort((a, b) => a - b);
  return prices[0] ?? 50;
}

function buildOffers(businessId: string) {
  return availableServices.flatMap((s: CatalogService) => {
    // Bundles aren't offered on this page and carry no single unit price; skip
    // them so the structured-data catalog stays accurate.
    if (isBundleService(s)) return [];
    const itemOffered = {
      "@type": "Service",
      name: s.name,
      description: s.description,
      provider: { "@id": `${businessId}#business` },
    };

    if (s.variants && s.variants.length > 0) {
      return s.variants
        .filter((v) => v.unitPrice > 0)
        .map((v) => ({
          "@type": "Offer",
          itemOffered: { ...itemOffered, name: `${s.name} — ${v.name}` },
          price: v.unitPrice.toFixed(2),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        }));
    }

    if (s.unit === "room" || s.unit === "vent" || s.unit === "rug") {
      return [
        {
          "@type": "Offer",
          itemOffered,
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: s.unitPrice.toFixed(2),
            priceCurrency: "USD",
            unitText: s.unit,
            minPrice: (s.unitPrice * s.defaultQuantity).toFixed(2),
          },
          availability: "https://schema.org/InStock",
        },
      ];
    }

    return [
      {
        "@type": "Offer",
        itemOffered,
        price: s.unitPrice.toFixed(2),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    ];
  });
}

function StructuredData() {
  const id = PAGE_URL;

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": business.schemaType,
    "@id": `${id}#business`,
    name: business.brandName,
    image: siteUrl(business.logoImage),
    telephone: business.businessPhone,
    email: business.email,
    priceRange: business.priceRange,
    address: {
      "@type": "PostalAddress",
      addressLocality: business.city,
      addressRegion: business.state,
      addressCountry: "US",
    },
    areaServed: business.servedCities.map((name) => ({ "@type": "City", name })),
    openingHoursSpecification: hoursToSchema(business.businessHours),
    url: id,
    sameAs: business.sameAs,
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: id,
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
        ],
      },
      result: { "@type": "Reservation", name: "Cleaning appointment" },
    },
  };

  const offerCatalog = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: `Services offered by ${business.brandName}`,
    itemListElement: buildOffers(id),
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <Script
        id="ld-business"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      <Script
        id="ld-offers"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalog) }}
      />
      <Script
        id="ld-faq"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData />
      {children}
    </>
  );
}
