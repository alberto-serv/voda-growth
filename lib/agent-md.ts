// Renderer for /agent.md (see docs/PAGE_BUILD_STANDARDS.md §6).
//
// Single source of truth for the agent-readable surface. The route handler
// (app/agent.md/route.ts) is intentionally thin — all formatting decisions
// live here so they can be unit-tested and so price/availability parity
// with the customer-facing page is enforceable from one place.

import {
  business,
  formatBusinessHours,
  formatPhoneUS,
  siteUrl,
  type BusinessConfig,
} from "./business";
import { availableServices, type CatalogService } from "./services-catalog";
import { computeCarpetLevelPricePerArea } from "./carpet";
import type { AvailabilitySnapshot } from "./availability";

const BOOKING_PATH = "/estimate/services";
const AGENT_PATH = "/agent.md";
const CACHE_TTL_MINUTES = 30;
const CURRENCY = "USD";
const SERVICE_MINIMUM = 165;

type PricingModel =
  | { pricing_model: "flat"; price: number }
  | {
      pricing_model: "per_unit";
      unit: string;
      unit_price: number;
      minimum_units: number;
      unit_definition?: string;
    }
  | {
      pricing_model: "tiered";
      unit: string;
      tiers: Array<{ key: string; label: string; price: number; description?: string }>;
    }
  | {
      pricing_model: "variant";
      unit?: string;
      variants: Array<{ key: string; label: string; price: number }>;
    }
  | {
      pricing_model: "level_priced_per_unit";
      unit: string;
      unit_definition?: string;
      minimum_units: number;
      levels: Array<{
        key: string;
        label: string;
        unit_price: number;
        includes: string[];
      }>;
    };

interface AgentService extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
}

export function renderAgentMarkdown(
  biz: BusinessConfig,
  availability: AvailabilitySnapshot,
): string {
  const generatedAt = availability.generatedAt;
  const expiresAt = addMinutesIso(generatedAt, CACHE_TTL_MINUTES);
  const phoneE164 = biz.businessPhone; // already E.164 in business.ts
  const phoneDisplay = formatPhoneUS(biz.businessPhone);
  const hoursLine = formatBusinessHours(biz.businessHours);
  const cityState = `${biz.city}, ${biz.state}`;
  const bookingUrl = siteUrl(BOOKING_PATH);
  const canonicalUrl = bookingUrl;

  const services = availableServices.map(toAgentService);
  const servicesPayload = {
    currency: CURRENCY,
    service_minimum: SERVICE_MINIMUM,
    services,
  };

  const availabilityPayload = {
    timezone: availability.timezone,
    generated_at: availability.generatedAt,
    horizon_days: availability.horizonDays,
    slot_duration_minutes: availability.slotDurationMinutes,
    slots: availability.slots,
  };

  const earliestSlot = availability.slots[0];
  const earliestLine = earliestSlot
    ? `Earliest open slot: ${earliestSlot.start}.`
    : "No open slots in the current horizon — call to inquire.";

  return [
    "---",
    yamlLine("name", `${biz.brandName} — ${cityState}`),
    yamlLine("business_id", "voda-cleaning-madison"),
    yamlLine("canonical_url", canonicalUrl),
    yamlLine("booking_url", bookingUrl),
    yamlLine("phone", phoneE164),
    yamlLine("timezone", biz.businessTimeZone),
    yamlLine("generated_at", generatedAt),
    yamlLine("expires_at", expiresAt),
    "---",
    "",
    `# ${biz.brandName} — ${cityState}`,
    "",
    `Professional ${biz.serviceList} in ${biz.region}. Online booking with same-week availability.`,
    "",
    "## Contact",
    `- Phone: ${phoneDisplay}`,
    `- Email: ${biz.email}`,
    `- Hours: ${hoursLine}. Closed Sunday.`,
    "",
    "## Service area",
    `${biz.servedCities.join(", ")}. ${biz.serviceAreaCodes.length}+ ZIP codes across ${biz.region}.`,
    "",
    "## Services & pricing",
    "",
    "Human-readable summary (mirrors what customers see on the booking page).",
    "Machine-readable authority is the JSON block below.",
    "",
    ...services.map(renderServiceBullet),
    "",
    `A $${SERVICE_MINIMUM} service minimum applies to the total estimate.`,
    "",
    "```json services",
    JSON.stringify(servicesPayload, null, 2),
    "```",
    "",
    "## Availability",
    "",
    `Booking windows: ${hoursLine}, closed Sunday. Same-week availability typical.`,
    earliestLine,
    "",
    "```json availability",
    JSON.stringify(availabilityPayload, null, 2),
    "```",
    "",
    "## Booking",
    "",
    `Customers book online at ${bookingUrl}. There is no public booking API on this prototype yet — agents should direct users to the booking URL with a pre-selected slot from the \`availability\` block above.`,
    "",
    `Last rendered: ${generatedAt}. Refresh after ${expiresAt} for current availability.`,
    "",
  ].join("\n");
}

function toAgentService(s: CatalogService): AgentService {
  const base = {
    id: s.id,
    name: s.name,
    description: s.description,
  };

  if (s.carpetModel) {
    const m = s.carpetModel;
    return {
      ...base,
      ...{
        pricing_model: "level_priced_per_unit",
        unit: s.unit,
        unit_definition: `1 ${s.unit} = up to ${m.sqftPerArea} sq ft`,
        minimum_units: m.defaultAreas,
        levels: m.levels.map((lvl) => ({
          key: lvl.id,
          label: lvl.name,
          unit_price: round2(computeCarpetLevelPricePerArea(m, lvl)),
          includes: m.addOns
            .filter((a) => lvl.addOnIds.includes(a.id))
            .map((a) => a.name),
        })),
      } satisfies PricingModel,
    };
  }

  if (s.rugModel) {
    const m = s.rugModel;
    return {
      ...base,
      ...{
        pricing_model: "tiered",
        unit: s.unit,
        tiers: m.sizes.map((sz) => ({
          key: sz.id.toUpperCase(),
          label: sz.label,
          price: sz.pricePerRug,
          description: sz.description,
        })),
      } satisfies PricingModel,
    };
  }

  if (s.variants && s.variants.length > 0) {
    return {
      ...base,
      ...{
        pricing_model: "variant",
        unit: s.unit,
        variants: s.variants.map((v) => ({
          key: v.id,
          label: v.name,
          price: v.unitPrice,
        })),
      } satisfies PricingModel,
    };
  }

  // Plain per-unit services (room/vent at fixed unit price).
  if (s.allowCustomQuantity || s.defaultQuantity > 1 || s.unit !== "item") {
    return {
      ...base,
      ...{
        pricing_model: "per_unit",
        unit: s.unit,
        unit_price: s.unitPrice,
        minimum_units: s.defaultQuantity,
      } satisfies PricingModel,
    };
  }

  return {
    ...base,
    ...{ pricing_model: "flat", price: s.unitPrice } satisfies PricingModel,
  };
}

function renderServiceBullet(s: AgentService): string {
  const model = s.pricing_model as PricingModel["pricing_model"];
  switch (model) {
    case "flat":
      return `- ${s.name}: $${formatPrice(s.price as number)} (flat)`;
    case "per_unit": {
      const note = s.minimum_units && (s.minimum_units as number) > 1
        ? `, ${s.minimum_units} ${s.unit} minimum`
        : "";
      return `- ${s.name}: $${formatPrice(s.unit_price as number)} / ${s.unit}${note}`;
    }
    case "tiered": {
      const tiers = (s.tiers as Array<{ key: string; price: number }>)
        .map((t) => `${t.key} $${formatPrice(t.price)}`)
        .join(" / ");
      return `- ${s.name}: ${tiers} (per ${s.unit})`;
    }
    case "variant": {
      const variants = (s.variants as Array<{ label: string; price: number }>)
        .map((v) => `${v.label} $${formatPrice(v.price)}`)
        .join(" / ");
      return `- ${s.name}: ${variants}`;
    }
    case "level_priced_per_unit": {
      const levels = (s.levels as Array<{ label: string; unit_price: number }>)
        .map((l) => `${l.label} $${formatPrice(l.unit_price)}`)
        .join(" / ");
      return `- ${s.name}: ${levels} (per ${s.unit}, ${s.minimum_units} ${s.unit} minimum)`;
    }
  }
}

function yamlLine(key: string, value: string): string {
  return `${key}: ${JSON.stringify(value)}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatPrice(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function addMinutesIso(iso: string, minutes: number): string {
  const match = iso.match(/^(.*?)([+-]\d{2}:\d{2}|Z)$/);
  if (!match) return iso;
  const [, base, offset] = match;
  const d = new Date(`${base}Z`);
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  const shifted = d.toISOString().replace(/\.\d{3}Z$/, "");
  return `${shifted.replace("Z", "")}${offset === "Z" ? "Z" : offset}`;
}

// Convenience for the route handler.
export const AGENT_MD_PATH = AGENT_PATH;
export const AGENT_MD_BOOKING_PATH = BOOKING_PATH;
export const AGENT_MD_CACHE_TTL_MINUTES = CACHE_TTL_MINUTES;

// Re-export for tests / consumers that want the typed business config.
export type { BusinessConfig };
export { business };
