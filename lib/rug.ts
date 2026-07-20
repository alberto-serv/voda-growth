export interface RugSize {
  id: string
  label: string
  description: string
  pricePerRug: number
}

export interface RugServiceLevel {
  id: string
  name: string
  tagline: string
  bronzeFeatures?: string[]
  newAddOns?: string[]
  mostPopular?: boolean
}

export interface RugPricingModel {
  sizes: RugSize[]
  defaultSizeId: string
  defaultLevelId: string
  levels: RugServiceLevel[]
}

export interface RugSelection {
  quantities: Record<string, number>
  levelId: string
}

export const RUG_MAX_PER_SIZE = 6

export const rugModel: RugPricingModel = {
  sizes: [
    { id: "s", label: "S", description: "Fits 3 × 8 ft", pricePerRug: 35 },
    { id: "m", label: "M", description: "Fits 5 × 8 or 6 × 9 ft", pricePerRug: 75 },
    { id: "l", label: "L", description: "Fits 8 × 10 or 9 × 12 ft", pricePerRug: 105 },
    { id: "xl", label: "XL", description: "Fits 10 × 13 ft & larger", pricePerRug: 185 },
  ],
  defaultSizeId: "m",
  defaultLevelId: "silver",
  levels: [
    {
      id: "bronze",
      name: "Bronze",
      tagline: "Standard clean",
      bronzeFeatures: ["Rack hand-wash", "Pre-spray treatment", "Hot water extraction"],
    },
    {
      id: "silver",
      name: "Silver",
      tagline: "Deep clean",
      newAddOns: ["Brush Pro deep cleaning", "HEPA Pre-Vacuum"],
      mostPopular: true,
    },
    {
      id: "gold",
      name: "Gold",
      tagline: "Premium finish",
      newAddOns: ["Lemon deodorizer", "Carpet fluffing"],
    },
  ],
}

export function getRugLevelById(model: RugPricingModel, levelId?: string): RugServiceLevel {
  const fallback = model.levels.find((l) => l.id === model.defaultLevelId) ?? model.levels[0]
  if (!levelId) return fallback
  return model.levels.find((l) => l.id === levelId) ?? fallback
}

export function getRugSizeById(model: RugPricingModel, sizeId?: string): RugSize {
  const fallback = model.sizes.find((s) => s.id === model.defaultSizeId) ?? model.sizes[0]
  if (!sizeId) return fallback
  return model.sizes.find((s) => s.id === sizeId) ?? fallback
}

export function totalRugCount(sel: RugSelection): number {
  return Object.values(sel.quantities).reduce((sum, n) => sum + (n || 0), 0)
}

export function computeRugTotal(model: RugPricingModel, sel: RugSelection): number {
  return model.sizes.reduce(
    (sum, size) => sum + (sel.quantities[size.id] ?? 0) * size.pricePerRug,
    0,
  )
}

export function defaultRugSelection(model: RugPricingModel): RugSelection {
  return {
    quantities: { [model.defaultSizeId]: 1 },
    levelId: model.defaultLevelId,
  }
}
