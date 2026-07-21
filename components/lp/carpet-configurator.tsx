"use client";
import { useState, type ReactNode } from "react";
import { Sparkles, Check, Info } from "lucide-react";
import { formatPrice } from "@/lib/format";
import {
  CARPET_FURNITURE_FEE_PER_AREA,
  s6VacantDiscount,
  type CarpetPricingModel,
  type CarpetAddOn,
} from "@/lib/carpet";

/* ============================================================
   Shared services6 carpet product module ("book your cleaning" card).

   Extracted verbatim from the homepage's renderCarpetHero so the book page
   (app/page.tsx) and the Madison landing pages render the SAME component
   instead of two look-alikes. It is presentational/controlled: the caller
   owns the CarpetSel state and passes the footer (its own CTA), because the
   book page adds/removes the service inline while the landing pages navigate
   to checkout.

   Markup is styled by the `.svc6 .hero / .price-card / .opt-row / …` rules in
   app/voda-design.css, so this component must render inside a `.svc6` ancestor.
   ============================================================ */

// services6 carpet pricing (mirrors /services4): the customer starts at the
// base steam clean and ticks à-la-carte upgrades — no Bronze/Silver/Gold tiers.
// The base is always quoted furnished (moveFurniture stays true); `vacant`
// applies a flat per-booking discount instead of a per-room fee.
export type CarpetSel = { areas: number; addOnIds: string[]; moveFurniture?: boolean; vacant?: boolean };

// The two add-ons offered on the carpet card, in the customer's language. Each
// maps to the underlying priced add-ons in the carpet model.
export const CARPET_ADDONS: { id: string; name: string; addOnIds: string[]; detail: string }[] = [
  {
    id: "stain-removal",
    name: "Stain removal",
    addOnIds: ["s6-stain-removal"],
    detail: "Stain Protection + Brush Pro + HEPA Pre-Vacuum",
  },
  {
    id: "pet-odor",
    name: "Pet odor removal",
    addOnIds: ["s6-pet-odor-control"],
    detail: "Filtration Line Removal + Pet Odor Removal",
  },
];

// Per-area price of one add-on (sqft add-ons scale by room size; area add-ons
// are a flat per-room amount).
export const carpetAddOnPricePerArea = (model: CarpetPricingModel, a: CarpetAddOn): number =>
  a.unit === "sqft" ? a.price * model.sqftPerArea : a.price;

export const carpetAddOnActive = (sel: CarpetSel, addOnIds: string[]): boolean =>
  addOnIds.every((id) => sel.addOnIds.includes(id));

// Per-room price of a card add-on: the sum of the model add-ons behind it.
export const carpetAddOnsPricePerArea = (model: CarpetPricingModel, addOnIds: string[]): number =>
  addOnIds.reduce((sum, id) => {
    const a = model.addOns.find((x) => x.id === id);
    return a ? sum + carpetAddOnPricePerArea(model, a) : sum;
  }, 0);

// Per-area price = base steam clean + every selected add-on.
export const carpetPricePerArea = (model: CarpetPricingModel, addOnIds: string[]): number =>
  model.ratePerSqft * model.sqftPerArea +
  model.addOns
    .filter((a) => addOnIds.includes(a.id))
    .reduce((sum, a) => sum + carpetAddOnPricePerArea(model, a), 0);

// Per-room price. The base clean is quoted for a vacant room; "move furniture"
// (furnished) adds the per-room surcharge back on.
export const carpetPricePerRoom = (model: CarpetPricingModel, sel: CarpetSel): number =>
  carpetPricePerArea(model, sel.addOnIds) -
  (sel.moveFurniture ? 0 : CARPET_FURNITURE_FEE_PER_AREA);

// Carpet total = per-room price × rooms, less the flat vacant-room discount.
export const carpetTotal = (model: CarpetPricingModel, sel: CarpetSel): number =>
  sel.areas * carpetPricePerRoom(model, sel) - s6VacantDiscount(sel);

export type CarpetConfiguratorProps = {
  model: CarpetPricingModel;
  name: string;
  description: string;
  sel: CarpetSel;
  onChange: (next: CarpetSel) => void;
  /** The two ticks below the stepper (defaults to CARPET_ADDONS). */
  addOns?: { id: string; name: string; addOnIds: string[]; detail: string }[];
  /** "Most booked" pill — shown on the book page, hidden on the landing pages. */
  showMostBooked?: boolean;
  /** Optional note under the room stepper (e.g. the landing pages' sq-ft line). */
  roomsNote?: ReactNode;
  /** Minimum rooms the stepper allows (book page = 1). */
  minRooms?: number;
  /** The CTA area at the foot of the card. The book page passes its add/remove
   *  block; the landing pages pass a "See available times" button (or nothing
   *  on mobile, where the sticky cart bar commits). */
  footer?: ReactNode;
};

export function CarpetConfigurator({
  model,
  name,
  description,
  sel,
  onChange,
  addOns = CARPET_ADDONS,
  showMostBooked = false,
  roomsNote,
  minRooms = 1,
  footer,
}: CarpetConfiguratorProps) {
  const [openAddOnDetail, setOpenAddOnDetail] = useState<string | null>(null);

  const total = carpetTotal(model, sel);
  const baseRate = carpetPricePerArea(model, []);
  const setAreas = (n: number) => onChange({ ...sel, areas: Math.max(minRooms, n) });
  const roomWord = sel.areas === 1 ? "room" : "rooms";

  const vacant = !!sel.vacant;
  const vacantDiscount = s6VacantDiscount(sel);
  const availableVacantDiscount = s6VacantDiscount({ ...sel, vacant: true });
  const toggleVacant = () => onChange({ ...sel, vacant: !vacant });
  const hasExtras = sel.addOnIds.length > 0 || vacantDiscount > 0;

  return (
    <section className="hero">
      <div className="hero-band">
        {showMostBooked && (
          <div className="badge-row">
            <span className="badge-most">
              <Sparkles className="h-3 w-3" strokeWidth={2.5} /> Most booked
            </span>
          </div>
        )}
        <h2 className="hero-title">{name}</h2>
        <p className="hero-desc">{description}</p>
      </div>

      {/* Pricing summary: room stepper on one side, live total + per-room
          rate on the other. Row on desktop, stacked with a divider on mobile. */}
      <div className="price-eq-wrap">
        <div className="price-card">
          <div className="pc-rooms">
            <span className="pc-label">How many rooms?</span>
            <div className="stepper">
              <button
                type="button"
                onClick={() => setAreas(sel.areas - 1)}
                disabled={sel.areas <= minRooms}
                aria-label="Fewer rooms"
              >
                –
              </button>
              <span className="val">
                {sel.areas} {roomWord}
              </span>
              <button type="button" onClick={() => setAreas(sel.areas + 1)} aria-label="More rooms">
                +
              </button>
            </div>
            {roomsNote && <span className="pc-rooms-note">{roomsNote}</span>}
          </div>
          <div className="pc-summary">
            <span className="pc-total">{formatPrice(total)}</span>
            <span className="pc-rate">
              {sel.areas} × <b>{formatPrice(baseRate)}/room</b>
              {hasExtras && <span className="pc-extras"> + extras</span>}
            </span>
          </div>
        </div>
      </div>

      <div className="hero-body">
        {/* Vacant rooms — no furniture to move, so a flat discount applies
            (2+ rooms only). */}
        <button
          type="button"
          className={`opt-row${vacant ? " on" : ""}`}
          aria-pressed={vacant}
          onClick={toggleVacant}
        >
          <span className="opt-box">
            {vacant && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
          <span className="opt-main">
            <span className="t">My rooms are vacant</span>
            <span className="s">Get a discount if there's no furniture to move</span>
          </span>
          {availableVacantDiscount > 0 ? (
            <span className="opt-price disc">−{formatPrice(availableVacantDiscount)}</span>
          ) : (
            vacant && <span className="opt-price note">2+ rooms</span>
          )}
        </button>

        {/* Add-ons — the customer ticks a need; we price it into the total. */}
        <div className="upgrades">
          {addOns.map((addOn) => {
            const active = carpetAddOnActive(sel, addOn.addOnIds);
            const perRoom = carpetAddOnsPricePerArea(model, addOn.addOnIds);
            const detailOpen = openAddOnDetail === addOn.id;
            return (
              <div key={addOn.id} className={`opt-wrap${detailOpen ? " det-open" : ""}`}>
                <button
                  type="button"
                  className={`opt-row${active ? " on" : ""}`}
                  aria-pressed={active}
                  onClick={() =>
                    onChange({
                      ...sel,
                      addOnIds: active
                        ? sel.addOnIds.filter((id) => !addOn.addOnIds.includes(id))
                        : [
                            ...sel.addOnIds,
                            ...addOn.addOnIds.filter((id) => !sel.addOnIds.includes(id)),
                          ],
                    })
                  }
                >
                  <span className="opt-box">
                    {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="opt-main">
                    <span className="t">
                      Add {addOn.name}
                      <span
                        role="button"
                        tabIndex={0}
                        className="opt-info"
                        aria-label={`What is ${addOn.name}?`}
                        aria-expanded={detailOpen}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenAddOnDetail(detailOpen ? null : addOn.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenAddOnDetail(detailOpen ? null : addOn.id);
                          }
                        }}
                      >
                        <Info className="h-[15px] w-[15px]" strokeWidth={2.25} />
                      </span>
                    </span>
                  </span>
                  <span className="opt-price">
                    +{formatPrice(perRoom)}
                    <span className="per">/room</span>
                  </span>
                </button>
                {detailOpen && <p className="opt-detail">{addOn.detail}</p>}
              </div>
            );
          })}
        </div>

        {footer}
      </div>
    </section>
  );
}
