// Single source of truth for business identity, location, and contact info.
// Drives metadata, JSON-LD, footer, robots/sitemap/llms, and any UI that
// renders NAP/hours. Update here, not in JSX.

export type BusinessHoursDay =
  | { closed: true }
  | { open: string; close: string }; // "07:00", "18:00"

export interface BusinessHours {
  mon: BusinessHoursDay;
  tue: BusinessHoursDay;
  wed: BusinessHoursDay;
  thu: BusinessHoursDay;
  fri: BusinessHoursDay;
  sat: BusinessHoursDay;
  sun: BusinessHoursDay;
}

export interface BusinessConfig {
  brandName: string;
  legalName: string;
  primaryService: string;
  serviceList: string;
  schemaType: string;

  // PROTOTYPE_TODO: confirm with owner. 608 area code → Madison, WI.
  city: string;
  state: string;
  region: string;
  servedCities: string[];
  serviceAreaCodes: string[];

  businessTimeZone: string;
  businessHours: BusinessHours;

  businessPhone: string;
  email: string;
  domain: string;

  ogImage: string; // PROTOTYPE_TODO: replace with real 1200x630 image
  logoImage: string;
  priceRange: string;

  sameAs: string[];
}

export const business: BusinessConfig = {
  brandName: "Voda Cleaning & Restoration",
  legalName: "Voda Cleaning & Restoration",
  primaryService: "Professional Cleaning",
  serviceList:
    "carpet cleaning, area rug cleaning, hardwood floor detailing, tile & grout cleaning, dryer vent cleaning, air duct cleaning, upholstery cleaning, and odor & spot treatment",
  schemaType: "CleaningBusiness",

  city: "Madison",
  state: "WI",
  region: "Madison and the greater Dane County area",
  servedCities: [
    "Madison",
    "Sun Prairie",
    "Middleton",
    "Fitchburg",
    "Verona",
    "Waunakee",
    "McFarland",
    "Cottage Grove",
    "Stoughton",
    "Monona",
    "DeForest",
    "Oregon",
  ],
  serviceAreaCodes: [
    "53703", "53704", "53705", "53711", "53713", "53714", "53715", "53716",
    "53717", "53718", "53719", "53726", "53562", "53575", "53589", "53590",
    "53593", "53597", "53598", "53527", "53558",
  ],

  businessTimeZone: "America/Chicago",
  businessHours: {
    mon: { open: "07:00", close: "18:00" },
    tue: { open: "07:00", close: "18:00" },
    wed: { open: "07:00", close: "18:00" },
    thu: { open: "07:00", close: "18:00" },
    fri: { open: "07:00", close: "18:00" },
    sat: { open: "07:00", close: "18:00" },
    sun: { closed: true },
  },

  businessPhone: "+16083988632",
  email: "info@vodacleaning.com",
  domain: "v0-voda-cleaning.vercel.app",

  ogImage: "/og.png",
  logoImage: "/voda-logo.svg",
  priceRange: "$$",

  sameAs: [],
};

export function formatPhoneUS(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^1/, "");
  if (digits.length !== 10) return phone;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function siteUrl(path = ""): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `https://${business.domain}${clean === "/" ? "" : clean}`;
}

const DAY_LABELS: Record<keyof BusinessHours, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const DAY_ORDER: (keyof BusinessHours)[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function fmtTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, "0")}${period}`;
}

// Collapse consecutive days with identical hours into ranges like "Mon–Sat: 7AM–6PM".
export function formatBusinessHours(hours: BusinessHours): string {
  const groups: { start: keyof BusinessHours; end: keyof BusinessHours; day: BusinessHoursDay }[] = [];
  for (const day of DAY_ORDER) {
    const d = hours[day];
    const last = groups[groups.length - 1];
    const sameAsLast =
      last &&
      (("closed" in last.day && "closed" in d) ||
        (!("closed" in last.day) &&
          !("closed" in d) &&
          last.day.open === d.open &&
          last.day.close === d.close));
    if (sameAsLast) {
      last.end = day;
    } else {
      groups.push({ start: day, end: day, day: d });
    }
  }
  return groups
    .filter((g) => !("closed" in g.day))
    .map((g) => {
      const range = g.start === g.end ? DAY_LABELS[g.start] : `${DAY_LABELS[g.start]}–${DAY_LABELS[g.end]}`;
      const d = g.day as Exclude<BusinessHoursDay, { closed: true }>;
      return `${range}: ${fmtTime(d.open)}–${fmtTime(d.close)}`;
    })
    .join(", ");
}

// Schema.org openingHoursSpecification
export function hoursToSchema(hours: BusinessHours) {
  const DAY_SCHEMA: Record<keyof BusinessHours, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };
  return DAY_ORDER.filter((d) => !("closed" in hours[d])).map((d) => {
    const day = hours[d] as Exclude<BusinessHoursDay, { closed: true }>;
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_SCHEMA[d],
      opens: day.open,
      closes: day.close,
    };
  });
}
