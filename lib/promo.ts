// Promo codes recognized across the estimate flow. Value = percent off the
// pre-tax services subtotal. Centralized here so /landing, /services2, and the
// customer/payment steps all agree instead of duplicating the table.
export const PROMO_CODES: Record<string, number> = {
  SAVE10: 10,
  SAVE20: 20,
  FIRST15: 15,
  RESIDENTIAL15: 15,
}

// The promo advertised on the /landing page and carried into the booking flow.
// Arriving via /services2?promo=RESIDENTIAL15 marks the visitor as promo-
// originated, which auto-applies the discount and shows the promo banner.
export const LANDING_PROMO_CODE = "RESIDENTIAL15"
export const LANDING_PROMO_PCT = PROMO_CODES[LANDING_PROMO_CODE]

// Percent off for a code (case-insensitive); 0 if the code isn't recognized.
export function getPromoPercent(code?: string | null): number {
  if (!code) return 0
  return PROMO_CODES[code.toUpperCase()] ?? 0
}

// Flat-price promotional offers — a fixed price for a specific set of a single
// service's variants, rather than a percentage off any selection. Unlike
// PROMO_CODES, a flat offer targets required pieces (e.g. one sofa + one
// loveseat) and yields a precomputed dollar discount the checkout carries as
// `promo.discount`, so the rest of the pipeline (which already reduces the total
// by a dollar `promoDiscount`) needs no percentage-specific logic.
export interface FlatOffer {
  code: string
  serviceId: string
  // The variants the flat price covers; the offer applies only when at least one
  // of each is selected. Exactly one of each is covered — extra pieces stay full.
  requiredVariants: string[]
  flatPrice: number
  // Marketing "regular" price, for display alongside the flat price.
  regularPrice: number
  bannerLabel: string
}

export const FLAT_OFFERS: Record<string, FlatOffer> = {
  UPHOLSTERY149: {
    code: "UPHOLSTERY149",
    serviceId: "upholstery-cleaning",
    requiredVariants: ["sofa", "loveseat"],
    flatPrice: 149,
    regularPrice: 209,
    bannerLabel: "New-customer offer applied — sofa & loveseat deep clean for $149.",
  },
}

// The flat offer advertised on the /offer page and carried into /services6.
export const UPHOLSTERY_OFFER_CODE = "UPHOLSTERY149"

// The flat offer for a code (case-insensitive); null if the code isn't a flat
// offer. Kept separate from getPromoPercent so callers can branch on kind.
export function getFlatOffer(code?: string | null): FlatOffer | null {
  if (!code) return null
  return FLAT_OFFERS[code.toUpperCase()] ?? null
}

// Dollar discount a flat offer yields for the given per-variant unit prices and
// selected quantities. 0 unless every required variant is present (>= 1). The
// offer covers exactly one of each required piece down to the flat price;
// additional pieces stay full price.
export function flatOfferDiscount(
  offer: FlatOffer,
  variantUnitPrices: Record<string, number>,
  variantQuantities: Record<string, number>,
): number {
  for (const v of offer.requiredVariants) {
    if ((variantQuantities[v] ?? 0) < 1) return 0
  }
  const coveredRegular = offer.requiredVariants.reduce(
    (sum, v) => sum + (variantUnitPrices[v] ?? 0),
    0,
  )
  return Math.max(0, Math.round(coveredRegular - offer.flatPrice))
}
