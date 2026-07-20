import { business, formatPhoneUS } from "./business";

export interface FAQ {
  q: string;
  a: string;
}

export const faqs: FAQ[] = [
  {
    q: `How much does professional cleaning cost in ${business.city}, ${business.state}?`,
    a:
      `Pricing depends on the service. Carpet cleaning starts at $67.50 per room, ` +
      `dryer vent cleaning at $50 per vent, hardwood floor detailing at $127.50 per room, ` +
      `and tile, grout & stone cleaning at $300 per room. You can build a full estimate online ` +
      `with exact totals before booking.`,
  },
  {
    q: `What areas do you service near ${business.city}?`,
    a:
      `We serve ${business.servedCities.slice(0, -1).join(", ")}, and ${business.servedCities.slice(-1)[0]} — ` +
      `plus ${business.serviceAreaCodes.length}+ ZIP codes across ${business.region}.`,
  },
  {
    q: `How long does a typical cleaning appointment take?`,
    a:
      `Most carpet, rug, and floor-care jobs are completed in 1–3 hours depending on square footage. ` +
      `Air duct cleaning for a typical home runs about 2–4 hours. We confirm the time window when you book.`,
  },
  {
    q: `Do you offer same-day or emergency service?`,
    a:
      `We offer same-week availability for most services and can often accommodate next-day requests. ` +
      `For emergency restoration needs, call ${formatPhoneUS(business.businessPhone)}.`,
  },
];
