# SERV Express — Page Build Standards for AI Discoverability & SEO

**Suggested location in repo:** `docs/PAGE_BUILD_STANDARDS.md` (or `apps/booking/BUILDING_PAGES.md` if monorepo)

**Audience:** Anyone building or modifying a SERV Express location/services page — regardless of vertical (HVAC, plumbing, cleaning, lawn care, dryer vent, pest control, etc.).

**Why this exists:** Production audits have found that Express pages frequently ship without the metadata, structured data, content, and configuration that AI search engines and AI agents need to discover, understand, and book services. This document is the build-time gate that prevents new pages from shipping those gaps. Treat it as required reading, not a reference doc.

> **Rule of thumb:** if an AI agent reading the rendered HTML can't answer "what business is this, what services do they offer, what does it cost, where do they serve, and how does someone book?" — the page is not ready to merge.

---

## Conventions used in this document

Throughout this doc, references to the business config object use `biz` — the object returned by `getBusinessConfig(friendlyId)`. Field names like `biz.city`, `biz.businessPhone`, `biz.services` refer to whatever your Express config schema exposes. Adapt the exact field paths to your codebase; the *requirements* are universal.

Placeholder notation:
- `{City}` → the business's city (e.g., "Nashville", "Austin", "Portland")
- `{State}` → the two-letter state code (e.g., "TN", "TX")
- `{Brand}` → the business or franchise brand name (e.g., "Dryer Vent Superheroes", "ProPlumb Nashville")
- `{Domain}` → the Express booking domain (e.g., `book.dryerventheroes.com`, `book.acmeplumbing.com`)
- `{Primary Service}` → the business's main service offering (e.g., "Dryer Vent Cleaning", "AC Repair", "Lawn Mowing")

---

## 0 — Pre-merge checklist

Copy this into the PR description. Every box must be checked before the page ships. The PR template should auto-populate it.

```markdown
### Page build standards

**Metadata**
- [ ] `<title>` includes the city + state (e.g., "Nashville, TN")
- [ ] `<meta name="description">` includes location, starting price, and phone
- [ ] `<link rel="canonical">` set to the absolute URL
- [ ] OG + Twitter card meta set, OG image at 1200×630

**Structured data (JSON-LD)**
- [ ] `LocalBusiness` (or appropriate subtype) with NAP, hours, areaServed, sameAs, potentialAction
- [ ] `OfferCatalog` with one `Offer` per service (price, currency, availability)
- [ ] `FAQPage` with 4+ Q/As covering price, area, duration, and emergency
- [ ] All blocks pass Google Rich Results Test
- [ ] All blocks pass Schema.org Validator

**Content**
- [ ] City names rendered in the DOM (not just in JS payloads)
- [ ] Full ZIP service area visible (collapsed `<details>` ok)
- [ ] H1 is topical ("Book {Primary Service} in {City}, {State}") — `sr-only` if visual design needs a different headline
- [ ] Phone is a `tel:` link

**Data integrity**
- [ ] `businessTimeZone` matches the actual location
- [ ] Hours in footer/UI exactly match `businessHours` config
- [ ] Service prices visible on page match prices charged at checkout
- [ ] Per-unit prices (e.g. "$X / duct", "$Y / zone") are labeled as such, not shown as flat totals

**Technical SEO**
- [ ] `robots.txt` allows GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended, Applebot-Extended, Bingbot
- [ ] Page is in `sitemap.xml`
- [ ] `/llms.txt` updated with a link to the new location's `agent.md`

**Agent-readable markdown (`agent.md`)**
- [ ] `/{friendlyId}/agent.md` route served as `text/markdown; charset=utf-8`
- [ ] Frontmatter complete: `name`, `business_id`, `canonical_url`, `booking_url`, `phone`, `timezone`, `generated_at`, `expires_at`
- [ ] Fenced ```json services``` block enumerates every priceable axis (flat, per-unit, tiers, variants, add-ons, service minimum)
- [ ] Fenced ```json availability``` block lists real open slots (14-day horizon) with ISO timestamps in the business timezone
- [ ] `<link rel="alternate" type="text/markdown">` in page `<head>` points to `agent.md`
- [ ] Price parity CI check passes (page UI prices == `agent.md` services JSON)
- [ ] Availability parity CI check passes (sample slots from `agent.md` are bookable)
- [ ] JSON Schema validation passes (`/schemas/agent-md.json`)

**Performance**
- [ ] LCP element has `loading="eager"` and `fetchpriority="high"`
- [ ] PageSpeed Insights LCP < 2.5s (mobile)

**Validation (paste links/results)**
- [ ] Rich Results Test: <link>
- [ ] Schema validator: <link>
- [ ] PSI mobile: <link>
- [ ] Spot-check: searched "{Primary Service} {City}" in ChatGPT and saw this URL surface
```

---

## 1 — Page metadata (Next.js App Router)

Every location/services page must export `metadata` (or `generateMetadata`) keyed off the business config. Do **not** rely on the global default in `app/layout.tsx`.

```tsx
// app/[friendlyId]/services/page.tsx
import type { Metadata } from "next";
import { getBusinessConfig } from "@/lib/business";

export async function generateMetadata(
  { params }: { params: { friendlyId: string } }
): Promise<Metadata> {
  const biz = await getBusinessConfig(params.friendlyId);

  const startingPrice = biz.services
    .flatMap(s => s.services ?? [s])
    .map(s => s.price)
    .filter(Boolean)
    .sort((a, b) => a - b)[0];

  const cityState = `${biz.city}, ${biz.state}`;
  const url = `https://${biz.domain}/${biz.friendlyId}/services`;
  const phoneDisplay = formatPhoneUS(biz.businessPhone);

  return {
    title: `Book ${biz.primaryService} in ${cityState} | ${biz.brandName}`,
    description:
      `Book online: ${biz.serviceList} in ${cityState}. ` +
      `Starting at $${startingPrice}. Same-week availability. ` +
      `${formatHoursShort(biz.businessHours)}. Call ${phoneDisplay}.`,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `Book ${biz.primaryService} in ${cityState}`,
      description: `Online booking for ${biz.serviceList} in ${cityState}.`,
      images: [{ url: `${url}/og.png`, width: 1200, height: 630 }],
      siteName: biz.brandName,
    },
    twitter: {
      card: "summary_large_image",
      title: `Book ${biz.primaryService} in ${cityState}`,
      description: `Online booking for ${biz.serviceList} in ${cityState}.`,
      images: [`${url}/og.png`],
    },
  };
}
```

**Why:** Title is the strongest topical signal a page sends. A generic title at the layout level means every location page looks identical to AI search.

**Pitfall:** Pages that ship a brand-default title without mentioning the city or state are invisible to location-specific AI queries. Templating off `getBusinessConfig` makes that impossible.

---

## 2 — Structured data (JSON-LD)

Three blocks, all generated from the business config. Render via a server component in the page tree (not via `metadata.other` — Next.js will escape characters that break JSON-LD).

### 2a — Choosing the right `@type`

Use the most specific Schema.org subtype for the vertical:

| Vertical | Recommended `@type` |
|---|---|
| HVAC / Dryer Vent / Duct Cleaning | `HomeAndConstructionBusiness` |
| Plumbing | `Plumber` |
| Electrician | `Electrician` |
| Locksmith | `LocksmithService` (via `LocalBusiness`) |
| Lawn / Landscaping | `LandscapingBusiness` (via `LocalBusiness`) |
| Cleaning (house / carpet) | `CleaningBusiness` (via `LocalBusiness`) |
| Pest Control | `PestControlBusiness` (via `LocalBusiness`) |
| General / Other | `HomeAndConstructionBusiness` or `ProfessionalService` |

Store the appropriate `@type` in the business config so it can be templated automatically.

### 2b — LocalBusiness block

```tsx
// app/[friendlyId]/services/StructuredData.tsx
import Script from "next/script";

export function StructuredData({ biz }: { biz: BusinessConfig }) {
  const id = `https://${biz.domain}/${biz.friendlyId}/services`;

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": biz.schemaType,            // e.g., "Plumber", "HomeAndConstructionBusiness"
    "@id": `${id}#business`,
    name: biz.businessName,
    image: `https://${biz.domain}/logo.webp`,
    telephone: biz.businessPhone,
    priceRange: biz.priceRange ?? "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: biz.location,
      addressLocality: biz.city,
      addressRegion: biz.state,
      postalCode: biz.zip,
      addressCountry: "US",
    },
    areaServed: biz.servedCities.map(name => ({ "@type": "City", name })),
    openingHoursSpecification: hoursToSchema(biz.businessHours),
    url: id,
    sameAs: biz.sameAs,                 // GBP, Yelp, Facebook, Nextdoor, main brand page
    aggregateRating: biz.reviews && {
      "@type": "AggregateRating",
      ratingValue: biz.reviews.rating,
      reviewCount: biz.reviews.count,
      bestRating: 5,
    },
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
      result: { "@type": "Reservation", name: "Service appointment" },
    },
  };

  // ... offerCatalog + faqPage blocks (see below)

  return (
    <>
      <Script id="ld-business" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      <Script id="ld-offers" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalog) }} />
      <Script id="ld-faq" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }} />
    </>
  );
}
```

### 2c — OfferCatalog block

```tsx
const offerCatalog = {
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  name: `Services offered by ${biz.businessName}`,
  itemListElement: biz.services.flatMap(s => buildOffers(s, id)),
};
```

### 2d — Pricing rule: flat vs. per-unit

Flat-price services use `Offer.price`. Per-unit services use `UnitPriceSpecification` so AI agents quote correctly:

```ts
function buildOffers(service: Service, businessId: string) {
  if (service.productType === "QUANTITY") {
    return [{
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.productName,
        description: service.productDescription,
        provider: { "@id": `${businessId}#business` },
      },
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: service.unitPrice.toFixed(2),
        priceCurrency: "USD",
        unitText: service.quantityKeyword.toLowerCase(),
        minPrice: (service.unitPrice * service.minQuantity).toFixed(2),
      },
    }];
  }
  // CATEGORY: emit one Offer per sub-service
  // DEFAULT: emit one flat-price Offer
  return [{
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name: service.productName,
      description: service.productDescription,
      provider: { "@id": `${businessId}#business` },
    },
    price: service.price.toFixed(2),
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  }];
}
```

### 2e — FAQPage block

```tsx
const faqPage = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: buildFaqs(biz),  // see §4 for FAQ content requirements
};
```

**Why:** Structured data is the single highest-leverage AI-discoverability primitive. Without it, the page is invisible to ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews, and emerging agentic-booking layers.

**Pitfall:** Per-unit services (e.g., "$60/duct", "$45/zone", "$30/room") displayed as flat totals cause AI agents to quote misleading prices. The `productType: "QUANTITY"` branch above forces correct labeling everywhere.

---

## 3 — Required content blocks

Every services page must render the following **server-side** (not via client-only `useEffect` — crawlers don't execute JS reliably):

### 3a — Service area block

```tsx
<section aria-label="Service area" className="container mx-auto px-4 py-8 border-t">
  <h2 className="text-xl font-semibold mb-3">
    Areas we serve in {biz.region}
  </h2>
  <p className="text-gray-700 mb-3">
    We provide {biz.serviceList} to homes and businesses across{" "}
    <strong>{biz.servedCities.join(", ")}</strong>, plus {biz.serviceAreaCodes.length}+ ZIP
    codes in the surrounding region.
  </p>
  <details>
    <summary className="cursor-pointer text-blue-600 underline">
      View all ZIP codes we serve
    </summary>
    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
      {biz.serviceAreaCodes.join(", ")}
    </p>
  </details>
</section>
```

### 3b — H1 must be topical

```tsx
<h1 className="sr-only">
  Book {biz.primaryService.toLowerCase()} in {biz.city}, {biz.state}
</h1>
<h2 className="text-2xl md:text-3xl font-bold mb-2">Choose Your Service</h2>
```

Use `sr-only` if the visual design calls for a different headline. The H1 is for search engines and AI agents — it must include the primary service and location.

### 3c — Phone must be a `tel:` link

```tsx
<a href={`tel:${biz.businessPhone}`} aria-label={`Call ${biz.businessName}`}>
  {formatPhoneUS(biz.businessPhone)}
</a>
```

### 3d — FAQ section (4 minimum)

Render visible Q/A on the page **and** mirror in the `FAQPage` JSON-LD. Required questions (adapt wording to your vertical):

1. How much does {Primary Service} cost in {City}?
2. What ZIP codes / areas do you service?
3. How long does {Primary Service} take?
4. Do you offer same-day or emergency service?

Add more if there are high-traffic conversational queries worth capturing for your vertical. Good candidates include warranty/guarantee questions, what-to-expect questions, and seasonal availability.

**Why:** AI Overviews and AI agents lift FAQ schema verbatim into answers. This is one of the cheapest ways to control the language used to describe the business.

**Pitfall:** Pages that render the city name zero times in the DOM are invisible to location-specific AI queries. The service-area block guarantees city names appear in the indexable HTML.

---

## 4 — Data integrity rules

These are bug classes that have produced real production issues across Express deployments. Each must have a runtime guard or a CI check.

### 4a — Timezone must match location

```ts
// lib/business.ts
const STATE_TIMEZONES: Record<string, string> = {
  AL: "America/Chicago",
  AK: "America/Anchorage",
  AZ: "America/Phoenix",
  AR: "America/Chicago",
  CA: "America/Los_Angeles",
  CO: "America/Denver",
  CT: "America/New_York",
  // ... complete for all states you serve
  FL: "America/New_York",        // note: FL panhandle is Central
  HI: "Pacific/Honolulu",
  IN: "America/Indiana/Indianapolis",
  NY: "America/New_York",
  TN: "America/Chicago",
  TX: "America/Chicago",
  WA: "America/Los_Angeles",
};

export function assertTimezone(biz: BusinessConfig) {
  const expected = STATE_TIMEZONES[biz.state];
  if (expected && biz.businessTimeZone !== expected) {
    throw new Error(
      `Business ${biz.friendlyId} in ${biz.state} has timezone ` +
      `${biz.businessTimeZone}, expected ${expected}`
    );
  }
}
```

Call `assertTimezone(biz)` in the page render path so a misconfigured business fails the build, not the customer's appointment.

**Note:** Some states span multiple time zones (FL, IN, TX, etc.). For businesses near zone boundaries, override via the config rather than disabling the guard.

### 4b — Footer/UI hours must match config hours

Don't hard-code hours strings in JSX. Render them from `biz.businessHours`:

```tsx
<ul>
  <li>
    <a href={`tel:${biz.businessPhone}`}>{formatPhoneUS(biz.businessPhone)}</a>
  </li>
  <li>{formatBusinessHours(biz.businessHours)}</li>
  {biz.featureSettings?.emergency && <li>Emergency Services Available</li>}
</ul>
```

Hard-coded hours that diverge from the booking system config cause customers to expect availability that doesn't exist. There must be one source of truth.

### 4c — Phone consistency (NAP)

NAP (Name / Address / Phone) consistency is one of the strongest signals AI agents use to resolve "is this the same business?" If the booking page says one number and Yelp says another, the entity may be split or confused.

Source `biz.businessPhone` from a single canonical record. Add a CI smoke test that fetches the GBP / Yelp / Facebook listings and compares.

### 4d — Visible price must equal billed price

If the service card shows `$X`, the booking flow must charge `$X` for the same configuration. For per-unit products, show the unit price and the typical-config total side by side:

```tsx
{service.productType === "QUANTITY" ? (
  <div>
    <div className="font-bold text-brand-primary">
      ${service.unitPrice}
      <span className="text-xs"> / {service.quantityKeyword.toLowerCase()}</span>
    </div>
    <div className="text-[10px] text-gray-500">
      ~${service.unitPrice * service.minQuantity} for a typical{" "}
      {service.minQuantity}-{service.quantityKeyword.toLowerCase()} home
    </div>
  </div>
) : (
  <div className="font-bold text-brand-primary">${service.price}</div>
)}
```

---

## 5 — Technical SEO

These are domain-level files, not per-page — but every new location depends on them being correct.

### 5a — `public/robots.txt`

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://{Domain}/sitemap.xml
```

**Maintenance note:** New AI crawler user-agents ship regularly. When a new one becomes relevant (e.g., a new AI search engine gains meaningful market share), add an explicit `Allow` rule and update this doc.

### 5b — `app/sitemap.ts`

Auto-generate from the list of business configs:

```ts
import type { MetadataRoute } from "next";
import { listBusinesses } from "@/lib/business";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const businesses = await listBusinesses();
  return businesses.map(biz => ({
    url: `https://${biz.domain}/${biz.friendlyId}/services`,
    lastModified: biz.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
}
```

### 5c — `public/llms.txt`

`llms.txt` is the **index** that points agents at the per-business `agent.md` files defined in §6. Keep it short — under ~2 KB — and treat it as a discovery file, not the pricing source of truth.

```
# {Brand}
> {One-line description of the business and what it does.}

## Locations (full pricing + availability inside each agent.md)
- [{City}, {State}](https://{Domain}/{friendlyId}/agent.md) — {Phone}
- [{City2}, {State2}](https://{Domain}/{friendlyId2}/agent.md) — {Phone2}

## Booking
Each location's `agent.md` exposes services, full price matrix, and a 14-day slot list. Customer-facing booking pages live at `https://{Domain}/{friendlyId}/services`.

## Contact
- Brand site: https://{BrandDomain}
- Support: {email}
```

**Why two files:** `llms.txt` is the brand-level "table of contents" that crawlers expect at the domain root; `agent.md` is the per-business contract with all the bookable data. Keep prices and slots out of `llms.txt` — they go stale and there's no per-location scope.

---

## 6 — Agent-readable markdown (`agent.md`)

§2 makes the page **parseable** for search crawlers; `agent.md` makes it **executable** for booking agents. The goal: an AI agent reads one URL and has everything needed to quote a price and pick a slot — no DOM traversal, no JS execution, no clicking through the booking flow.

**Where it lives:** every services page must have a sibling at `/{friendlyId}/agent.md`, served as `Content-Type: text/markdown; charset=utf-8`. Same business config source as the page. No auth.

**Discovery:** link it from the page's `<head>` (via `Metadata.alternates.types`) and from `/llms.txt` (§5c). Also expose a visible "Agent-readable version" link in the footer so engineers debugging in production can find it.

```tsx
// app/[friendlyId]/services/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const biz = await getBusinessConfig(params.friendlyId);
  const pageUrl = `https://${biz.domain}/${biz.friendlyId}/services`;
  const agentUrl = `https://${biz.domain}/${biz.friendlyId}/agent.md`;
  return {
    // ... title, description, openGraph, twitter
    alternates: {
      canonical: pageUrl,
      types: { "text/markdown": agentUrl },
    },
  };
}
```

### 6a — File structure

Markdown body for the LLM's context; **two required fenced JSON blocks** are the contract agents parse. If anything in the markdown body contradicts the JSON blocks, the JSON wins.

````markdown
---
name: "{Brand} — {City}, {State}"
business_id: "{friendlyId}"
canonical_url: "https://{Domain}/{friendlyId}/services"
booking_url: "https://{Domain}/{friendlyId}/services"
phone: "+1{E164}"
timezone: "{IANA timezone}"
generated_at: "{ISO timestamp}"
expires_at: "{generated_at + 30m, ISO}"
---

# {Brand} — {City}, {State}

{One-line description of what the business does.}

## Contact
- Phone: {formatted}
- Email: {email}
- Hours: {Mon–Sat 7AM–6PM, etc.}

## Service area
{Primary cities}. {N}+ ZIP codes across {region}.

## Services & pricing

Human-readable summary (mirrors what customers see). Machine-readable
authority is the JSON block below.

- {Service A}: ${price} (flat)
- {Service B}: ${unit_price} / {unit}, ${service_minimum} service minimum
- {Service C}: tiered — S ${a} / M ${b} / L ${c} / XL ${d}
- {Service D}: variants — {label1} ${x} / {label2} ${y}

A ${service_minimum} service minimum applies to the total estimate.

```json services
{
  "currency": "USD",
  "service_minimum": 165.00,
  "services": [
    {
      "id": "carpet-cleaning",
      "name": "Eco-Friendly Carpet Cleaning",
      "pricing_model": "per_unit",
      "unit": "room",
      "unit_definition": "1 room = up to 150 sq ft",
      "unit_price": 67.50,
      "minimum_units": 1,
      "addons": []
    },
    {
      "id": "area-rug",
      "name": "Area Rug Cleaning",
      "pricing_model": "tiered",
      "unit": "rug",
      "tiers": [
        { "key": "S", "label": "Small",       "price":  35.00 },
        { "key": "M", "label": "Medium",      "price":  75.00 },
        { "key": "L", "label": "Large",       "price": 105.00 },
        { "key": "XL","label": "Extra Large", "price": 185.00 }
      ],
      "addons": [
        { "id": "pickup", "name": "In-home pickup", "price": 0.00 }
      ]
    },
    {
      "id": "dryer-vent",
      "name": "Dryer Vent Cleaning",
      "pricing_model": "variant",
      "unit": "vent",
      "variants": [
        { "key": "side", "label": "Side exit", "price": 50.00 },
        { "key": "roof", "label": "Roof exit", "price": 95.00 }
      ]
    },
    {
      "id": "upholstery",
      "name": "Upholstery Cleaning",
      "pricing_model": "variant",
      "variants": [
        { "key": "sofa",      "label": "Sofa",      "price": 185.00 },
        { "key": "loveseat",  "label": "Loveseat",  "price": 120.00 },
        { "key": "chair",     "label": "Chair",     "price":  30.00 },
        { "key": "sectional", "label": "Sectional", "price": 375.00 }
      ]
    }
  ]
}
```

## Availability

Booking windows: {Mon–Sat 7AM–6PM, closed Sunday}. Same-week availability typical.
Earliest open slot: {YYYY-MM-DD HH:mm} {tz}.

```json availability
{
  "timezone": "America/Chicago",
  "generated_at": "2026-05-11T14:00:00-05:00",
  "horizon_days": 14,
  "slot_duration_minutes": 120,
  "slots": [
    { "start": "2026-05-13T08:00:00-05:00", "end": "2026-05-13T10:00:00-05:00" },
    { "start": "2026-05-13T10:00:00-05:00", "end": "2026-05-13T12:00:00-05:00" },
    { "start": "2026-05-14T08:00:00-05:00", "end": "2026-05-14T10:00:00-05:00" }
  ]
}
```

## Booking

To book programmatically, POST to `https://{Domain}/api/{friendlyId}/booking` with:
- `services`: `[{ service_id, quantity?, variant?, tier?, addons? }]`
- `slot`: an ISO timestamp from `availability.slots`
- `customer`: `{ name, email, phone, address }`

Returns `{ confirmation_url, reference_number }`. See the API reference for the full request/response schema.
````

### 6b — Pricing matrix requirements

The `services` JSON block must enumerate **every priceable axis** so an agent can compute any quote without UI. `pricing_model` is the discriminator:

| `pricing_model` | Required keys | Use for |
|---|---|---|
| `flat` | `price` | Fixed per-job price |
| `per_unit` | `unit`, `unit_price`, `minimum_units`, optional `unit_definition` | Per-room, per-vent, per-zone |
| `tiered` | `unit`, `tiers[]` with `key`, `label`, `price` | Size-keyed pricing (S/M/L/XL) |
| `variant` | `variants[]` with `key`, `label`, `price` | Config-keyed pricing (side/roof exit, sofa/loveseat) |
| `per_unit_variant` | `unit`, `minimum_units`, `variants[]` each with `unit_price` | Per-unit pricing that varies by variant |

`addons[]` always shape `{ id, name, price }`. Top-level surcharges (`service_minimum`, `travel_fee`, `hazardous_material_fee`) live as keys on the root object — never buried in service `description` strings. Prices are decimal numbers in `currency`; no string formatting, no `$` prefix, no rounding.

**Pitfall:** if a price tier exists in the UI but not in the JSON, the agent will quote wrong. The JSON is the contract — the UI reduces *from* it, never diverges.

### 6c — Availability requirements

The `availability` JSON block lists open slots over a rolling horizon (default 14 days, configurable per business). Requirements:

- `start` and `end` are ISO-8601 with explicit offset matching `biz.businessTimeZone`
- `slot_duration_minutes` is the standard slot length; variable-length jobs that depend on service mix must emit one slot list per service (`slots_by_service: { service_id: [...] }`) instead
- `generated_at` is when the file was rendered; frontmatter `expires_at` (`generated_at + 30m`) tells agents when to refetch
- Empty `slots[]` is the correct representation for "fully booked" — never omit the block

The route handler must pull from the **same booking-availability source** the customer-facing flow uses. If `agent.md` advertises a slot and the booking API rejects it, that's a P0 — the file is the agent's source of truth and must never lead reality.

### 6d — Generating the file

One Next.js route handler, one render function, one source of truth:

```tsx
// app/[friendlyId]/agent.md/route.ts
import { getBusinessConfig } from "@/lib/business";
import { getAvailability } from "@/lib/availability";
import { renderAgentMarkdown } from "@/lib/agent-md";

export const dynamic = "force-dynamic"; // availability must be fresh

export async function GET(
  _req: Request,
  { params }: { params: { friendlyId: string } }
) {
  const biz = await getBusinessConfig(params.friendlyId);
  const availability = await getAvailability(biz, { horizonDays: 14 });
  const body = renderAgentMarkdown(biz, availability);
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=1800, stale-while-revalidate=300",
    },
  });
}
```

`renderAgentMarkdown(biz, availability)` is the **only** path that constructs the file. Inline string-building in route handlers will drift from page prices over time — keep it in one library function with unit tests covering each `pricing_model`.

### 6e — Parity tests (CI)

Add CI checks that prevent drift between the rendered page and `agent.md`:

1. **Price parity:** every service in the page's React tree has a matching `id` in `agent.md`'s `services` JSON with identical price (including every tier/variant/add-on). Both surfaces consume the same business config; this test catches accidental hard-coding.
2. **Availability parity:** sample 5 slots from `agent.md` and submit them to the booking API in a smoke test. Any rejection fails CI.
3. **Schema validation:** parse both JSON blocks against `schemas/agent-md.json` committed to the repo. `additionalProperties: false` so unknown fields fail loudly (they're typos).
4. **Freshness:** `generated_at` in a fresh fetch is within the last 60 seconds of request time; `expires_at` is `generated_at + 30m`.
5. **Discoverability:** the services page HTML contains a `<link rel="alternate" type="text/markdown">` whose href returns 200 with `Content-Type: text/markdown`.

**Why:** AI booking agents are starting to treat `agent.md` as the source of truth. The moment it drifts from reality, the agent quotes the wrong price, books an unavailable slot, and the customer's first interaction with the business is a broken promise.

---

## 7 — Validation steps

Before merging:

1. **Google Rich Results Test** — paste the staging URL into [search.google.com/test/rich-results](https://search.google.com/test/rich-results). Expect green for `LocalBusiness`, `Service`/`Offer`, and `FAQPage`.
2. **Schema.org Validator** — paste into [validator.schema.org](https://validator.schema.org/). Zero errors.
3. **PageSpeed Insights** — mobile LCP < 2.5s.
4. **Manual rendered-HTML check** — `curl -A "Mozilla/5.0" <staging-url> | grep -oE "(CityA|CityB|CityC)" | sort -u`. The served cities should appear at least once each in the rendered HTML.
5. **AI search smoke test** — search "{Primary Service} {City}" in ChatGPT, Perplexity, and Google. Within 24–48 hours of launch the new page should be discoverable. (Index lag is real; this is a soft check.)
6. **`agent.md` fetch + parse** — `curl -H "Accept: text/markdown" https://{Domain}/{friendlyId}/agent.md` and confirm:
   - `Content-Type: text/markdown; charset=utf-8`
   - Frontmatter parses as YAML and `generated_at` is current
   - Both fenced JSON blocks parse and validate against `schemas/agent-md.json`
   - Prices match the page UI; first 5 slots accepted by booking API in dry-run mode

---

## 8 — Common pitfalls

These are real production issues observed across Express deployments. Each pitfall includes the section that prevents it.

| Pitfall | Example | Prevention |
|---|---|---|
| Layout-default `<title>` shipped on every location page | Page titled "{Brand} - Professional Services" with no city/state mention | §1: per-page `generateMetadata` keyed off business config |
| Service area data only in JS payload, not in DOM | ZIP codes in the React state but the city name appears zero times in rendered HTML | §3a: server-rendered service area block |
| Hard-coded UI hours diverging from config hours | Footer says "Mon-Sat: 7AM-6PM" but booking config is Mon–Fri 7–5 | §4b: render from config, never hard-code |
| Wrong timezone | Business in Central Time shipped with `America/Los_Angeles` | §4a: `assertTimezone` runtime guard |
| Per-unit price displayed as flat total | Service shown as "$600" when actually $60/unit × 10 minimum | §4d + §2d: `UnitPriceSpecification` with explicit `unitText` and `minPrice` |
| Phone as plain text, no `tel:` link | Footer rendered `<li>(555) 123-4567</li>` with no link | §3c: always wrap in `tel:` link |
| NAP inconsistency across listings | Booking page shows one number, Yelp shows another for the same location | §4c: single canonical source + listing audit |
| No `aggregateRating` | AI agents had no way to factor in reviews when recommending | §2b: include `aggregateRating` once review integration is wired |
| Wrong Schema.org `@type` | A plumber using generic `LocalBusiness` instead of `Plumber` | §2a: use the most specific subtype for the vertical |
| FAQ content missing or generic | No FAQ section, or FAQs that don't mention the city or specific prices | §3d: 4 minimum FAQs with location- and price-specific answers |
| `agent.md` price drift from page UI | Service card shows $75, `agent.md` services JSON still says $67.50 from a stale hard-coded literal | §6d + §6e: single `renderAgentMarkdown` source, price-parity CI check |
| `agent.md` slot accepted by file, rejected by booking API | Agent picks a slot that was already booked between render and submission | §6c + §6e: `Cache-Control: max-age=1800`, availability-parity smoke test, dry-run on submit |
| `agent.md` shipped as `text/html` | Default Next.js content-type returned, agents fail to parse | §6d: explicit `Content-Type: text/markdown; charset=utf-8` in `Response` headers |
| Pricing axes flattened into description strings | "Sofa $185, loveseat $120" written into `description` text instead of structured `variants[]` | §6b: every priceable axis is its own field; `description` is human prose only |
| `llms.txt` carries prices that go stale | Domain-level `llms.txt` lists per-service prices that diverge from `agent.md` | §5c: `llms.txt` is an index only — prices live in `agent.md` |

---

## 9 — Update protocol

This document is the source of truth for AI-discoverability requirements across all SERV Express pages. Update it whenever:

- A new structured-data type becomes load-bearing (e.g., `Reservation` extensions, MCP-related schema)
- A new AI crawler user-agent ships and needs explicit allow in `robots.txt`
- A new vertical is onboarded that needs a different Schema.org `@type` (add to §2a table)
- An incident produces a new pitfall worth memorializing (add to §8)
- The SERV platform exposes new business-config fields that should feed into JSON-LD or `agent.md`
- The `agent.md` contract gains a new `pricing_model`, a new top-level surcharge field, or a new availability shape (update §6 and bump `schemas/agent-md.json`)
- An AI booking agent surfaces a parsing failure against `agent.md` (treat as a pitfall in §8 and a schema fix in §6)

When updating, also bump the pre-merge checklist in §0 and (if applicable) update the PR template under `.github/pull_request_template.md`.

---

**Last updated:** 2026-05-11
**Owner:** SERV Engineering
**Applies to:** All SERV Express page builds across all verticals
