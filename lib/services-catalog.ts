import {
  carpetModel,
  computeCarpetTotal,
  computeCarpetAddOnsPricePerArea,
  getCarpetLevelById,
  CARPET_FURNITURE_FEE_PER_AREA,
  s6VacantDiscount,
  type CarpetPricingModel,
  type CarpetSelection,
} from "./carpet"
import {
  rugModel,
  computeRugTotal,
  defaultRugSelection,
  getRugLevelById,
  totalRugCount,
  type RugPricingModel,
  type RugSelection,
} from "./rug"

export interface CatalogVariant {
  id: string
  name: string
  unitPrice: number
  defaultQuantity: number
}

export type ServiceFrequency = "none" | "6-month" | "annual"

export const FREQUENCY_DISCOUNT_PCT: Record<ServiceFrequency, number> = {
  none: 0,
  "6-month": 20,
  annual: 10,
}

export const frequencyMultiplier = (f: ServiceFrequency): number =>
  1 - FREQUENCY_DISCOUNT_PCT[f] / 100

export const frequencyLongLabel = (f: ServiceFrequency): string =>
  f === "annual" ? "Every 12 months" : f === "6-month" ? "Every 6 months" : "One-time"

export const frequencyShortLabel = (f: ServiceFrequency): string =>
  f === "annual" ? "/yr" : f === "6-month" ? "/6mo" : ""

// For the compact picker, where three options plus their discount badges have to
// fit a phone-width card side by side — the long labels don't, and letting them
// scroll hides the last option behind a swipe.
export const frequencyCompactLabel = (f: ServiceFrequency): string =>
  f === "annual" ? "12 mo" : f === "6-month" ? "6 mo" : "One-time"

export const frequencyBadgeLabel = (f: ServiceFrequency): string =>
  f === "annual" ? "Annual" : f === "6-month" ? "Bi-Annual" : "One-Time"

// A single line item inside a bundle. Each component prices independently so a
// bundle can mix flat fees with base-fee + per-unit pricing (e.g. "$149 base for
// vent cleaning, +$50 each vent").
export interface BundleComponent {
  id: string
  name: string
  description?: string
  // "flat": one fixed price. "unit": a base fee covering `includedUnits`, then
  // `unitPrice` for every unit beyond that.
  pricing: "flat" | "unit"
  // flat → the price. unit → the base fee.
  price: number
  unitLabel?: string // e.g. "vent"
  includedUnits?: number // units covered by the base fee
  unitPrice?: number // price per unit beyond the included amount
  defaultUnits?: number // quantity used for the headline / default total
  enabled: boolean
  // When true, this item keeps recurring on each annual renewal.
  recurring?: boolean
}

export interface CatalogService {
  id: string
  name: string
  description: string
  disclaimer?: string
  unitPrice: number
  defaultQuantity: number
  unit: string
  unitLabel: string
  allowCustomQuantity: boolean
  category: "floor-care" | "cleaning"
  variants?: CatalogVariant[]
  carpetModel?: CarpetPricingModel
  rugModel?: RugPricingModel
  recurrenceOptions?: ServiceFrequency[]
  // Bundle — a set of independently-priced services sold together at a discount.
  components?: BundleComponent[]
  // Percentage knocked off every bundled item, so the savings flow per line.
  bundleDiscountPercent?: number
}

// ----- Bundle helpers -----
// These take the minimal bundle-bearing shape so both CatalogService and the
// richer per-page Service types satisfy them.
type BundleHost = { components?: BundleComponent[]; bundleDiscountPercent?: number }

// A service is a bundle when it carries a component list.
export function isBundleService(service: { components?: BundleComponent[] }): boolean {
  return Array.isArray(service.components)
}

// Price of one component at a given quantity (defaults to its configured default
// units). Flat components ignore quantity.
export function getBundleComponentPrice(c: BundleComponent, units?: number): number {
  if (c.pricing !== "unit") return c.price ?? 0
  const qty = Math.max(0, units ?? c.defaultUnits ?? c.includedUnits ?? 0)
  const included = c.includedUnits ?? 0
  const extra = Math.max(0, qty - included)
  return (c.price ?? 0) + extra * (c.unitPrice ?? 0)
}

// Price of one component after the bundle's percentage discount is applied.
export function getBundleComponentNetPrice(
  c: BundleComponent,
  discountPercent?: number,
  units?: number,
): number {
  const gross = getBundleComponentPrice(c, units)
  const pct = Math.max(0, Math.min(100, discountPercent ?? 0))
  return Math.round(gross * (1 - pct / 100) * 100) / 100
}

// Sum of all enabled components with the bundle discount applied to each one.
// `unitsByComponentId` lets the storefront override per-unit quantities (vents).
export function getBundleTotal(
  service: BundleHost,
  unitsByComponentId?: Record<string, number>,
): number {
  const pct = service.bundleDiscountPercent ?? 0
  const sum = (service.components ?? [])
    .filter((c) => c.enabled)
    .reduce((acc, c) => acc + getBundleComponentNetPrice(c, pct, unitsByComponentId?.[c.id]), 0)
  return Math.max(0, Math.round(sum * 100) / 100)
}

// Portion of a bundle's today price that is billed up front: the net
// (bundle-discounted) price of its recurring components. The rest of the bundle
// (one-time components) is paid on site.
export function getBundleChargedTodayTotal(
  service: BundleHost,
  unitsByComponentId?: Record<string, number>,
): number {
  const pct = service.bundleDiscountPercent ?? 0
  const sum = (service.components ?? [])
    .filter((c) => c.enabled && c.recurring)
    .reduce((acc, c) => acc + getBundleComponentNetPrice(c, pct, unitsByComponentId?.[c.id]), 0)
  return Math.max(0, Math.round(sum * 100) / 100)
}

// Renewal total: only the items flagged recurring, each discounted by the annual
// frequency discount (not the bundle discount).
export function getBundleRecurringTotal(
  service: BundleHost,
  recurDiscountPercent?: number,
  unitsByComponentId?: Record<string, number>,
): number {
  const pct = Math.max(0, Math.min(100, recurDiscountPercent ?? 0))
  const sum = (service.components ?? [])
    .filter((c) => c.enabled && c.recurring)
    .reduce(
      (acc, c) => acc + getBundleComponentPrice(c, unitsByComponentId?.[c.id]) * (1 - pct / 100),
      0,
    )
  return Math.max(0, Math.round(sum * 100) / 100)
}

// Per-service map of {componentId: chosen units} for unit-priced components,
// reading any customer overrides out of the persisted selection state.
export function bundleUnitsMap(
  service: BundleHost & { id: string },
  bundleUnits?: Record<string, number>,
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const c of service.components ?? []) {
    if (c.pricing === "unit") {
      map[c.id] = bundleUnits?.[`${service.id}:${c.id}`] ?? c.defaultUnits ?? c.includedUnits ?? 0
    }
  }
  return map
}

export const availableServices: CatalogService[] = [
  {
    id: "carpet-cleaning",
    name: "Eco-Friendly Carpet Cleaning",
    description:
      "Deep steam cleaning with non-toxic solutions to remove dirt, stains, and allergens—fast drying, safe for homes and pets.",
    disclaimer: `1 room = ${carpetModel.sqftPerArea} sq ft.`,
    unitPrice: 67.5,
    defaultQuantity: carpetModel.defaultAreas,
    unit: "room",
    unitLabel: "per room",
    allowCustomQuantity: true,
    category: "floor-care",
    carpetModel,
    recurrenceOptions: ["none", "6-month", "annual"],
  },
  {
    id: "routine-floor-care",
    name: "Routine Floor Care",
    description:
      "Regular vacuuming and mopping to maintain your floors in top condition between deep cleanings.",
    unitPrice: 75,
    defaultQuantity: 1,
    unit: "room",
    unitLabel: "per room",
    allowCustomQuantity: true,
    category: "floor-care",
  },
  {
    id: "rugs",
    name: "Area Rug Cleaning",
    description:
      "Gentle hand-wash cleaning to remove stains, odors, and allergens — synthetic and oriental rugs welcome.",
    disclaimer: "In-home or offsite pickup available.",
    unitPrice: rugModel.sizes.find((s) => s.id === rugModel.defaultSizeId)?.pricePerRug ?? 0,
    defaultQuantity: 1,
    unit: "rug",
    unitLabel: "per rug",
    allowCustomQuantity: false,
    category: "floor-care",
    rugModel,
    recurrenceOptions: ["none", "6-month", "annual"],
  },
  {
    id: "hardwood-detailing",
    name: "Hardwood Floor Detailing",
    description:
      "Cleans, polishes, and restores hardwood floors with an optional protective finish.",
    disclaimer: "Refinishing not always included.",
    unitPrice: 127.5,
    defaultQuantity: 1,
    unit: "room",
    unitLabel: "per room",
    allowCustomQuantity: true,
    category: "floor-care",
  },
  {
    id: "tile-grout-stone",
    name: "Tile, Grout & Stone Cleaning",
    description:
      "High-powered steam cleaning lifts stains and buildup, restoring shine and extending surface life.",
    disclaimer: "Sealant optional.",
    unitPrice: 300,
    defaultQuantity: 1,
    unit: "room",
    unitLabel: "per room",
    allowCustomQuantity: true,
    category: "floor-care",
  },
  {
    id: "dryer-vent-cleaning",
    name: "Dryer Vent Cleaning",
    description:
      "Removes dust, allergens, and lint using negative air systems to improve airflow and air quality.",
    disclaimer: "Min. service applies.",
    unitPrice: 50,
    defaultQuantity: 1,
    unit: "vent",
    unitLabel: "per vent",
    allowCustomQuantity: false,
    category: "cleaning",
    variants: [
      { id: "side-exit", name: "Side Exit", unitPrice: 50, defaultQuantity: 1 },
      { id: "roof-exit", name: "Roof Exit", unitPrice: 95, defaultQuantity: 0 },
    ],
  },
  {
    id: "air-duct-cleaning",
    name: "Air Duct Cleaning",
    description:
      "Removes dust, allergens, and lint using negative air systems to improve airflow and air quality.",
    disclaimer: "Min. service applies.",
    unitPrice: 50,
    defaultQuantity: 12,
    unit: "vent",
    unitLabel: "per vent",
    allowCustomQuantity: true,
    category: "cleaning",
    recurrenceOptions: ["none", "annual"],
  },
  {
    id: "upholstery-cleaning",
    name: "Upholstery Cleaning",
    description:
      "Deep cleans fabric furniture to remove oils, dirt, and allergens while minimizing dry time.",
    disclaimer: "Fabric limitations apply.",
    unitPrice: 0,
    defaultQuantity: 1,
    unit: "item",
    unitLabel: "per item",
    allowCustomQuantity: false,
    category: "cleaning",
    variants: [
      { id: "sofa", name: "Sofa", unitPrice: 185, defaultQuantity: 1 },
      { id: "loveseat", name: "Loveseat", unitPrice: 120, defaultQuantity: 0 },
      { id: "chair", name: "Chair", unitPrice: 30, defaultQuantity: 0 },
      { id: "sectional", name: "Sectional", unitPrice: 375, defaultQuantity: 0 },
    ],
  },
  {
    id: "odor-spot-control",
    name: "Odor & Spot Treatment",
    description:
      "Targets tough stains and odors at the source across carpets, upholstery, and more.",
    disclaimer: "Results may vary by severity.",
    unitPrice: 200,
    defaultQuantity: 1,
    unit: "room",
    unitLabel: "per room",
    allowCustomQuantity: true,
    category: "cleaning",
  },
  // Bundle — combines several services at a single discounted price. Selectable
  // on /services2 only; kept here so it resolves in the later booking steps.
  {
    id: "healthy-home-bundle",
    name: "Healthy Home Bundle",
    description:
      "Our complete refresh — carpet cleaning, vent cleaning, and an upholstery refresh priced together so you save versus booking each one separately.",
    unitPrice: 0,
    defaultQuantity: 1,
    unit: "bundle",
    unitLabel: "bundle",
    allowCustomQuantity: false,
    category: "cleaning",
    bundleDiscountPercent: 15,
    components: [
      {
        id: "cmp-bundle-vents",
        name: "Vent Cleaning",
        description: "Whole-home vent clean. Flat service fee plus a per-vent rate.",
        pricing: "unit",
        price: 149,
        unitLabel: "vent",
        includedUnits: 0,
        unitPrice: 50,
        defaultUnits: 8,
        enabled: true,
      },
      {
        id: "cmp-bundle-carpet",
        name: "Eco-Friendly Carpet Cleaning",
        description: "Deep steam clean of your main living areas, renewed each year.",
        pricing: "flat",
        price: 202,
        enabled: true,
        recurring: true,
      },
      {
        id: "cmp-bundle-upholstery",
        name: "Upholstery Refresh",
        description: "Fabric sofa deep clean to lift oils, dirt, and allergens.",
        pricing: "flat",
        price: 185,
        enabled: true,
      },
    ],
  },
]

export interface ServiceSelectionState {
  serviceQuantities?: Record<string, number>
  variantQuantities?: Record<string, Record<string, number>>
  carpetSelection?: Record<string, CarpetSelection>
  rugSelection?: Record<string, RugSelection>
  // Customer-chosen quantities for unit-priced bundle components, keyed by
  // `${serviceId}:${componentId}`.
  bundleUnits?: Record<string, number>
}

export interface ResolvedServiceLine {
  id: string
  name: string
  numericPrice: number
  displayName: string
  // Portion of numericPrice billed up front rather than on site. Set for
  // bundles (their recurring components bill today); undefined for plain
  // services, where the per-service frequency decides today-vs-on-site.
  chargedToday?: number
  // Per-item breakdown for variant services (e.g. upholstery: Sofa, Chair).
  // Each entry is one selected variant with quantity > 0. Undefined for
  // services without variants; callers render these as indented sub-rows.
  subLines?: { label: string; numericPrice: number }[]
}

export function resolveServiceLine(
  service: CatalogService,
  state: ServiceSelectionState,
): ResolvedServiceLine {
  if (isBundleService(service)) {
    const units = bundleUnitsMap(service, state.bundleUnits)
    const numericPrice = getBundleTotal(service, units)
    const count = (service.components ?? []).filter((c) => c.enabled).length
    return {
      id: service.id,
      name: service.name,
      numericPrice,
      displayName: `${service.name} — ${count} ${count === 1 ? "service" : "services"} bundled`,
      chargedToday: getBundleChargedTodayTotal(service, units),
    }
  }
  if (service.carpetModel) {
    const sel = state.carpetSelection?.[service.id]
    const areas = sel?.areas ?? service.carpetModel.defaultAreas
    // À-la-carte selection (services4): base clean + explicit add-ons. Priced
    // the same way the card does, so the quote matches through checkout.
    if (sel?.addOnIds) {
      // Base clean is quoted vacant; furnished (move furniture) adds the surcharge.
      const perArea =
        computeCarpetAddOnsPricePerArea(service.carpetModel, sel.addOnIds) -
        (sel.moveFurniture ? 0 : CARPET_FURNITURE_FEE_PER_AREA)
      // services6 vacant-room credit is a flat per-booking discount, not per area.
      const numericPrice = areas * perArea - s6VacantDiscount(sel)
      const n = sel.addOnIds.length
      // services6 uses `vacant`; other flows use the furniture-move surcharge.
      const stateLabel = sel.vacant ? "vacant rooms" : sel.moveFurniture ? "furniture move" : null
      const extras = [n ? `${n} add-on${n === 1 ? "" : "s"}` : null, stateLabel]
        .filter(Boolean)
        .join(" + ")
      return {
        id: service.id,
        name: service.name,
        numericPrice,
        displayName: `${service.name} — Base clean${extras ? ` + ${extras}` : ""} · ${areas} ${areas === 1 ? "room" : "rooms"}`,
      }
    }
    const level = getCarpetLevelById(service.carpetModel, sel?.levelId)
    const numericPrice = computeCarpetTotal(service.carpetModel, { areas, levelId: level.id })
    return {
      id: service.id,
      name: service.name,
      numericPrice,
      displayName: `${service.name} — ${level.name} · ${areas} ${areas === 1 ? "room" : "rooms"}`,
    }
  }
  if (service.rugModel) {
    const sel: RugSelection = state.rugSelection?.[service.id] ?? defaultRugSelection(service.rugModel)
    const level = getRugLevelById(service.rugModel, sel.levelId)
    const numericPrice = computeRugTotal(service.rugModel, sel)
    const count = totalRugCount(sel)
    const breakdown = service.rugModel.sizes
      .filter((s) => (sel.quantities[s.id] ?? 0) > 0)
      .map((s) => `${sel.quantities[s.id]}× ${s.label}`)
      .join(", ")
    return {
      id: service.id,
      name: service.name,
      numericPrice,
      displayName: breakdown
        ? `${service.name} — ${level.name} · ${breakdown}`
        : `${service.name} — ${level.name} · ${count} ${count === 1 ? "rug" : "rugs"}`,
    }
  }
  if (service.variants) {
    const vqs = state.variantQuantities?.[service.id] ?? {}
    const subLines = service.variants
      .map((v) => {
        const qty = vqs[v.id] ?? v.defaultQuantity
        if (qty <= 0) return null
        return {
          label: qty > 1 ? `${v.name} ×${qty}` : v.name,
          numericPrice: v.unitPrice * qty,
        }
      })
      .filter((s): s is { label: string; numericPrice: number } => s !== null)
    const numericPrice = subLines.reduce((sum, s) => sum + s.numericPrice, 0)
    return { id: service.id, name: service.name, numericPrice, displayName: service.name, subLines }
  }
  const qty = state.serviceQuantities?.[service.id] ?? service.defaultQuantity
  return {
    id: service.id,
    name: service.name,
    numericPrice: service.unitPrice * qty,
    displayName: service.name,
  }
}
