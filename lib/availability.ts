// Stubbed slot generator for the agent.md route.
//
// PROTOTYPE_TODO: replace with the real booking-backend integration. The
// renderer in lib/agent-md.ts consumes whatever this returns, so swap the
// implementation here (keep the AvailabilitySnapshot shape) once the
// booking system has an API to call.

import type { BusinessConfig, BusinessHours, BusinessHoursDay } from "./business";

export interface AvailabilitySlot {
  start: string; // ISO-8601 with explicit offset matching biz timezone
  end: string;
}

export interface AvailabilitySnapshot {
  timezone: string;
  generatedAt: string; // ISO-8601
  horizonDays: number;
  slotDurationMinutes: number;
  slots: AvailabilitySlot[];
}

export interface GetAvailabilityOptions {
  horizonDays?: number;
  slotDurationMinutes?: number;
  /** Fraction of generated slots to keep — simulates partial booking. 0..1 */
  bookedFraction?: number;
  /** Seed clock; defaults to new Date(). Used in tests. */
  now?: Date;
}

const DAY_KEYS: (keyof BusinessHours)[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function getAvailability(
  biz: BusinessConfig,
  opts: GetAvailabilityOptions = {},
): AvailabilitySnapshot {
  const horizonDays = opts.horizonDays ?? 14;
  const slotDurationMinutes = opts.slotDurationMinutes ?? 120;
  const bookedFraction = opts.bookedFraction ?? 0.4;
  const now = opts.now ?? new Date();

  const offset = tzOffsetString(biz.businessTimeZone, now);
  const slots: AvailabilitySlot[] = [];

  // Generate slots from tomorrow through (tomorrow + horizonDays - 1).
  // Skipping "today" mirrors how same-day bookings usually aren't bookable
  // online without a phone call.
  for (let dayOffset = 1; dayOffset <= horizonDays; dayOffset++) {
    const day = addDays(now, dayOffset);
    const dayKey = DAY_KEYS[day.getDay()];
    const hours = biz.businessHours[dayKey];
    if ("closed" in hours) continue;

    const dayStr = day.toISOString().slice(0, 10);
    const openMin = parseTime(hours.open);
    const closeMin = parseTime(hours.close);

    for (let m = openMin; m + slotDurationMinutes <= closeMin; m += slotDurationMinutes) {
      // Deterministic pseudo-random based on date+slot index so the same
      // request produces stable output within a generation window.
      const seed = hash(`${dayStr}:${m}`);
      if (seed % 100 < bookedFraction * 100) continue;

      slots.push({
        start: `${dayStr}T${minutesToTime(m)}:00${offset}`,
        end: `${dayStr}T${minutesToTime(m + slotDurationMinutes)}:00${offset}`,
      });
    }
  }

  return {
    timezone: biz.businessTimeZone,
    generatedAt: isoWithOffset(now, offset),
    horizonDays,
    slotDurationMinutes,
    slots,
  };
}

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Returns the offset suffix (e.g., "-05:00") for the given timezone at the
// given instant. Uses Intl.DateTimeFormat — no external deps.
function tzOffsetString(timeZone: string, at: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
  }).formatToParts(at);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  // "GMT-5", "GMT-05:00", "GMT", "UTC+2" → normalize
  const match = tz.match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return "+00:00";
  const sign = match[1];
  const h = match[2].padStart(2, "0");
  const m = (match[3] ?? "00").padStart(2, "0");
  return `${sign}${h}:${m}`;
}

function isoWithOffset(d: Date, offset: string): string {
  // Build "YYYY-MM-DDTHH:mm:ss±HH:MM" in the offset's local time.
  const sign = offset.startsWith("-") ? -1 : 1;
  const [oh, om] = offset.slice(1).split(":").map(Number);
  const shifted = new Date(d.getTime() + sign * (oh * 60 + om) * 60_000);
  const yyyy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(shifted.getUTCDate()).padStart(2, "0");
  const hh = String(shifted.getUTCHours()).padStart(2, "0");
  const mi = String(shifted.getUTCMinutes()).padStart(2, "0");
  const ss = String(shifted.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${offset}`;
}

// Re-export the BusinessHoursDay type for downstream consumers that might
// want to map closed days. Keeps the import surface tidy.
export type { BusinessHoursDay };
