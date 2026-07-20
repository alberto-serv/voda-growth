# /services2 — Engineering Handoff & Requirements

> Service-selection page ("Select Services", Step 1 of 3) for the Voda Cleaning &
> Restoration booking flow. This document describes the **current behavior** of
> `app/services2/page.tsx` for engineering handoff. It is a spec of what exists,
> with open questions called out at the end.

---

## 1. Overview

`/services2` is the entry point of the booking funnel. The visitor selects and
configures cleaning services, sees a live running estimate, and continues into
the shared `/estimate/*` checkout. It also exposes two **no-payment** lead paths:
**Emergency & Restoration** and **Commercial inquiry**.

- **Route:** `app/services2/page.tsx` (Next.js App Router, `"use client"`)
- **Framework:** Next 14 / React 19, Tailwind v4, shadcn/ui, `vaul` (mobile sheets), lucide icons
- **Catalog source:** `@/lib/services-catalog`, `@/lib/carpet`, `@/lib/rug`
- **Downstream:** `/estimate/customer` → `/estimate/payment` → `/estimate/confirmation`
- **State handoff:** `localStorage["estimateData"]` (no backend calls on this page)

---

## 2. Page Layout

Fixed top **navbar** + a two-column body inside `max-w-[1800px]`.

### Navbar (fixed, shrinks on scroll)
- Left group: logo → divider → **"Select Services"** title → **"STEP 1 OF 3"** pill → **"Looking for commercial?"** link (`lg+` only).
- Right: **Appointments-available card** (`lg+` only) — green calendar tile, "APPOINTMENTS AVAILABLE AS SOON AS", bold next-business-day with a green dot.

### Body
- **Left panel (`lg` 50%):** dollhouse illustration (`/house-whitewalls.png`) with absolutely-positioned **pin dots** per service; selected = cyan glow, unselected = white. Sticky under the navbar.
- **Right panel (`lg` 50%):** the **cards column** — appointment/commercial fallback (below `lg`), Emergency card, then service cards grouped by category, then the sticky estimate/continue bar.

### Mobile (`< lg`)
- Segmented toggle: **List** (default) | **All** (dollhouse pills view).
- Tapping a pill/card opens a **bottom sheet** (`vaul`) configurator. Emergency & Bundle have their own sheets.
- The appointment pill + commercial link render at the top of the cards column (navbar versions are hidden below `lg`).

---

## 3. Data Model (service catalog)

`Service` (subset of fields relevant here):

| field | notes |
|---|---|
| `id`, `name`, `description`, `disclaimer?` | display |
| `unitPrice`, `unit`, `unitLabel` | base price + unit ("per room", "per vent", "per rug", "per item", "bundle") |
| `defaultQuantity`, `allowCustomQuantity` | stepper config |
| `category` | `"floor-care"` \| `"cleaning"` |
| `icon` | lucide icon (fallback tile art) |
| `position`, `labelPosition?` | dollhouse pin coordinates |
| `variants?`, `variantMode?` | `"chips"` (dryer vent: Side/Roof exit) or `"steppers"` (upholstery: per-piece counts) |
| `carpetModel?` | tiered per-room pricing (furnished/vacant occupancy, Bronze/Silver/Gold tiers, add-ons) |
| `rugModel?` | per-size, per-rug pricing |
| `recurrenceOptions?` | subset of `["none","6-month","annual"]` |
| `components?`, `bundleDiscountPercent?` | bundle composition |

**Services:** carpet-cleaning, routine-floor-care, rugs, hardwood-detailing,
tile-grout-stone (Floor Care); dryer-vent-cleaning, air-duct-cleaning,
upholstery-cleaning, odor-spot-control, healthy-home-bundle (Cleaning).

`SERVICE_MINIMUM = 165` (USD).

---

## 4. Functional Requirements

### 4.1 Service selection & configuration
- **FR-1** Selecting a service toggles it into the estimate; deselecting removes it.
- **FR-2** Configurators by type:
  - **Carpet** — rooms stepper + occupancy (Furnished/Vacant) + service tier + optional add-ons.
  - **Rug** — per-size quantity steppers.
  - **Upholstery** (`variantMode: "steppers"`) — per-piece counts (Sofa, Sectional, Chair, …).
  - **Dryer vent** (`variantMode: "chips"`) — Side Exit / Roof Exit toggle chips.
  - **Simple** — quantity stepper (+ frequency if applicable).
- **FR-3** Services with `recurrenceOptions` show a **frequency picker** (One-time / Every 6 months / Every 12 months). Frequency applies a discount via `frequencyMultiplier()` (per current UI: 6-month −20%, annual −10%).
- **FR-4** The **Healthy Home Bundle** (carpet + vents + upholstery) is priced as a group with `bundleDiscountPercent`; user sets bundled unit counts (e.g. # vents).

### 4.2 Estimate & billing
- **FR-5** A live total updates on every change (`calculateTotalPrice()`), recomputed via `useEffect`.
- **FR-6** **Service minimum**: a progress bar shows progress to `SERVICE_MINIMUM`; **Continue is disabled** until met ("Add $X to Continue").
- **FR-7** **Billing split** (charged today vs on-site): **subscriptions** (recurring frequencies) are charged today; **one-time** services are paid on site after the work. Both are surfaced in the order-summary UI downstream.

### 4.3 Appointment availability
- **FR-8** Display **"Appointments available as soon as &lt;next business day&gt;"**.
  - Computed **client-side** (`useEffect` → state) as today + 1, skipping Sat/Sun.
  - Format: weekday + month + day (e.g. "Thursday, June 11").
  - Must be computed at view time (not build time) to stay correct on a static build.

### 4.4 Emergency & Restoration (no-payment)
- **FR-9** Emergency card: white background, red outline, **collapsed by default**.
- **FR-10** Expanding it reveals damage-type **chips** (Water / Fire / Mold / Storm) styled like the dryer-vent chips, plus a **Book** button (disabled until a type is chosen).
- **FR-11** Book → `startEmergencyCheckout(damage)`:
  - writes `estimateData = { …prior, services: { selectedServices: [], totalPrice: 0 }, emergency: { damageType }, commercial: undefined, skipPayment: true }`
  - routes to `/estimate/customer`.
- A "Call (608) 398-8632" tel link is always available.

### 4.5 Commercial inquiry (no-payment)
- **FR-12** "Looking for commercial?" link → `startCommercialInquiry()`:
  - writes `estimateData = { …prior, services: { selectedServices: [], totalPrice: 0 }, commercial: true, emergency: undefined, skipPayment: true }`
  - routes to `/estimate/customer`.

### 4.6 Continue (standard booking)
- **FR-13** `handleContinueToScheduling()` writes the full `services` payload **and clears** `emergency`/`commercial`/`skipPayment`, then routes to `/estimate/customer`.

---

## 5. Checkout Handoff Contract

State is passed only via `localStorage["estimateData"]` (JSON). Relevant keys this page writes:

```jsonc
{
  "services": {                 // empty object for emergency/commercial
    "selectedServices": [ "carpet-cleaning", ... ],
    "serviceQuantities": { ... },
    "variantQuantities": { ... },
    "carpetSelection": { ... },
    "carpetOccupancy": { ... },
    "rugSelection": { ... },
    "bundleUnits": { ... },
    "serviceFrequency": { ... },
    "totalPrice": 0
  },
  "emergency": { "damageType": "Water" | "Fire" | "Mold" | "Storm" }, // emergency only
  "commercial": true,                                                  // commercial only
  "skipPayment": true                                                  // emergency/commercial only
}
```

**Invariant:** the three flow markers are mutually exclusive — entering any one
flow must clear the others (and a normal booking clears all). This prevents
stale flags from showing the wrong banner or carrying a stale cart.

### No-payment flow (downstream contract on `skipPayment`)
- `/estimate/customer` collects contact + scheduling, then on continue **skips the payment page**, writes `bookingConfirmation`, and routes straight to `/estimate/confirmation`.
- `/estimate/customer`: **Order Summary panel hidden** and the form widens to full width when `emergency || commercial`.
- `/estimate/confirmation`: the **estimate/pricing block is hidden** when `emergency || commercial`; an Emergency or Commercial banner is shown instead.

---

## 6. Non-Functional / UX

- **Responsive:** primary breakpoint is `lg` (1024px). Below `lg` → single-column + mobile toggle/sheets; navbar availability card & commercial link fall back into the cards column. Header tuned to avoid the title collapsing at ~1024px.
- **Accessibility:** selectable cards are real `<button>`s with `aria-pressed`; tel links are real anchors.
- **No network calls** on this page; all persistence is `localStorage`.
- **Brand tokens:** navy `#152644`, cyan `#03D9E5`, emergency red.

---

## 7. Open Questions / TODO (for handoff)

1. **Lead submission backend** — emergency & commercial currently only persist to `localStorage` and rely on the checkout pages; there is no API/CRM submission. Define the endpoint + payload.
2. **`localStorage`-only handoff** — no server session; data is lost across devices and is client-trust-only. Confirm acceptable or move to server state.
3. **Pricing source of truth** — catalog prices are hardcoded in `@/lib/*`. Confirm whether these should come from a backend/CMS.
4. **Frequency discount values** — verify −20% (6-month) / −10% (annual) are the intended business rules.
5. **Emergency/commercial scheduling** — these reuse the standard customer scheduling UI; confirm whether emergency should bypass scheduling entirely (dispatch instead).
6. **Mobile dollhouse view** still uses the pills + sheet pattern (not the newer card treatment) — confirm intended.
7. **Analytics** — no event tracking is wired on selection / emergency / commercial CTAs.

---

## 8. Out of Scope (handled elsewhere)
- Payment capture and order confirmation rendering (`/estimate/payment`, `/estimate/confirmation`).
- Customer contact/scheduling form (`/estimate/customer`).
- The alternate experimental layout (`/services3`).
