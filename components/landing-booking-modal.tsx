"use client";
// Self-contained booking popup rendered directly on /landing. Configures a
// single service and, on "Continue to checkout", writes the same estimateData
// shape the checkout reads (via resolveServiceLine) plus the promo marker, then
// routes to the checkout. Pricing mirrors /services4 (à-la-carte carpet, and
// defaults chosen so the quote clears the service minimum) and uses the same lib
// helpers the checkout uses, so the quote carries through unchanged.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FrequencyPicker } from "@/components/frequency-picker";
import { formatPrice } from "@/lib/format";
import { LANDING_PROMO_CODE, LANDING_PROMO_PCT } from "@/lib/promo";
import {
  type CatalogService,
  frequencyMultiplier,
  type ServiceFrequency,
} from "@/lib/services-catalog";
import {
  type CarpetPricingModel,
  type CarpetSelection,
  computeCarpetTotal,
  carpetAddOnPricePerArea,
  CARPET_FURNITURE_FEE_PER_AREA,
} from "@/lib/carpet";
import {
  type RugPricingModel,
  type RugSelection,
  computeRugTotal,
  defaultRugSelection,
  totalRugCount,
  RUG_MAX_PER_SIZE,
} from "@/lib/rug";

const LABEL = "text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500";

// The visit minimum. Configurable services open at a quantity that clears it —
// mirrors /services4, where a fresh card already meets the $165 floor.
const SERVICE_MINIMUM = 165;

// Carpet add-ons grouped into two optional upgrade packages (mirrors /services4).
const CARPET_PACKAGES: { id: string; name: string; addOnIds: string[] }[] = [
  { id: "enhanced", name: "Add Stain Protection + Brush Pro + HEPA Pre-Vacuum", addOnIds: ["stain-protection", "brush-pro", "hepa-vacuum"] },
  { id: "restoration", name: "Add Filtration Line Removal + Pet Odor Removal", addOnIds: ["filtration-lines", "pet-odor"] },
];
const carpetPackagePrice = (model: CarpetPricingModel, ids: string[]) =>
  ids.reduce((sum, id) => sum + carpetAddOnPricePerArea(model, id), 0);
const carpetPackageActive = (addOnIds: string[], ids: string[]) =>
  ids.every((id) => addOnIds.includes(id));

// Rug bookings open at 2 large rugs so the default clears the $165 minimum
// (mirrors /services4). Falls back to the shared default if there's no large size.
const rugMeetMinimum = (model: RugPricingModel): RugSelection =>
  model.sizes.some((s) => s.id === "l")
    ? { quantities: { l: 2 }, levelId: model.defaultLevelId }
    : defaultRugSelection(model);

// Smallest whole quantity of a simple per-unit service that clears the minimum.
const simpleMeetMinimum = (service: CatalogService): number =>
  Math.max(
    service.defaultQuantity,
    service.unitPrice > 0 ? Math.ceil(SERVICE_MINIMUM / service.unitPrice) : 1,
  );

export function LandingBookingModal({
  service,
  onClose,
}: {
  service: CatalogService;
  onClose: () => void;
}) {
  const router = useRouter();
  const isCarpet = !!service.carpetModel;
  const isRug = !!service.rugModel;
  const isVariants = !!service.variants;
  const isSimple = !isCarpet && !isRug && !isVariants;

  // One piece of state per config type; only the relevant one is used. Defaults
  // open at a quantity that clears the service minimum.
  const [areas, setAreas] = useState(
    isCarpet ? service.carpetModel!.defaultAreas : isSimple ? simpleMeetMinimum(service) : 1,
  );
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [moveFurniture, setMoveFurniture] = useState(false);
  const [rugSel, setRugSel] = useState<RugSelection>(() =>
    service.rugModel ? rugMeetMinimum(service.rugModel) : { quantities: {}, levelId: "" },
  );
  const [variantQ, setVariantQ] = useState<Record<string, number>>(() => {
    const q: Record<string, number> = {};
    service.variants?.forEach((v) => (q[v.id] = v.defaultQuantity));
    return q;
  });
  const [freq, setFreq] = useState<ServiceFrequency>("none");

  // Base (pre-promo) subtotal, priced exactly like the checkout does.
  const carpetSel: CarpetSelection = { areas, levelId: "", addOnIds, moveFurniture };
  const base = isCarpet
    ? computeCarpetTotal(service.carpetModel!, carpetSel)
    : isRug
    ? computeRugTotal(service.rugModel!, rugSel)
    : isVariants
    ? service.variants!.reduce((s, v) => s + v.unitPrice * (variantQ[v.id] ?? 0), 0)
    : service.unitPrice * areas;

  const afterFreq = base * frequencyMultiplier(freq);
  const discounted = Math.round(afterFreq * (1 - LANDING_PROMO_PCT / 100));

  const continueToCheckout = () => {
    const stored = JSON.parse(localStorage.getItem("estimateData") || "{}");
    const services = {
      selectedServices: [service.id],
      serviceQuantities: isSimple ? { [service.id]: areas } : {},
      variantQuantities: isVariants ? { [service.id]: variantQ } : {},
      carpetSelection: isCarpet ? { [service.id]: carpetSel } : {},
      carpetOccupancy: {},
      rugSelection: isRug ? { [service.id]: rugSel } : {},
      bundleUnits: {},
      serviceFrequency: { [service.id]: freq },
      totalPrice: Math.round(afterFreq),
    };
    localStorage.setItem(
      "estimateData",
      JSON.stringify({
        ...stored,
        services,
        promoCode: LANDING_PROMO_CODE,
        emergency: undefined,
        commercial: undefined,
        noService: undefined,
        skipPayment: undefined,
      }),
    );
    router.push("/estimate/customer");
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-[#14253E]/55" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-6 pt-5 pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-[#152644] leading-tight">{service.name}</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5">
                {service.unitLabel}
              </span>
            </div>
            {service.description && (
              <p className="mt-1.5 text-sm text-gray-600 leading-snug">{service.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Config body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isCarpet && service.carpetModel && (
            <div className="space-y-5">
              {/* Move furniture */}
              <button
                type="button"
                onClick={() => setMoveFurniture((v) => !v)}
                className={`w-full text-left flex items-start gap-3 p-3 border-2 transition-colors ${
                  moveFurniture ? "border-[#03D9E5] bg-[#03D9E5]/5" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <CheckBox on={moveFurniture} />
                <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-[#152644]">Move light furniture during cleaning</span>
                  <span className="text-sm font-bold text-[#152644] tabular-nums whitespace-nowrap">
                    +$
                    {CARPET_FURNITURE_FEE_PER_AREA % 1 === 0
                      ? CARPET_FURNITURE_FEE_PER_AREA
                      : CARPET_FURNITURE_FEE_PER_AREA.toFixed(2)}
                    /room
                  </span>
                </div>
              </button>

              {/* Upgrades */}
              <div>
                <span className={LABEL}>
                  Upgrades <span className="text-gray-400 normal-case tracking-normal">(optional)</span>
                </span>
                <div className="mt-3 space-y-2">
                  {CARPET_PACKAGES.map((pkg) => {
                    const active = carpetPackageActive(addOnIds, pkg.addOnIds);
                    const each = carpetPackagePrice(service.carpetModel!, pkg.addOnIds);
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() =>
                          setAddOnIds((prev) =>
                            active
                              ? prev.filter((id) => !pkg.addOnIds.includes(id))
                              : [...prev, ...pkg.addOnIds.filter((id) => !prev.includes(id))],
                          )
                        }
                        className={`w-full text-left flex items-start gap-3 p-3 border-2 transition-colors ${
                          active ? "border-[#03D9E5] bg-[#03D9E5]/5" : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <CheckBox on={active} />
                        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-[#152644]">{pkg.name}</span>
                          <span className="text-sm font-bold text-[#152644] tabular-nums whitespace-nowrap">
                            +{formatPrice(each)}/room
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {service.recurrenceOptions && (
                <FrequencyPicker value={freq} onChange={setFreq} options={service.recurrenceOptions} />
              )}

              {/* Base clean + rooms */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500">
                  Base clean × {areas} {areas === 1 ? "room" : "rooms"}
                </span>
                <Stepper label="Rooms" value={areas} min={1} onChange={setAreas} />
              </div>
            </div>
          )}

          {isRug && service.rugModel && (
            <div className="space-y-5">
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className={LABEL}>How many rugs?</span>
                  <span className="text-[11px] text-gray-500 tabular-nums">
                    {totalRugCount(rugSel)} {totalRugCount(rugSel) === 1 ? "rug" : "rugs"} total
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {service.rugModel.sizes.map((size) => {
                    const qty = rugSel.quantities[size.id] ?? 0;
                    const setQty = (n: number) =>
                      setRugSel({
                        ...rugSel,
                        quantities: { ...rugSel.quantities, [size.id]: Math.max(0, Math.min(RUG_MAX_PER_SIZE, n)) },
                      });
                    return (
                      <div
                        key={size.id}
                        className={`flex flex-col rounded-xl px-3 pt-4 pb-3 border-2 transition-colors ${
                          qty > 0 ? "border-[#152644] bg-[#152644]/[0.03]" : "border-gray-200"
                        }`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <span className="text-base font-bold text-[#152644] leading-none">{size.label}</span>
                          <span className="mt-1.5 text-[11px] text-gray-500 tabular-nums">{size.description}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 items-stretch rounded-lg bg-gray-100 ring-1 ring-inset ring-gray-200/70 overflow-hidden">
                          <button
                            type="button"
                            aria-label={`Decrease ${size.label}`}
                            onClick={() => qty > 0 && setQty(qty - 1)}
                            className="h-9 flex items-center justify-center text-gray-500 hover:text-[#152644] hover:bg-white"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="h-9 flex items-center justify-center border-x border-gray-200/80 text-sm font-bold text-[#152644] tabular-nums bg-white/60">
                            {qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase ${size.label}`}
                            onClick={() => qty < RUG_MAX_PER_SIZE && setQty(qty + 1)}
                            className="h-9 flex items-center justify-center text-gray-500 hover:text-[#152644] hover:bg-white"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {service.recurrenceOptions && (
                <FrequencyPicker value={freq} onChange={setFreq} options={service.recurrenceOptions} />
              )}
            </div>
          )}

          {isVariants && service.variants && (
            <div className="space-y-2">
              {service.variants.map((variant) => {
                const vqty = variantQ[variant.id] ?? 0;
                const set = (n: number) => setVariantQ({ ...variantQ, [variant.id]: Math.max(0, Math.min(20, n)) });
                return (
                  <div
                    key={variant.id}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 border transition-colors ${
                      vqty > 0 ? "border-[#03D9E5] bg-[#03D9E5]/5" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#152644] truncate">{variant.name}</div>
                      <div className="text-[11px] text-gray-500 tabular-nums">{formatPrice(variant.unitPrice)} each</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled={vqty <= 0} onClick={() => set(vqty - 1)}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-7 text-center text-sm font-semibold tabular-nums">{vqty}</span>
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => set(vqty + 1)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isSimple && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <span className={LABEL}>
                  {service.unit === "room" ? "Rooms" : service.unit === "vent" ? "Vents" : "Quantity"}
                </span>
                <Stepper value={areas} min={1} onChange={setAreas} />
              </div>
              {service.recurrenceOptions && (
                <FrequencyPicker value={freq} onChange={setFreq} options={service.recurrenceOptions} />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
          <div className="leading-tight">
            <span className="block text-[11px] font-semibold text-[#03D9E5]">{LANDING_PROMO_PCT}% off applied</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#152644] tabular-nums">{formatPrice(discounted)}</span>
              {discounted < Math.round(afterFreq) && (
                <span className="text-sm font-medium text-gray-400 line-through tabular-nums">
                  {formatPrice(Math.round(afterFreq))}
                </span>
              )}
            </div>
          </div>
          <Button
            type="button"
            onClick={continueToCheckout}
            disabled={base <= 0}
            className="bg-[#152644] hover:bg-[#152644]/90 text-white font-semibold rounded-lg h-11 px-6"
          >
            Continue to checkout
          </Button>
        </div>
      </div>
    </div>
  );
}

function CheckBox({ on }: { on: boolean }) {
  return (
    <div
      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
        on ? "bg-[#152644] border-[#152644]" : "border-gray-300 bg-white"
      }`}
    >
      {on && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
    </div>
  );
}

function Stepper({
  value,
  min,
  onChange,
  label,
}: {
  value: number;
  min: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  return (
    <div className="flex items-stretch border border-gray-200">
      {label && (
        <div className="hidden sm:flex items-center px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-50">
          {label}
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="px-3 h-9 text-gray-600 hover:bg-gray-50 hover:text-[#152644] border-l border-gray-200"
        aria-label="Decrease"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <Input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number.parseInt(e.target.value) || min))}
        className="w-12 h-9 px-0 text-center text-sm font-bold text-[#152644] bg-white border-x border-y-0 border-gray-200 rounded-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="px-3 h-9 text-gray-600 hover:bg-gray-50 hover:text-[#152644]"
        aria-label="Increase"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
