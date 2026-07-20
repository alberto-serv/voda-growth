export interface CarpetAddOn {
  id: string
  name: string
  description?: string
  price: number
  unit: "sqft" | "area"
}

export interface CarpetServiceLevel {
  id: string
  name: string
  tagline?: string
  features: string[]
  addOnIds: string[]
  mostPopular?: boolean
}

export interface CarpetPricingModel {
  ratePerSqft: number
  sqftPerArea: number
  defaultAreas: number
  addOns: CarpetAddOn[]
  levels: CarpetServiceLevel[]
}

export interface CarpetSelection {
  areas: number
  levelId: string
  // À-la-carte selection (services4): the base steam clean plus explicitly
  // chosen add-on ids, instead of a Bronze/Silver/Gold level. When present this
  // takes precedence over `levelId` so the later booking steps price the exact
  // same selection the customer made on the card.
  addOnIds?: string[]
  // Furnished home: the crew moves light furniture during cleaning. Adds a
  // per-room fee on top of the selection. Absent/false = vacant rooms.
  moveFurniture?: boolean
  // services6 only: the customer marked their rooms vacant, which applies a flat
  // per-booking discount (see s6VacantDiscount) rather than a per-room fee.
  vacant?: boolean
}

// Per-room surcharge when the crew moves light furniture during cleaning
// (furnished home). The à-la-carte base clean is quoted for a vacant room; this
// brings it up to the furnished rate. Matches the /services2 base-clean spread
// (furnished $67.50 − vacant $65 per room). Kept here so the card quote and the
// checkout price stay in lockstep.
export const CARPET_FURNITURE_FEE_PER_AREA = 2.5

// services6 vacant-room discount. A flat per-booking amount (not per room) that
// only applies when more than one room is booked: $50 when any card add-on is
// chosen, $20 otherwise. Both the card and the shared checkout call this so the
// quote stays in lockstep. Returns 0 when it doesn't apply.
export const S6_VACANT_DISCOUNT_NO_ADDON = 20
export const S6_VACANT_DISCOUNT_WITH_ADDON = 50
export const S6_CARD_ADDON_IDS = ["s6-pet-odor-control", "s6-stain-removal"]

export function s6VacantDiscount(sel: {
  areas: number
  addOnIds?: string[]
  vacant?: boolean
}): number {
  if (!sel.vacant || sel.areas <= 1) return 0
  const hasAddOn = (sel.addOnIds ?? []).some((id) => S6_CARD_ADDON_IDS.includes(id))
  return hasAddOn ? S6_VACANT_DISCOUNT_WITH_ADDON : S6_VACANT_DISCOUNT_NO_ADDON
}

export const carpetModel: CarpetPricingModel = {
  ratePerSqft: 0.45,
  sqftPerArea: 150,
  defaultAreas: 3,
  addOns: [
    {
      id: "stain-protection",
      name: "Carpet/Fabric Stain Protection",
      description: "Maxim Advanced — guards against water- and oil-based spills.",
      price: 0.3,
      unit: "sqft",
    },
    {
      id: "brush-pro",
      name: "Brush Pro Agitation",
      description: "Deep agitation for traffic areas and embedded soils.",
      price: 0.1,
      unit: "sqft",
    },
    {
      id: "hepa-vacuum",
      name: "HEPA Pre-Vacuum",
      description: "Allergen-grade pre-vacuum before extraction.",
      price: 11,
      unit: "area",
    },
    {
      id: "filtration-lines",
      name: "Filtration Lines Removal",
      description: "Targeted cleaning of dark soil lines along edges and baseboards.",
      price: 1.5,
      unit: "area",
    },
    {
      id: "pet-odor",
      name: "Deep Pet Odor Removal (Natural Oxygen)",
      description: "Pet spot/odor treatment using the natural power of oxygen.",
      price: 125,
      unit: "area",
    },
    // services6 card add-ons. Priced as a single flat per-room amount (not the
    // sum of the underlying treatments) so the card can show a round number and
    // the shared checkout resolves the exact same figure. Referenced only by
    // /services6 — no level or package includes them, so other flows are inert.
    {
      id: "s6-pet-odor-control",
      name: "Pet odor removal",
      description: "Neutralizes pet odor at the source using the natural power of oxygen.",
      price: 127,
      unit: "area",
    },
    {
      id: "s6-stain-removal",
      name: "Stain protection",
      description: "Lifts set-in stains and dark soil lines, then guards against new ones.",
      price: 71,
      unit: "area",
    },
  ],
  levels: [
    {
      id: "bronze",
      name: "Bronze",
      tagline: "Standard clean",
      features: [
        "Deep steam carpet cleaning",
        "Non-toxic, pet-safe solutions",
        "Pre-treatment of heavy traffic areas",
      ],
      addOnIds: [],
    },
    {
      id: "silver",
      name: "Silver",
      tagline: "Enhanced clean",
      features: [],
      addOnIds: ["stain-protection", "brush-pro", "hepa-vacuum"],
      mostPopular: true,
    },
    {
      id: "gold",
      name: "Gold",
      tagline: "Restoration grade",
      features: [],
      addOnIds: ["stain-protection", "brush-pro", "hepa-vacuum", "filtration-lines", "pet-odor"],
    },
  ],
}

export function computeCarpetLevelPricePerArea(
  model: CarpetPricingModel,
  level: CarpetServiceLevel,
): number {
  const sqftAdd = model.addOns
    .filter((a) => level.addOnIds.includes(a.id) && a.unit === "sqft")
    .reduce((sum, a) => sum + a.price, 0)
  const flatAdd = model.addOns
    .filter((a) => level.addOnIds.includes(a.id) && a.unit === "area")
    .reduce((sum, a) => sum + a.price, 0)
  return (model.ratePerSqft + sqftAdd) * model.sqftPerArea + flatAdd
}

export function getCarpetLevelById(
  model: CarpetPricingModel,
  levelId: string | undefined,
): CarpetServiceLevel {
  if (!levelId) return model.levels.find((l) => l.mostPopular) ?? model.levels[0]
  return model.levels.find((l) => l.id === levelId) ?? model.levels[0]
}

// Per-area price of a single add-on: sqft add-ons scale by room size, area
// add-ons are a flat per-room amount.
export function carpetAddOnPricePerArea(model: CarpetPricingModel, addOnId: string): number {
  const a = model.addOns.find((x) => x.id === addOnId)
  if (!a) return 0
  return a.unit === "sqft" ? a.price * model.sqftPerArea : a.price
}

// Per-area price for an à-la-carte selection: base steam clean + every add-on.
export function computeCarpetAddOnsPricePerArea(
  model: CarpetPricingModel,
  addOnIds: string[],
): number {
  return (
    model.ratePerSqft * model.sqftPerArea +
    addOnIds.reduce((sum, id) => sum + carpetAddOnPricePerArea(model, id), 0)
  )
}

export function computeCarpetTotal(model: CarpetPricingModel, sel: CarpetSelection): number {
  // À-la-carte selection (services4) takes precedence over the level tiers. Its
  // base clean is priced for a vacant room; "move furniture" (furnished) adds
  // the per-room surcharge back on.
  if (sel.addOnIds) {
    const perArea =
      computeCarpetAddOnsPricePerArea(model, sel.addOnIds) -
      (sel.moveFurniture ? 0 : CARPET_FURNITURE_FEE_PER_AREA)
    return sel.areas * perArea
  }
  const level = getCarpetLevelById(model, sel.levelId)
  return sel.areas * computeCarpetLevelPricePerArea(model, level)
}
