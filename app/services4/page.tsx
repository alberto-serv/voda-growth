"use client";
import { Footer } from "@/components/footer";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Wind,
  Sparkles,
  Grid3x3,
  Sofa,
  SprayCan as Spray,
  Plus,
  Minus,
  Fan,
  PhoneCall,
  TreePine,
  Layers,
  Home,
  List,
  X,
  RefreshCw,
  CalendarCheck,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { business } from "@/lib/business";
import { Check } from "lucide-react";
import {
  carpetModel,
  CARPET_FURNITURE_FEE_PER_AREA,
  type CarpetAddOn,
  type CarpetPricingModel,
} from "@/lib/carpet";
import {
  rugModel,
  computeRugTotal,
  getRugLevelById,
  totalRugCount,
  defaultRugSelection,
  RUG_MAX_PER_SIZE,
  type RugPricingModel,
  type RugSelection,
} from "@/lib/rug";
import {
  frequencyMultiplier,
  FREQUENCY_DISCOUNT_PCT,
  isBundleService,
  getBundleTotal,
  getBundleRecurringTotal,
  type BundleComponent,
  type ServiceFrequency,
} from "@/lib/services-catalog";
import { FrequencyPicker } from "@/components/frequency-picker";
import { Drawer } from "vaul";

interface ServiceVariant {
  id: string;
  name: string;
  unitPrice: number;
  defaultQuantity: number;
}

interface Service {
  id: string;
  name: string;
  description: string;
  disclaimer?: string;
  unitPrice: number;
  /** Optional flat service fee added on top of unitPrice × quantity (e.g. Vent Cleaning). */
  baseFee?: number;
  defaultQuantity: number;
  unit: string;
  unitLabel: string;
  icon: any;
  allowCustomQuantity: boolean;
  position?: { x: number; y: number };
  labelPosition?: "above" | "below";
  variants?: ServiceVariant[];
  /** "chips" = on/off toggles (default); "steppers" = collapsed-by-default list with per-type unit counts */
  variantMode?: "chips" | "steppers";
  /** When true, only one variant can be active at a time (e.g. dryer-vent side vs roof exit). */
  exclusiveVariants?: boolean;
  carpetModel?: CarpetPricingModel;
  rugModel?: RugPricingModel;
  category: "floor-care" | "cleaning";
  recurrenceOptions?: ServiceFrequency[];
  // Bundle — a set of independently-priced services sold together at a discount.
  components?: BundleComponent[];
  // Percentage knocked off every bundled item, so the savings flow per line.
  bundleDiscountPercent?: number;
}

const serviceCategories = [
  { id: "floor-care" as const, label: "Floor Care" },
  { id: "cleaning" as const, label: "Cleaning" },
]

const availableServices: Service[] = [
  // Floor Care
  {
    id: "carpet-cleaning",
    name: "Eco-Friendly Carpet Cleaning",
    description:
      "Deep steam cleaning with non-toxic solutions to remove dirt, stains, and allergens, including pre-treatment of heavy traffic areas—fast drying, safe for homes and pets.",
    disclaimer: `1 room = ${carpetModel.sqftPerArea} sq ft.`,
    unitPrice: 67.5,
    defaultQuantity: carpetModel.defaultAreas,
    unit: "room",
    unitLabel: "per room",
    icon: Sparkles,
    allowCustomQuantity: true,
    position: { x: 530, y: 550 },
    category: "floor-care",
    carpetModel,
    recurrenceOptions: ["none", "6-month", "annual"],
  },
  {
    id: "routine-floor-care",
    name: "Routine Floor Care",
    description:
      "Regular vacuuming and mopping to maintain your floors in top condition between deep cleanings.",
    unitPrice: 75.0,
    // Start at 3 rooms ($225) so the default clears the $165 minimum.
    defaultQuantity: 3,
    unit: "room",
    unitLabel: "per room",
    icon: Home,
    allowCustomQuantity: true,
    position: { x: 340, y: 740 },
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
    icon: Layers,
    allowCustomQuantity: false,
    position: { x: 560, y: 758 },
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
    // Start at 2 rooms ($255) so the default clears the $165 minimum.
    defaultQuantity: 2,
    unit: "room",
    unitLabel: "per room",
    icon: TreePine,
    allowCustomQuantity: true,
    position: { x: 660, y: 780 },
    labelPosition: "above",
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
    icon: Grid3x3,
    allowCustomQuantity: true,
    position: { x: 260, y: 540 },
    category: "floor-care",
  },
  // Cleaning
  {
    id: "dryer-vent-cleaning",
    name: "Dryer Vent Cleaning",
    description:
      "Removes dust, allergens, and lint using negative air systems to improve airflow and air quality.",
    disclaimer: "Min. service applies.",
    unitPrice: 149.0,
    defaultQuantity: 1,
    unit: "vent",
    unitLabel: "per vent",
    icon: Fan,
    allowCustomQuantity: false,
    position: { x: 340, y: 920 },
    labelPosition: "above",
    category: "cleaning",
    exclusiveVariants: true,
    variants: [
      { id: "first-floor", name: "1st Floor", unitPrice: 149, defaultQuantity: 1 },
      { id: "second-floor", name: "2nd Floor", unitPrice: 199, defaultQuantity: 0 },
    ],
  },
  {
    id: "air-duct-cleaning",
    name: "Air Duct Cleaning",
    description:
      "Removes dust, allergens, and lint using negative air systems to improve airflow and air quality.",
    disclaimer: "Min. service applies.",
    unitPrice: 50.0,
    defaultQuantity: 12,
    unit: "vent",
    unitLabel: "per vent",
    icon: Wind,
    allowCustomQuantity: true,
    position: { x: 660, y: 840 },
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
    icon: Sofa,
    allowCustomQuantity: false,
    position: { x: 425, y: 705 },
    category: "cleaning",
    variantMode: "steppers",
    variants: [
      { id: "sofa", name: "Sofa", unitPrice: 185, defaultQuantity: 1 },
      { id: "loveseat", name: "Loveseat", unitPrice: 120, defaultQuantity: 0 },
      { id: "sectional", name: "Sectional", unitPrice: 375, defaultQuantity: 0 },
      { id: "chair", name: "Chair", unitPrice: 30, defaultQuantity: 0 },
      { id: "recliner", name: "Recliner", unitPrice: 95, defaultQuantity: 0 },
      { id: "ottoman", name: "Ottoman", unitPrice: 45, defaultQuantity: 0 },
      { id: "dining-chair", name: "Dining Chair", unitPrice: 25, defaultQuantity: 0 },
      { id: "mattress", name: "Mattress", unitPrice: 150, defaultQuantity: 0 },
    ],
  },
  {
    id: "odor-spot-control",
    name: "Odor & Spot Treatment",
    description:
      "Targets tough stains and odors at the source across carpets, upholstery, and more.",
    disclaimer: "Results may vary by severity.",
    unitPrice: 200.0,
    defaultQuantity: 1,
    unit: "room",
    unitLabel: "per room",
    icon: Spray,
    allowCustomQuantity: true,
    position: { x: 408, y: 215 },
    category: "cleaning",
  },
  // Bundle — combines several services at a single discounted price. No house
  // position (it isn't tied to one room); it appears in the right-hand list.
  {
    id: "healthy-home-bundle",
    name: "Healthy Home Bundle",
    description:
      "Our complete refresh — carpet cleaning, vent cleaning, and an upholstery refresh priced together so you save versus booking each one separately.",
    unitPrice: 0,
    defaultQuantity: 1,
    unit: "bundle",
    unitLabel: "bundle",
    icon: Sparkles,
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
];

const SERVICE_MINIMUM = 165;

// services4 starts rug bookings at 2 large rugs ($210) so the default clears the
// $165 minimum. Overrides the shared lib default (1 medium rug) locally — the
// shared `defaultRugSelection` is left untouched so other routes are unaffected.
const services4RugDefault = (model: RugPricingModel): RugSelection => {
  const hasLarge = model.sizes.some((s) => s.id === "l");
  return hasLarge
    ? { quantities: { l: 2 }, levelId: model.defaultLevelId }
    : defaultRugSelection(model);
};

// "Month Day" label for the next business day (skips weekends). Computed on the
// client so it reflects the visitor's current date, not the build date.
function nextBusinessDayLabel(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

// Mobile House view: tappable label "pills" placed directly in their rooms.
// Coordinates are the pill CENTER as a percentage of the dollhouse image
// (house-whitewalls.png, 766×1024) — hand-tuned so none overlap. `short` is the
// compact label shown on the pill. Tuned from the design handoff; re-tune if the
// illustration changes.
const MOBILE_PILLS: Record<string, { x: number; y: number; short: string }> = {
  "odor-spot-control": { x: 49, y: 18, short: "Odor & Spot" },
  "tile-grout-stone": { x: 31, y: 54, short: "Tile & Grout" },
  "carpet-cleaning": { x: 71, y: 54, short: "Carpet" },
  rugs: { x: 72, y: 63, short: "Area Rug" },
  "upholstery-cleaning": { x: 55, y: 74, short: "Upholstery" },
  "routine-floor-care": { x: 24, y: 77, short: "Floor Care" },
  "hardwood-detailing": { x: 80, y: 77, short: "Hardwood" },
  "air-duct-cleaning": { x: 73, y: 84, short: "Air Duct" },
  "dryer-vent-cleaning": { x: 37, y: 91, short: "Dryer Vent" },
};
// Area Rug's pill floats above the actual rug, so it gets a connector line down
// to a glowing locator dot at this precise spot (shown only while unselected).
const RUG_PIN = { x: 77, y: 73 };

// services4 carpet pricing: the customer starts at the base steam clean and
// toggles individual add-ons — no preset Bronze/Silver/Gold tiers and no
// furnished/vacant choice. Selection carries the chosen add-on ids.
type Services4CarpetSel = { areas: number; addOnIds: string[]; moveFurniture?: boolean };

// Carpet add-ons are grouped into two upgrade packages so the card stays simple
// — the customer starts at the base clean and ticks at most two boxes.
const CARPET_PACKAGES: {
  id: string;
  name: string;
  addOnIds: string[];
}[] = [
  {
    id: "enhanced",
    name: "Add Stain Protection + Brush Pro + HEPA Pre-Vacuum",
    addOnIds: ["stain-protection", "brush-pro", "hepa-vacuum"],
  },
  {
    id: "restoration",
    name: "Add Filtration Line Removal + Pet Odor Removal",
    addOnIds: ["filtration-lines", "pet-odor"],
  },
];

// Per-area price of one add-on (sqft add-ons scale by room size; area add-ons
// are a flat per-room amount).
const carpetAddOnPricePerArea = (model: CarpetPricingModel, a: CarpetAddOn): number =>
  a.unit === "sqft" ? a.price * model.sqftPerArea : a.price;

// Per-area price of a whole package (sum of its add-ons).
const carpetPackagePricePerArea = (model: CarpetPricingModel, addOnIds: string[]): number =>
  addOnIds.reduce((sum, id) => {
    const a = model.addOns.find((x) => x.id === id);
    return a ? sum + carpetAddOnPricePerArea(model, a) : sum;
  }, 0);

const carpetPackageActive = (sel: Services4CarpetSel, addOnIds: string[]): boolean =>
  addOnIds.every((id) => sel.addOnIds.includes(id));

// Per-area price = base steam clean + every selected add-on.
const carpetPricePerArea = (model: CarpetPricingModel, addOnIds: string[]): number =>
  model.ratePerSqft * model.sqftPerArea +
  model.addOns
    .filter((a) => addOnIds.includes(a.id))
    .reduce((sum, a) => sum + carpetAddOnPricePerArea(model, a), 0);

// Base clean is priced for a vacant room; "move furniture" (furnished) adds the
// per-room surcharge back, matching /services2's furnished-vs-vacant spread.
const carpetTotal = (model: CarpetPricingModel, sel: Services4CarpetSel): number =>
  sel.areas *
  (carpetPricePerArea(model, sel.addOnIds) -
    (sel.moveFurniture ? 0 : CARPET_FURNITURE_FEE_PER_AREA));

// Standard numeric stepper used across every card — a bordered inline group of
// optional label · minus · value · plus, mirroring the carpet card's rooms
// stepper so all quantity controls look and behave the same.
function CardStepper({
  label,
  value,
  min = 1,
  onChange,
}: {
  label?: string;
  value: number;
  min?: number;
  onChange: (next: number) => void;
}) {
  return (
    <div
      className="inline-flex items-stretch border border-gray-200 shrink-0 w-fit"
      onClick={(e) => e.stopPropagation()}
    >
      {label && (
        <div className="hidden sm:flex items-center px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-50">
          {label}
        </div>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(Math.max(min, value - 1));
        }}
        disabled={value <= min}
        className="px-2.5 sm:px-3 h-9 text-gray-600 hover:bg-gray-50 hover:text-[#152644] border-l border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600"
        aria-label={label ? `Decrease ${label}` : "Decrease"}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <Input
        type="number"
        min={min}
        value={value}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          e.stopPropagation();
          onChange(Math.max(min, Number.parseInt(e.target.value) || min));
        }}
        className="w-10 h-9 px-0 text-center text-sm font-bold text-[#152644] bg-white border-x border-y-0 border-gray-200 rounded-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(value + 1);
        }}
        className="px-2.5 sm:px-3 h-9 text-gray-600 hover:bg-gray-50 hover:text-[#152644]"
        aria-label={label ? `Increase ${label}` : "Increase"}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function ServicesPage() {
  const router = useRouter();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceQuantities, setServiceQuantities] = useState<
    Record<string, number>
  >({});
  const [variantQuantities, setVariantQuantities] = useState<
    Record<string, Record<string, number>>
  >({});
  const [carpetSelection, setCarpetSelection] = useState<Record<string, Services4CarpetSel>>({});
  const [rugSelection, setRugSelection] = useState<Record<string, RugSelection>>({});
  // Customer-chosen quantities for unit-priced bundle components, keyed by
  // `${serviceId}:${componentId}` (e.g. how many vents in the bundle).
  const [bundleUnits, setBundleUnits] = useState<Record<string, number>>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [serviceFrequency, setServiceFrequency] = useState<Record<string, ServiceFrequency>>({});
  const [scrolled, setScrolled] = useState(false);
  // Next-business-day label for the "appointments available" line (client-only).
  const [bookDate, setBookDate] = useState("");
  useEffect(() => setBookDate(nextBusinessDayLabel()), []);
  // Mobile-only toggle between the House (pills) view and the List (cards) view.
  // Desktop always shows both panes, so this is ignored at md+.
  const [mobileView, setMobileView] = useState<"house" | "list">("list");
  // Service whose bottom-sheet configurator is open (mobile House view). null = closed.
  const [sheetServiceId, setSheetServiceId] = useState<string | null>(null);

  // Emergency & restoration.
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyDamage, setEmergencyDamage] = useState<"Water" | "Fire" | "Mold" | "Storm" | null>(null);
  // Mobile bottom sheets for the emergency and bundle cards.
  const [emergencySheetOpen, setEmergencySheetOpen] = useState(false);
  const [bundleSheetOpen, setBundleSheetOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Measure the fixed header so the mobile content offset and the sticky List/All
  // toggle sit flush against it (it shrinks on scroll, so track live changes).
  const headerRef = useRef<HTMLElement>(null);
  const [headerH, setHeaderH] = useState(56);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeaderH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Desktop uses a taller fixed header offset (80px); below lg we use the live
  // measured height so the toggle never leaves a gap above it.
  const [isLg, setIsLg] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLg(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // After a card is selected it expands; scroll it into view so it's fully
  // visible (desktop and mobile), aligning its top just below the fixed header /
  // sticky toggle and keeping its bottom clear of the sticky checkout bar.
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
  useEffect(() => {
    if (!scrollTargetId) return;
    const id = scrollTargetId;
    setScrollTargetId(null);
    // Two frames so the card's expanded layout is settled before we measure.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = document.querySelector(`[data-service-card="${id}"]`);
        if (!(el instanceof HTMLElement)) return;
        const topOffset = (isLg ? 80 : headerH + 52) + 8;
        // The fixed/sticky checkout bar overlays the bottom of the viewport.
        const bar = document.querySelector("[data-checkout-bar]");
        const barH = bar instanceof HTMLElement ? bar.offsetHeight : 0;
        const bottomLimit = window.innerHeight - barH - 8;
        const rect = el.getBoundingClientRect();
        const needsScroll = rect.top < topOffset || rect.bottom > bottomLimit;
        if (needsScroll) {
          window.scrollTo({ top: window.scrollY + rect.top - topOffset, behavior: "smooth" });
        }
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [scrollTargetId, isLg, headerH]);

  // House graphic scroll pattern (mirrors /estimate/services): when the house is
  // taller than the viewport, pin it with a computed negative sticky `top` so it
  // scrolls up with the cards and its bottom lands in step with the right column.
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [leftPanelStickyTop, setLeftPanelStickyTop] = useState(80);
  const updateStickyTop = useCallback(() => {
    if (leftPanelRef.current) {
      const panelHeight = leftPanelRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      // Stick when the bottom of the panel reaches the bottom of the viewport.
      setLeftPanelStickyTop(viewportHeight - panelHeight);
    }
  }, []);
  useEffect(() => {
    updateStickyTop();
    window.addEventListener("resize", updateStickyTop);
    return () => window.removeEventListener("resize", updateStickyTop);
  }, [updateStickyTop]);

  const getCarpetSel = (service: Service): Services4CarpetSel => {
    const stored = carpetSelection[service.id];
    if (stored) return stored;
    // Default: base clean (no add-ons) at the model's default room count.
    return { areas: service.carpetModel!.defaultAreas, addOnIds: [] };
  };

  const getRugSel = (service: Service): RugSelection => {
    const stored = rugSelection[service.id];
    if (stored) return stored;
    return services4RugDefault(service.rugModel!);
  };

  // Carpet total = (base clean + selected add-ons) per room × number of rooms.
  const carpetTotalFor = (service: Service, sel: Services4CarpetSel): number =>
    carpetTotal(service.carpetModel!, sel);

  // Customer-selected quantity for a unit-priced bundle component (falls back to
  // its configured default).
  const getBundleComponentUnits = (svc: Service, c: BundleComponent): number =>
    bundleUnits[`${svc.id}:${c.id}`] ?? c.defaultUnits ?? c.includedUnits ?? 0;

  const setBundleComponentUnits = (svcId: string, componentId: string, units: number) =>
    setBundleUnits((prev) => ({
      ...prev,
      [`${svcId}:${componentId}`]: Math.max(0, units),
    }));

  // Per-service map of {componentId: chosen units} for bundle pricing.
  const getBundleUnitsMap = (svc: Service): Record<string, number> => {
    const map: Record<string, number> = {};
    for (const c of svc.components ?? []) {
      if (c.pricing === "unit") map[c.id] = getBundleComponentUnits(svc, c);
    }
    return map;
  };

  const getServiceBasePrice = (service: Service): number => {
    if (isBundleService(service)) {
      return getBundleTotal(service, getBundleUnitsMap(service));
    }
    if (service.carpetModel) {
      return carpetTotalFor(service, getCarpetSel(service));
    }
    if (service.rugModel) {
      return computeRugTotal(service.rugModel, getRugSel(service));
    }
    if (service.variants) {
      const vqs = variantQuantities[service.id];
      return service.variants.reduce((sum, v) => {
        const qty = vqs?.[v.id] ?? v.defaultQuantity;
        return sum + v.unitPrice * qty;
      }, 0);
    }
    const quantity = serviceQuantities[service.id] || service.defaultQuantity;
    return service.unitPrice * quantity + (service.baseFee ?? 0);
  };

  // Pure tally of the current selection: `base` is the full (undiscounted)
  // price, `discounted` applies each service's subscription frequency.
  const computeTotals = () => {
    let baseTotal = 0;
    let discountedTotal = 0;
    for (const id of selectedServices) {
      const service = availableServices.find((s) => s.id === id);
      if (!service) continue;
      const base = getServiceBasePrice(service);
      const freq = serviceFrequency[id] ?? "none";
      baseTotal += base;
      discountedTotal += base * frequencyMultiplier(freq);
    }
    return { baseTotal, discountedTotal };
  };

  const calculateTotalPrice = () => {
    const { baseTotal, discountedTotal } = computeTotals();
    setBasePrice(baseTotal);
    return discountedTotal;
  };

  const handleServiceToggle = (serviceId: string) => {
    const service = availableServices.find((s) => s.id === serviceId);
    if (!service) return;

    const isCurrentlySelected = selectedServices.includes(serviceId);

    if (isCurrentlySelected) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
      const newQuantities = { ...serviceQuantities };
      delete newQuantities[serviceId];
      setServiceQuantities(newQuantities);
      if (service.variants) {
        const newVq = { ...variantQuantities };
        delete newVq[serviceId];
        setVariantQuantities(newVq);
      }
    } else {
      setSelectedServices([...selectedServices, serviceId]);
      setScrollTargetId(serviceId);
      if (service.variants) {
        const defaults: Record<string, number> = {};
        service.variants.forEach((v) => { defaults[v.id] = v.defaultQuantity; });
        setVariantQuantities({ ...variantQuantities, [serviceId]: defaults });
      } else if (service.carpetModel) {
        if (!carpetSelection[serviceId]) {
          setCarpetSelection({
            ...carpetSelection,
            [serviceId]: { areas: service.carpetModel.defaultAreas, addOnIds: [] },
          });
        }
      } else if (service.rugModel) {
        if (!rugSelection[serviceId]) {
          setRugSelection({
            ...rugSelection,
            [serviceId]: services4RugDefault(service.rugModel),
          });
        }
      } else {
        setServiceQuantities({
          ...serviceQuantities,
          [serviceId]: service.defaultQuantity,
        });
      }
      if (!serviceFrequency[serviceId]) {
        setServiceFrequency({ ...serviceFrequency, [serviceId]: "none" });
      }
    }
  };

  // Mobile House view pill tap:
  // - unselected → select it and open the bottom-sheet configurator
  // - already selected → deselect it (remove from estimate immediately, no sheet)
  // To edit a selected service's options, deselect+reselect or use the List view.
  const handlePillTap = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      handleServiceToggle(serviceId);
      return;
    }
    handleServiceToggle(serviceId);
    setSheetServiceId(serviceId);
  };

  // Mobile: add the bundle (if not already) and open its bottom sheet.
  const openBundleSheet = () => {
    if (!selectedServices.includes("healthy-home-bundle")) {
      handleServiceToggle("healthy-home-bundle");
    }
    setBundleSheetOpen(true);
  };

  // Interacting with any option inside a card (a stepper, a numeric input, a
  // variant chip) implies the customer wants the service — so add it to the
  // estimate if it isn't selected yet.
  const ensureSelected = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) return;
    setSelectedServices([...selectedServices, serviceId]);
    if (!serviceFrequency[serviceId]) {
      setServiceFrequency({ ...serviceFrequency, [serviceId]: "none" });
    }
  };

  const handleQuantityChange = (serviceId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    ensureSelected(serviceId);
    setServiceQuantities({
      ...serviceQuantities,
      [serviceId]: newQuantity,
    });
  };

  const incrementQuantity = (serviceId: string) => {
    const currentQuantity =
      serviceQuantities[serviceId] ||
      availableServices.find((s) => s.id === serviceId)?.defaultQuantity ||
      1;
    handleQuantityChange(serviceId, currentQuantity + 1);
  };

  const decrementQuantity = (serviceId: string) => {
    const currentQuantity =
      serviceQuantities[serviceId] ||
      availableServices.find((s) => s.id === serviceId)?.defaultQuantity ||
      1;
    if (currentQuantity > 1) {
      handleQuantityChange(serviceId, currentQuantity - 1);
    }
  };

  const setFrequencyFor = (serviceId: string, freq: ServiceFrequency) => {
    setServiceFrequency({ ...serviceFrequency, [serviceId]: freq });
  };

  // Set an exact unit count for one furniture type (e.g. "3 sofas"). Keeps the
  // parent service selected while any type has a count, and drops it when every
  // piece returns to zero — so the card collapses again on its own.
  const VARIANT_MAX_QTY = 20;
  const setVariantQty = (
    serviceId: string,
    variantId: string,
    qty: number,
  ) => {
    const service = availableServices.find((s) => s.id === serviceId);
    if (!service) return;
    const clamped = Math.max(0, Math.min(VARIANT_MAX_QTY, Math.floor(qty)));
    const current = variantQuantities[serviceId] ?? {};
    const next = {
      ...variantQuantities,
      [serviceId]: { ...current, [variantId]: clamped },
    };
    setVariantQuantities(next);
    const anyActive = Object.values(next[serviceId] ?? {}).some((q) => q > 0);
    if (anyActive && !selectedServices.includes(serviceId)) {
      setSelectedServices([...selectedServices, serviceId]);
      setScrollTargetId(serviceId);
      if (!serviceFrequency[serviceId]) {
        setServiceFrequency({ ...serviceFrequency, [serviceId]: "none" });
      }
    } else if (!anyActive && selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    }
  };

  // Tapping a variant chip (e.g. dryer-vent Side/Roof exit) on the card. When
  // the service isn't selected yet, the first tap selects it with only the
  // tapped option on — so the chip reflects exactly what the customer chose.
  // Once selected, taps simply toggle that option on/off.
  const handleVariantChipClick = (service: Service, variantId: string) => {
    if (!selectedServices.includes(service.id)) {
      const next: Record<string, number> = {};
      service.variants!.forEach((v) => {
        next[v.id] = 0;
      });
      next[variantId] = 1;
      setVariantQuantities({ ...variantQuantities, [service.id]: next });
      setSelectedServices([...selectedServices, service.id]);
      setScrollTargetId(service.id);
      if (!serviceFrequency[service.id]) {
        setServiceFrequency({ ...serviceFrequency, [service.id]: "none" });
      }
      return;
    }
    const variant = service.variants!.find((v) => v.id === variantId);
    const vqty = variantQuantities[service.id]?.[variantId] ?? variant?.defaultQuantity ?? 0;
    // Exclusive variants: tapping one turns off the others so only a single
    // option (e.g. side vs roof exit) can ever be active at once.
    if (service.exclusiveVariants && vqty === 0) {
      const next: Record<string, number> = {};
      service.variants!.forEach((v) => {
        next[v.id] = v.id === variantId ? 1 : 0;
      });
      setVariantQuantities({ ...variantQuantities, [service.id]: next });
      return;
    }
    setVariantQty(service.id, variantId, vqty > 0 ? 0 : 1);
  };

  // Persist the cart and move to checkout. `finalTotal` is what the customer is
  // actually charged — callers pass the minimum-floored amount.
  const proceedToScheduling = (finalTotal: number) => {
    const storedData = JSON.parse(
      localStorage.getItem("estimateData") || "{}",
    );
    const updatedData = {
      ...storedData,
      services: {
        selectedServices,
        serviceQuantities,
        variantQuantities,
        carpetSelection,
        rugSelection,
        bundleUnits,
        serviceFrequency,
        totalPrice: finalTotal,
      },
      // Normal booking — clear any emergency/commercial no-payment flags.
      emergency: undefined,
      commercial: undefined,
      noService: undefined,
      skipPayment: undefined,
    };
    localStorage.setItem("estimateData", JSON.stringify(updatedData));
    router.push("/estimate/customer");
  };

  const handleContinueToScheduling = () => {
    if (selectedServices.length === 0) return;
    const { baseTotal, discountedTotal } = computeTotals();
    setBasePrice(baseTotal);
    setTotalPrice(discountedTotal);
    // The visit minimum is waived when the cart holds a recurring subscription;
    // otherwise the inline line gate keeps the Continue button disabled until the
    // full (undiscounted) price clears the floor, so this is a belt-and-braces
    // guard rather than the primary block.
    const hasRecurring = selectedServices.some(
      (id) => (serviceFrequency[id] ?? "none") !== "none",
    );
    if (hasRecurring || baseTotal >= SERVICE_MINIMUM) {
      proceedToScheduling(discountedTotal);
    }
  };

  useEffect(() => {
    setTotalPrice(calculateTotalPrice());
  }, [selectedServices, serviceFrequency, serviceQuantities, variantQuantities, carpetSelection, rugSelection, bundleUnits]);

  // Bottom-sheet configurator body (mobile House view). Renders the SAME options
  // and writes to the SAME live state as the List cards, just without the card
  // chrome — so the two stay in sync. The sheet's header/footer are provided by
  // the Drawer below.

  // --- Emergency callback body ------------------------------------------------
  // Shared between the inline emergency card (desktop list) and the mobile
  // bottom sheet: call CTA, damage-type picker, callback form, confirmation.
  // Emergency / restoration uses a no-payment checkout: stash the damage type
  // and a skipPayment flag, then drop the visitor into the normal checkout flow
  // (which collects address, phone, and scheduling) but skips the payment step.
  const startEmergencyCheckout = (damage: "Water" | "Fire" | "Mold" | "Storm") => {
    const stored = JSON.parse(localStorage.getItem("estimateData") || "{}");
    localStorage.setItem(
      "estimateData",
      JSON.stringify({
        ...stored,
        // Emergency is standalone — start with an empty cart so no previously
        // selected services carry into the checkout. Clear any commercial flag.
        services: { selectedServices: [], totalPrice: 0 },
        emergency: { damageType: damage },
        commercial: undefined,
        noService: undefined,
        skipPayment: true,
      }),
    );
    router.push("/estimate/customer");
  };

  // Commercial inquiries follow the same no-payment checkout path as emergency.
  const startCommercialInquiry = () => {
    const stored = JSON.parse(localStorage.getItem("estimateData") || "{}");
    localStorage.setItem(
      "estimateData",
      JSON.stringify({
        ...stored,
        services: { selectedServices: [], totalPrice: 0 },
        commercial: true,
        emergency: undefined,
        noService: undefined,
        skipPayment: true,
      }),
    );
    router.push("/estimate/customer");
  };

  // Skip service selection entirely: book a visit and let the team scope the work
  // on-site. Uses the same no-payment checkout path as commercial.
  const startVisitWithoutService = () => {
    const stored = JSON.parse(localStorage.getItem("estimateData") || "{}");
    localStorage.setItem(
      "estimateData",
      JSON.stringify({
        ...stored,
        services: { selectedServices: [], totalPrice: 0 },
        noService: true,
        commercial: undefined,
        emergency: undefined,
        skipPayment: true,
      }),
    );
    router.push("/estimate/customer");
  };

  const renderEmergencyBody = () => (
    <>
      <a
        href="tel:+16083988632"
        className="flex items-center justify-center gap-2.5 w-full px-4 py-3.5 bg-red-500 hover:bg-red-600 rounded-lg text-white text-base sm:text-lg font-bold transition-colors shadow-sm"
      >
        <PhoneCall className="h-5 w-5" />
        <span>Call now · (608) 398-8632</span>
      </a>

      <p className="text-center text-sm text-gray-500 my-4">
        — or book your remediation online —
      </p>

      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
        Type of damage
      </p>
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
        {(["Water", "Fire", "Mold", "Storm"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setEmergencyDamage(type)}
            className={`py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
              emergencyDamage === type
                ? "bg-[#152644] text-white"
                : "bg-white text-[#152644] border border-gray-200 hover:border-gray-300"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Once a damage type is chosen, continue into the (no-payment) checkout
          where address, phone, and scheduling are collected. */}
      {emergencyDamage && (
        <button
          type="button"
          onClick={() => startEmergencyCheckout(emergencyDamage)}
          className="w-full px-4 py-3.5 mt-3.5 bg-red-500 hover:bg-red-600 rounded-lg text-white text-base font-bold transition-colors shadow-sm"
        >
          Continue to checkout
        </button>
      )}
    </>
  );

  // --- Bundle storefront card -------------------------------------------------
  // Collapsed by default (name + Bundle badge + price). Tapping adds the bundle
  // and reveals the details; tapping the expanded header removes it and
  // collapses again. Mirrors the reference onboarding preview.
  const renderBundleCard = (service: Service) => {
    const components = (service.components ?? []).filter((c) => c.enabled);
    if (components.length === 0) return null;
    const isSelected = selectedServices.includes(service.id);
    const unitsMap = getBundleUnitsMap(service);

    const grossCombined = components.reduce(
      (sum, c) =>
        sum +
        (c.pricing === "unit"
          ? (c.price ?? 0) +
            Math.max(0, getBundleComponentUnits(service, c) - (c.includedUnits ?? 0)) *
              (c.unitPrice ?? 0)
          : c.price ?? 0),
      0,
    );
    const total = getBundleTotal(service, unitsMap);
    const savings = Math.max(0, grossCombined - total);
    const hasRecurring = components.some((c) => !!c.recurring);
    const annualPct = FREQUENCY_DISCOUNT_PCT.annual;
    const renewal = getBundleRecurringTotal(service, annualPct, unitsMap);
    const unitComponents = components.filter((c) => c.pricing === "unit");

    if (!isSelected) {
      return (
        <button
          key={service.id}
          type="button"
          onClick={() => handleServiceToggle(service.id)}
          className="w-full text-left bg-white border-2 border-gray-200 transition-all duration-200 hover:border-gray-300 group"
          style={{ borderRadius: 0 }}
        >
          <div className="p-2.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-lg leading-tight text-[#152644]">
                  {service.name}
                </h3>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#152644] text-white px-1.5 py-0.5 leading-tight">
                  Bundle
                </span>
                {savings > 0 && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#03D9E5]/10 text-[#03D9E5] px-1.5 py-0.5 leading-tight">
                    Save {formatPrice(savings)}
                  </span>
                )}
              </div>
              {service.description && (
                <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground leading-snug">
                  {service.description}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0 self-center ml-1 border-l border-gray-100 pl-2 sm:ml-3 sm:pl-4">
              <div className="text-base sm:text-xl font-bold text-[#152644] tabular-nums leading-tight">
                {formatPrice(total)}
              </div>
            </div>
          </div>
        </button>
      );
    }

    return (
      <Card
        key={service.id}
        className="border-2 border-[#03D9E5] bg-white shadow-md"
        style={{ borderRadius: 0 }}
      >
        <CardContent className="p-4 sm:p-5">
          {/* Header — click to remove and collapse */}
          <button
            type="button"
            onClick={() => handleServiceToggle(service.id)}
            className="w-full text-left group"
            aria-label="Remove bundle"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-2xl font-bold text-[#152644] leading-tight group-hover:text-[#152644]/80 transition-colors">
                {service.name}
              </h3>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-[#152644] text-white px-1.5 py-0.5 leading-tight">
                Bundle
              </span>
              {savings > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#03D9E5]/10 text-[#03D9E5] px-1.5 py-0.5 leading-tight">
                  Save {formatPrice(savings)}
                </span>
              )}
            </div>
            {service.description && (
              <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-snug">
                {service.description}
              </p>
            )}
          </button>

          {/* What's included */}
          <div className="mt-5 pt-5 border-t border-gray-200">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
              What&apos;s included
            </span>
            <ul className="mt-2.5 space-y-1.5">
              {[...components]
                .sort((a, b) => (a.recurring ? 0 : 1) - (b.recurring ? 0 : 1))
                .map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-2 text-sm text-[#152644] leading-snug"
                  >
                    {c.recurring ? (
                      <RefreshCw className="h-4 w-4 shrink-0 text-[#03D9E5]" />
                    ) : (
                      <Check className="h-4 w-4 shrink-0 text-[#03D9E5]" strokeWidth={2.5} />
                    )}
                    <span className="min-w-0">{c.name}</span>
                    {c.recurring && (
                      <span className="shrink-0 rounded-full bg-[#03D9E5]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#03D9E5]">
                        Renews annually
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          </div>

          {/* Per-unit steppers (e.g. vents) */}
          {unitComponents.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-200 space-y-2.5">
              {unitComponents.map((c) => {
                const units = getBundleComponentUnits(service, c);
                const unitLabel = c.unitLabel || "unit";
                return (
                  <div key={c.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[#152644] capitalize">
                      {unitLabel}s
                    </span>
                    <CardStepper
                      value={units}
                      min={0}
                      onChange={(next) => setBundleComponentUnits(service.id, c.id, next)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer total */}
          <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500">
              {components.length} {components.length === 1 ? "service" : "services"} bundled
            </span>
            <div className="text-right leading-tight">
              {savings > 0 && (
                <span className="block text-xs font-medium text-gray-400 line-through tabular-nums">
                  {formatPrice(grossCombined)}
                </span>
              )}
              <span className="text-xl sm:text-2xl font-bold text-[#152644] tabular-nums">
                {formatPrice(total)}
              </span>
              {hasRecurring && renewal > 0 && (
                <span className="block text-xs font-medium text-gray-500 tabular-nums">
                  then {formatPrice(renewal)}/yr
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Shared carpet UI: the "base clean is included" block plus the optional
  // add-on toggles. Used by both the desktop card and the mobile sheet. `stop`
  // prevents an add-on click from also toggling the whole service card.
  const renderCarpetConfig = (
    model: CarpetPricingModel,
    sel: Services4CarpetSel,
    setSel: (next: Services4CarpetSel) => void,
    stop = false,
  ) => (
    <>
      <div>
        <div>
          <button
            type="button"
            onClick={(e) => {
              if (stop) e.stopPropagation();
              setSel({ ...sel, moveFurniture: !sel.moveFurniture });
            }}
            className={`w-full text-left flex items-start gap-3 p-3 border-2 transition-colors ${
              sel.moveFurniture
                ? "border-[#03D9E5] bg-[#03D9E5]/5"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div
              className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                sel.moveFurniture ? "bg-[#152644] border-[#152644]" : "border-gray-300 bg-white"
              }`}
            >
              {sel.moveFurniture && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-bold text-[#152644]">
                  Move light furniture during cleaning
                </span>
                <span className="text-sm font-bold text-[#152644] tabular-nums whitespace-nowrap">
                  +$
                  {CARPET_FURNITURE_FEE_PER_AREA % 1 === 0
                    ? CARPET_FURNITURE_FEE_PER_AREA
                    : CARPET_FURNITURE_FEE_PER_AREA.toFixed(2)}
                  /room
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
          Upgrades <span className="text-gray-400 normal-case tracking-normal">(optional)</span>
        </span>
        <div className="mt-3 space-y-2">
          {CARPET_PACKAGES.map((pkg) => {
            const active = carpetPackageActive(sel, pkg.addOnIds);
            const each = carpetPackagePricePerArea(model, pkg.addOnIds);
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={(e) => {
                  if (stop) e.stopPropagation();
                  const next = active
                    ? sel.addOnIds.filter((id) => !pkg.addOnIds.includes(id))
                    : [
                        ...sel.addOnIds,
                        ...pkg.addOnIds.filter((id) => !sel.addOnIds.includes(id)),
                      ];
                  setSel({ ...sel, addOnIds: next });
                }}
                className={`w-full text-left flex items-start gap-3 p-3 border-2 transition-colors ${
                  active
                    ? "border-[#03D9E5] bg-[#03D9E5]/5"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    active ? "bg-[#152644] border-[#152644]" : "border-gray-300 bg-white"
                  }`}
                >
                  {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold text-[#152644]">{pkg.name}</span>
                    <span className="text-sm font-bold text-[#152644] tabular-nums whitespace-nowrap">
                      +{formatPrice(each)}/room
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  const renderSheetConfig = (service: Service) => {
    // Carpet — rooms + base clean + optional add-ons + frequency
    if (service.carpetModel) {
      const carpet = service.carpetModel;
      const sel = getCarpetSel(service);
      const setSel = (next: Services4CarpetSel) =>
        setCarpetSelection({ ...carpetSelection, [service.id]: next });
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Rooms
            </span>
            <div className="flex items-stretch border border-gray-200">
              <button
                type="button"
                onClick={() => setSel({ ...sel, areas: Math.max(1, sel.areas - 1) })}
                className="px-3 h-9 text-gray-600 hover:bg-gray-50 hover:text-[#152644]"
                aria-label="Decrease rooms"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <Input
                type="number"
                min={1}
                value={sel.areas}
                onChange={(e) =>
                  setSel({
                    ...sel,
                    areas: Math.max(1, Number.parseInt(e.target.value) || 1),
                  })
                }
                className="w-12 h-9 px-0 text-center text-sm font-bold text-[#152644] bg-white border-x border-y-0 border-gray-200 rounded-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setSel({ ...sel, areas: sel.areas + 1 })}
                className="px-3 h-9 text-gray-600 hover:bg-gray-50 hover:text-[#152644]"
                aria-label="Increase rooms"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {renderCarpetConfig(carpet, sel, setSel)}

          {service.recurrenceOptions && (
            <FrequencyPicker
              value={serviceFrequency[service.id] ?? "none"}
              onChange={(next) => setFrequencyFor(service.id, next)}
              options={service.recurrenceOptions}
            />
          )}
        </div>
      );
    }

    // Area rug — per-size quantity steppers + frequency
    if (service.rugModel) {
      const rug = service.rugModel;
      const sel = getRugSel(service);
      const setSel = (next: RugSelection) =>
        setRugSelection({ ...rugSelection, [service.id]: next });
      const rugTotalCount = totalRugCount(sel);
      return (
        <div className="space-y-5">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                How many rugs?
              </span>
              <span className="text-[11px] text-gray-500 tabular-nums">
                {rugTotalCount} {rugTotalCount === 1 ? "rug" : "rugs"} total
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {rug.sizes.map((size) => {
                const qty = sel.quantities[size.id] ?? 0;
                const active = qty > 0;
                const setQty = (n: number) => {
                  const clamped = Math.max(0, Math.min(RUG_MAX_PER_SIZE, n));
                  setSel({
                    ...sel,
                    quantities: { ...sel.quantities, [size.id]: clamped },
                  });
                };
                return (
                  <div
                    key={size.id}
                    className={`flex flex-col rounded-xl px-3 pt-4 pb-3 border-2 transition-colors ${
                      active ? "border-[#152644] bg-[#152644]/[0.03]" : "border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <span className="text-base font-bold text-[#152644] leading-none">
                        {size.label}
                      </span>
                      <span className="mt-1.5 text-[11px] text-gray-500 tabular-nums">
                        {size.description}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 items-stretch rounded-lg bg-gray-100 ring-1 ring-inset ring-gray-200/70 overflow-hidden">
                      <button
                        type="button"
                        aria-label={`Decrease ${size.label} count`}
                        onClick={() => qty > 0 && setQty(qty - 1)}
                        className={`h-9 flex items-center justify-center text-gray-500 transition-colors ${
                          qty <= 0 ? "opacity-40" : "hover:text-[#152644] hover:bg-white"
                        }`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="h-9 flex items-center justify-center border-x border-gray-200/80 text-sm font-bold text-[#152644] tabular-nums bg-white/60">
                        {qty}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase ${size.label} count`}
                        onClick={() => qty < RUG_MAX_PER_SIZE && setQty(qty + 1)}
                        className={`h-9 flex items-center justify-center text-gray-500 transition-colors ${
                          qty >= RUG_MAX_PER_SIZE ? "opacity-40" : "hover:text-[#152644] hover:bg-white"
                        }`}
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
            <FrequencyPicker
              value={serviceFrequency[service.id] ?? "none"}
              onChange={(next) => setFrequencyFor(service.id, next)}
              options={service.recurrenceOptions}
            />
          )}
        </div>
      );
    }

    // Upholstery — per-piece quantity steppers
    if (service.variants && service.variantMode === "steppers") {
      return (
        <div className="space-y-2">
          {service.variants.map((variant) => {
            const vqty =
              variantQuantities[service.id]?.[variant.id] ?? variant.defaultQuantity;
            const active = vqty > 0;
            return (
              <div
                key={variant.id}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 border transition-colors ${
                  active ? "border-[#03D9E5] bg-[#03D9E5]/5" : "border-gray-200 bg-white"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#152644] truncate">
                    {variant.name}
                  </div>
                  <div className="text-[11px] text-gray-500 tabular-nums">
                    {formatPrice(variant.unitPrice)} each
                  </div>
                </div>
                <CardStepper
                  value={vqty}
                  min={0}
                  onChange={(next) => setVariantQty(service.id, variant.id, next)}
                />
              </div>
            );
          })}
        </div>
      );
    }

    // Dryer vent — exit-type chips
    if (service.variants) {
      return (
        <div className="flex flex-wrap gap-2">
          {service.variants.map((variant) => {
            const vqty =
              variantQuantities[service.id]?.[variant.id] ?? variant.defaultQuantity;
            const isActive = vqty > 0;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  // Exclusive variants: activating one clears the others so only
                  // a single option (e.g. side vs roof exit) stays selected.
                  if (service.exclusiveVariants && !isActive) {
                    const next: Record<string, number> = {};
                    service.variants!.forEach((v) => {
                      next[v.id] = v.id === variant.id ? 1 : 0;
                    });
                    setVariantQuantities({ ...variantQuantities, [service.id]: next });
                    return;
                  }
                  setVariantQuantities({
                    ...variantQuantities,
                    [service.id]: {
                      ...variantQuantities[service.id],
                      [variant.id]: isActive ? 0 : 1,
                    },
                  });
                }}
                className={`px-3 py-2 text-sm font-medium border transition-all ${
                  isActive
                    ? "bg-[#152644] text-white border-[#152644]"
                    : "bg-white text-muted-foreground border-gray-200 hover:border-gray-400"
                }`}
              >
                {variant.name} · {formatPrice(variant.unitPrice)}
              </button>
            );
          })}
        </div>
      );
    }

    // Simple services — quantity stepper + frequency
    return (
      <div className="space-y-5">
        {service.allowCustomQuantity && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
              {service.unit === "room"
                ? "Rooms"
                : service.unit === "vent"
                ? "Vents"
                : "Quantity"}
            </span>
            <CardStepper
              value={serviceQuantities[service.id] || service.defaultQuantity}
              onChange={(next) => handleQuantityChange(service.id, next)}
            />
          </div>
        )}
        {service.recurrenceOptions && (
          <FrequencyPicker
            value={serviceFrequency[service.id] ?? "none"}
            onChange={(next) => setFrequencyFor(service.id, next)}
            options={service.recurrenceOptions}
          />
        )}
      </div>
    );
  };

  const sheetService = sheetServiceId
    ? availableServices.find((s) => s.id === sheetServiceId) ?? null
    : null;
  const sheetTotal = sheetService
    ? Math.round(
        getServiceBasePrice(sheetService) *
          frequencyMultiplier(serviceFrequency[sheetService.id] ?? "none"),
      )
    : 0;
  const bundleService =
    availableServices.find((s) => s.id === "healthy-home-bundle") ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Combined header: logo on the left, page title next to it */}
      <header ref={headerRef} className="fixed top-0 w-full bg-white backdrop-blur-md border-b border-gray-200 shadow-sm z-50 transition-all duration-200">
        <div
          className={`max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-200 ${
            scrolled ? "py-2" : "py-2.5 sm:py-3"
          }`}
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link href="/" className="hover:opacity-80 transition-opacity shrink-0">
              <Image
                src="/voda-logo.svg"
                alt="Voda Cleaning & Restoration"
                width={200}
                height={60}
                className={`w-auto transition-all duration-200 -translate-y-[4px] sm:-translate-y-[5px] lg:-translate-y-[6px] ${
                  scrolled ? "h-7 lg:h-9" : "h-8 sm:h-9 lg:h-11"
                }`}
              />
            </Link>
            <div className="h-7 sm:h-8 w-px bg-gray-200 shrink-0 self-center" />
            <h1 className="text-lg sm:text-2xl font-bold text-[#152644] tracking-tight leading-none shrink-0 self-center">
              Select Services
            </h1>
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-wider leading-none shrink-0 self-center border border-gray-200">
              STEP 1 OF 3
            </span>
            <button
              type="button"
              onClick={startCommercialInquiry}
              className="hidden lg:inline shrink-0 self-center text-base lg:text-lg font-bold text-[#152644] underline decoration-[#03D9E5] decoration-2 underline-offset-4 hover:text-[#03D9E5] transition-colors"
            >
              Looking for commercial?
            </button>
          </div>

          {/* Right side: schedule-a-visit link + appointment availability */}
          <div className="hidden lg:flex shrink-0 items-center gap-5">
            <button
              type="button"
              onClick={startVisitWithoutService}
              className="shrink-0 self-center text-base lg:text-lg font-bold text-[#152644] underline decoration-[#03D9E5] decoration-2 underline-offset-4 hover:text-[#03D9E5] transition-colors"
            >
              Skip to schedule
            </button>

            {/* Appointment availability — same card format as services3 */}
            {bookDate && (
              <div className="flex shrink-0 items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <CalendarCheck className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 leading-none">
                    Appointments available as soon as
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-[#152644] leading-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {bookDate}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <h1 className="sr-only">
        Book {business.primaryService.toLowerCase()} in {business.city}, {business.state} — {business.brandName}
      </h1>

      <div
        className="flex-1 max-w-[1800px] mx-auto w-full flex flex-col transition-all duration-200"
        style={{ paddingTop: isLg ? 80 : headerH }}
      >
        <div className="flex-1 flex flex-col lg:flex-row shadow-sm border-x border-gray-100 items-start relative">
          {/* Left Panel - Large House Graphic. Sticky with a JS-computed `top`
              (viewport − panel height) so a house taller than the viewport
              scrolls up with the cards and bottoms out together with the right
              column — same pattern as /estimate/services. */}
          <div
            ref={leftPanelRef}
            className="hidden lg:block lg:w-1/2 shrink-0 border-r border-gray-200 bg-[#f8fafc] lg:sticky"
            style={{ top: `${leftPanelStickyTop}px` }}
          >
            <div className="relative w-full">
              <img
                src="/house-whitewalls.png"
                alt="House interior illustration showing different rooms"
                className="block w-full h-auto object-cover"
                onLoad={updateStickyTop}
              />
              {availableServices.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                if (!service.position) return null;

                const leftPct = (service.position.x / 763) * 100;
                const topPct = (service.position.y / 1024) * 100;

                const labelAbove = service.labelPosition === "above";
                return (
                  <button
                    key={service.id}
                    className="absolute cursor-pointer group"
                    style={{
                      top: `${topPct}%`,
                      left: `${leftPct}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={() => handleServiceToggle(service.id)}
                    aria-label={`Toggle ${service.name}`}
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-6 h-6 lg:w-5 lg:h-5 rounded-full transition-all duration-300 border-2 ${
                          isSelected
                            ? "bg-[#03D9E5] border-white shadow-[0_0_24px_rgba(3,217,229,0.7),0_0_8px_rgba(3,217,229,0.9)] scale-125 ring-4 ring-[#03D9E5]/40"
                            : "bg-white border-[#152644]/40 hover:border-[#152644] hover:scale-110 shadow-lg"
                        }`}
                      />
                      <div
                        className={`absolute ${
                          labelAbove ? "bottom-full mb-1" : "top-full mt-1"
                        } left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap z-10`}
                      >
                        <div className={`text-[13px] px-2 py-0.5 rounded transition-all duration-300 ${
                          isSelected
                            ? "bg-[#03D9E5] text-white font-semibold shadow-md"
                            : "bg-[#152644]/80 text-white font-medium"
                        }`}>
                          {service.name}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Service Cards */}
          <div className="bg-white flex flex-col relative w-full lg:w-1/2 shrink-0">
            {/* Mobile-only view toggle: House (pills) | List (cards). Pinned just
                below the fixed header; hidden on desktop where both panes show. */}
            <div
              className="lg:hidden sticky z-30 bg-white border-b border-gray-200 px-4 py-1.5 flex justify-center"
              style={{ top: headerH }}
            >
              <div className="inline-flex gap-1 bg-gray-100 rounded-[10px] p-[3px]">
                {([
                  { id: "list" as const, label: "List", Icon: List },
                  { id: "house" as const, label: "All", Icon: Home },
                ]).map(({ id, label, Icon }) => {
                  const on = mobileView === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMobileView(id)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
                        on ? "bg-white text-[#152644] shadow-sm" : "text-gray-500"
                      }`}
                    >
                      <Icon className="h-[15px] w-[15px]" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile-only House view: tappable label pills over the dollhouse.
                The illustration is portrait, so at full screen width it leaves
                empty space below. Scale it up past the screen edges and clip the
                (empty) side margins so it fills more vertically — pills stay
                aligned since they're positioned within this same scaled box. */}
            <div
              className={`lg:hidden ${mobileView === "house" ? "block" : "hidden"} bg-white overflow-hidden pb-28`}
            >
              <div
                className="relative shrink-0"
                style={{ width: "118%", marginLeft: "-9%" }}
              >
                <img
                  src="/house-whitewalls.png"
                  alt="Cutaway home interior showing each room"
                  className="block w-full h-auto select-none"
                  draggable={false}
                />

                {/* Area Rug wayfinder: connector + glowing locator dot, shown
                    only while Area Rug is unselected (the pill alone signals it
                    once selected). */}
                {!selectedServices.includes("rugs") && (
                  <>
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ zIndex: 3 }}
                    >
                      <line
                        x1={RUG_PIN.x}
                        y1={RUG_PIN.y}
                        x2={MOBILE_PILLS.rugs.x}
                        y2={MOBILE_PILLS.rugs.y}
                        stroke="#fff"
                        strokeWidth={2.6}
                        strokeOpacity={0.65}
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                      />
                      <line
                        x1={RUG_PIN.x}
                        y1={RUG_PIN.y}
                        x2={MOBILE_PILLS.rugs.x}
                        y2={MOBILE_PILLS.rugs.y}
                        stroke="#03D9E5"
                        strokeWidth={1.3}
                        strokeOpacity={0.85}
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div
                      className="absolute"
                      style={{
                        left: `${RUG_PIN.x}%`,
                        top: `${RUG_PIN.y}%`,
                        transform: "translate(-50%,-50%)",
                        zIndex: 5,
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          width: 11,
                          height: 11,
                          borderRadius: "50%",
                          background: "#03D9E5",
                          border: "2.5px solid #fff",
                          boxShadow:
                            "0 0 0 3px rgba(3,217,229,0.18), 0 1px 4px rgba(0,0,0,0.22)",
                        }}
                      />
                    </div>
                  </>
                )}

                {/* Service pills */}
                {availableServices.map((service) => {
                  const pill = MOBILE_PILLS[service.id];
                  if (!pill) return null;
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handlePillTap(service.id)}
                      aria-label={service.name}
                      style={{
                        position: "absolute",
                        left: `${pill.x}%`,
                        top: `${pill.y}%`,
                        transform: "translate(-50%,-50%)",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        height: 30,
                        boxSizing: "border-box",
                        padding: isSelected ? "4px 11px 4px 6px" : "4px 11px",
                        borderRadius: 9,
                        whiteSpace: "nowrap",
                        background: isSelected
                          ? "rgba(255,255,255,0.92)"
                          : "rgba(255,255,255,0.7)",
                        backdropFilter: "blur(7px)",
                        WebkitBackdropFilter: "blur(7px)",
                        border: `1px solid ${
                          isSelected ? "#03D9E5" : "rgba(20,37,62,0.08)"
                        }`,
                        boxShadow: isSelected
                          ? "0 4px 12px rgba(3,217,229,0.22)"
                          : "0 2px 8px rgba(20,37,62,0.13)",
                        zIndex: isSelected ? 8 : 6,
                        transition:
                          "box-shadow .18s ease, background .18s ease, border-color .18s ease",
                      }}
                    >
                      {isSelected && (
                        <span
                          style={{
                            width: 15,
                            height: 15,
                            borderRadius: "50%",
                            background: "#03D9E5",
                            flexShrink: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Check
                            className="h-2.5 w-2.5 text-white"
                            strokeWidth={3.5}
                          />
                        </span>
                      )}
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 15,
                          color: "#152644",
                          lineHeight: 1,
                        }}
                      >
                        {pill.short}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`flex-1 py-4 px-4 sm:py-6 sm:px-6 lg:px-10 pb-[320px] lg:pb-4 ${
                mobileView === "house" ? "hidden lg:block" : "block"
              }`}
            >
              {/* Appointment availability + commercial link — shown below lg;
                  at lg+ these live in the navbar instead. */}
              <div className="lg:hidden mb-5 flex flex-wrap items-center justify-between gap-3">
                {bookDate && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#03D9E5]/10 px-4 py-2 text-sm sm:text-[15px] font-bold text-[#152644] ring-1 ring-[#03D9E5]/30">
                    <CalendarCheck className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-[#03D9E5]" strokeWidth={2.5} />
                    Appointments available as soon as {bookDate}
                  </div>
                )}
                <div className="flex w-full items-center justify-center gap-x-3 gap-y-1">
                  <button
                    type="button"
                    onClick={startVisitWithoutService}
                    className="text-base font-bold text-[#152644] underline decoration-[#03D9E5] decoration-2 underline-offset-4 hover:text-[#03D9E5] transition-colors"
                  >
                    Skip to schedule
                  </button>
                  <span className="text-gray-300" aria-hidden="true">|</span>
                  <button
                    type="button"
                    onClick={startCommercialInquiry}
                    className="text-base font-bold text-[#152644] underline decoration-[#03D9E5] decoration-2 underline-offset-4 hover:text-[#03D9E5] transition-colors"
                  >
                    Looking for commercial?
                  </button>
                </div>
              </div>

              {/* Emergency / Restoration Services Card — white card, red outline.
                  Collapsed by default; expands to reveal the damage-type chips
                  and a Book button into the no-payment checkout. */}
              <div className="mb-6">
                <Card
                  className="cursor-pointer border-2 border-red-300 bg-white shadow-sm transition-colors hover:border-red-400"
                  style={{ borderRadius: 0 }}
                  onClick={() => setEmergencyOpen((v) => !v)}
                >
                  <CardContent className="p-2.5 sm:p-4">
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-600 text-white flex-shrink-0 shadow-sm">
                          <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <h3 className="font-bold text-sm sm:text-lg leading-tight text-[#152644]">
                              Emergency &amp; Restoration
                            </h3>
                            <span className="text-[9px] sm:text-[10px] font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded tracking-wide uppercase">
                              24/7
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
                            Water, fire, storm or mold damage? We&apos;re here 24/7.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEmergencyOpen((v) => !v);
                        }}
                        className="text-base sm:text-xl font-bold text-[#152644] hover:text-[#03D9E5] whitespace-nowrap transition-colors self-center"
                      >
                        Book
                      </button>
                    </div>

                    {/* Damage-type chips + Book — only when expanded */}
                    {emergencyOpen && (
                    <div
                      className="mt-4 pt-4 border-t border-gray-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-2.5">
                        Select damage type
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {(["Water", "Fire", "Mold", "Storm"] as const).map((type) => {
                          const active = emergencyDamage === type;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setEmergencyDamage(type)}
                              aria-pressed={active}
                              className={`px-3 py-2 text-sm font-medium border transition-all ${
                                active
                                  ? "bg-[#152644] text-white border-[#152644]"
                                  : "bg-white text-muted-foreground border-gray-200 hover:border-gray-400"
                              }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          disabled={!emergencyDamage}
                          onClick={() => emergencyDamage && startEmergencyCheckout(emergencyDamage)}
                          className="px-5 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500"
                        >
                          Book
                        </button>
                        <a
                          href="tel:+16083988632"
                          aria-label="Call (608) 398-8632"
                          className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm flex-shrink-0"
                        >
                          <PhoneCall className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6 mb-8">
                {serviceCategories.map((category) => (
                  <div key={category.id}>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {category.label}
                    </h2>
                    <div className="space-y-2">
                {availableServices
                  .filter((s) => s.category === category.id)
                  .map((service) => {
                  // Bundles render their own dedicated card.
                  if (isBundleService(service)) {
                    return renderBundleCard(service);
                  }
                  const isSelected = selectedServices.includes(service.id);
                  const quantity =
                    serviceQuantities[service.id] || service.defaultQuantity;
                  const carpetSel = service.carpetModel ? getCarpetSel(service) : undefined;
                  const rugSel = service.rugModel ? getRugSel(service) : undefined;
                  const rugActiveLevel = service.rugModel && rugSel
                    ? getRugLevelById(service.rugModel, rugSel.levelId)
                    : undefined;
                  const rugTotalCount = rugSel ? totalRugCount(rugSel) : 0;
                  const serviceTotal = service.carpetModel && carpetSel
                    ? carpetTotalFor(service, carpetSel)
                    : service.rugModel && rugSel
                    ? computeRugTotal(service.rugModel, rugSel)
                    : service.variants
                    ? service.variants.reduce((sum, v) => {
                        const qty = variantQuantities[service.id]?.[v.id] ?? v.defaultQuantity;
                        return sum + v.unitPrice * qty;
                      }, 0)
                    : service.unitPrice * quantity + (service.baseFee ?? 0);

                  // Expanded carpet card (base clean + optional add-ons)
                  if (service.carpetModel && carpetSel && isSelected) {
                    const carpet = service.carpetModel;
                    const sel = carpetSel;
                    const setSel = (next: Services4CarpetSel) => {
                      setCarpetSelection({ ...carpetSelection, [service.id]: next });
                    };

                    return (
                      <Card
                        key={service.id}
                        data-service-card={service.id}
                        className="cursor-pointer transition-all duration-200 border-2 border-[#03D9E5] bg-white shadow-md"
                        style={{ borderRadius: 0 }}
                        onClick={() => handleServiceToggle(service.id)}
                      >
                        <CardContent className="p-4 sm:p-5">
                          {/* Header: title + badge + description ↔ rooms stepper.
                              Wraps the stepper below the title once the column is
                              too narrow (e.g. the lg 40/60 split at 1024) so the
                              title never collapses to one word per line. */}
                          <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                            <div className="flex-1 min-w-[200px]">
                              <h3 className="text-lg sm:text-2xl font-bold text-[#152644] leading-tight">
                                {service.name}
                              </h3>
                              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                <span className="inline-block text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 uppercase tracking-wider">
                                  {service.unitLabel}
                                </span>
                                <span className="text-[11px] text-gray-500">
                                  1 room = {carpet.sqftPerArea} sq ft
                                </span>
                              </div>
                              {service.description && (
                                <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-snug">
                                  {service.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Base clean + optional add-ons */}
                          <div
                            className="mt-5 pt-5 border-t border-gray-200 space-y-5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {renderCarpetConfig(carpet, sel, setSel, true)}
                          </div>

                          {/* Recurrence */}
                          {service.recurrenceOptions && (
                            <div className="mt-5 pt-5 border-t border-gray-200">
                              <FrequencyPicker
                                value={serviceFrequency[service.id] ?? "none"}
                                onChange={(next) => setFrequencyFor(service.id, next)}
                                options={service.recurrenceOptions}
                              />
                            </div>
                          )}

                          {/* Footer: rooms stepper + total */}
                          <div className="mt-5 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-sm text-gray-500">
                              Base clean
                              {(() => {
                                const n = CARPET_PACKAGES.filter((p) =>
                                  carpetPackageActive(sel, p.addOnIds),
                                ).length;
                                return n > 0 ? ` + ${n} upgrade${n === 1 ? "" : "s"}` : "";
                              })()}{" "}
                              × {sel.areas} {sel.areas === 1 ? "room" : "rooms"}
                            </span>
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                              <CardStepper
                                label="Rooms"
                                value={sel.areas}
                                onChange={(next) => setSel({ ...sel, areas: next })}
                              />
                              <span className="text-xl sm:text-2xl font-bold text-[#152644] tabular-nums">
                                {(() => {
                                  const freq = serviceFrequency[service.id] ?? "none";
                                  const discounted = serviceTotal * frequencyMultiplier(freq);
                                  return freq === "none" ? (
                                    formatPrice(serviceTotal)
                                  ) : (
                                    <>
                                      {formatPrice(Math.round(discounted))}
                                      <span className="ml-2 text-sm font-medium text-gray-400 line-through">
                                        {formatPrice(serviceTotal)}
                                      </span>
                                    </>
                                  );
                                })()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  // Expanded rug card
                  if (
                    service.rugModel &&
                    rugSel &&
                    rugActiveLevel &&
                    isSelected
                  ) {
                    const rug = service.rugModel;
                    const sel = rugSel;
                    const setSel = (next: RugSelection) => {
                      setRugSelection({ ...rugSelection, [service.id]: next });
                    };

                    return (
                      <Card
                        key={service.id}
                        data-service-card={service.id}
                        className="cursor-pointer transition-all duration-200 border-2 border-[#03D9E5] bg-white shadow-md"
                        style={{ borderRadius: 0 }}
                        onClick={() => handleServiceToggle(service.id)}
                      >
                        <CardContent className="p-4 sm:p-5">
                          {/* Header */}
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg sm:text-2xl font-bold text-[#152644] leading-tight">
                                  {service.name}
                                </h3>
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 uppercase tracking-wider">
                                  {service.unitLabel}
                                </span>
                              </div>
                              {service.description && (
                                <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-snug">
                                  {service.description}
                                </p>
                              )}
                              {service.disclaimer && (
                                <p className="mt-1 text-[11px] italic text-gray-400">
                                  {service.disclaimer}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* How many rugs? */}
                          <div className="mt-5 pt-5 border-t border-gray-200">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                                How many rugs?
                              </span>
                              <span className="text-[11px] text-gray-500 tabular-nums">
                                {rugTotalCount} {rugTotalCount === 1 ? "rug" : "rugs"} total
                              </span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {rug.sizes.map((size) => {
                                const qty = sel.quantities[size.id] ?? 0;
                                const active = qty > 0;
                                const setQty = (n: number) => {
                                  const clamped = Math.max(0, Math.min(RUG_MAX_PER_SIZE, n));
                                  setSel({
                                    ...sel,
                                    quantities: { ...sel.quantities, [size.id]: clamped },
                                  });
                                };
                                return (
                                  <button
                                    key={size.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (qty < RUG_MAX_PER_SIZE) setQty(qty + 1);
                                    }}
                                    className={`flex flex-col items-stretch justify-between rounded-xl px-3 pt-4 pb-3 border-2 transition-colors duration-150 text-left ${
                                      active
                                        ? "border-[#152644] bg-[#152644]/[0.03]"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                                  >
                                    <div className="flex flex-col items-center text-center w-full">
                                      <span className="text-base sm:text-lg font-bold text-[#152644] leading-none">
                                        {size.label}
                                      </span>
                                      <span className="mt-1.5 text-[11px] sm:text-xs text-gray-500 tabular-nums">
                                        {size.description}
                                      </span>
                                    </div>
                                    <span
                                      className="mt-3 w-full grid grid-cols-3 items-stretch rounded-lg bg-gray-100 ring-1 ring-inset ring-gray-200/70 overflow-hidden"
                                      role="group"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <span
                                        role="button"
                                        aria-disabled={qty <= 0}
                                        aria-label={`Decrease ${size.label} count`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (qty > 0) setQty(qty - 1);
                                        }}
                                        className={`h-9 flex items-center justify-center text-gray-500 transition-colors ${
                                          qty <= 0
                                            ? "opacity-40 cursor-default"
                                            : "hover:text-[#152644] hover:bg-white cursor-pointer"
                                        }`}
                                      >
                                        <Minus className="h-3.5 w-3.5" />
                                      </span>
                                      <span className="h-9 flex items-center justify-center border-x border-gray-200/80 text-sm font-bold text-[#152644] tabular-nums bg-white/60">
                                        {qty}
                                      </span>
                                      <span
                                        role="button"
                                        aria-disabled={qty >= RUG_MAX_PER_SIZE}
                                        aria-label={`Increase ${size.label} count`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (qty < RUG_MAX_PER_SIZE) setQty(qty + 1);
                                        }}
                                        className={`h-9 flex items-center justify-center text-gray-500 transition-colors ${
                                          qty >= RUG_MAX_PER_SIZE
                                            ? "opacity-40 cursor-default"
                                            : "hover:text-[#152644] hover:bg-white cursor-pointer"
                                        }`}
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                      </span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Recurrence */}
                          {service.recurrenceOptions && (
                            <div className="mt-5 pt-5 border-t border-gray-200">
                              <FrequencyPicker
                                value={serviceFrequency[service.id] ?? "none"}
                                onChange={(next) => setFrequencyFor(service.id, next)}
                                options={service.recurrenceOptions}
                              />
                            </div>
                          )}

                          {/* Footer total */}
                          <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-500">
                              {(() => {
                                const breakdown = rug.sizes
                                  .filter((s) => (sel.quantities[s.id] ?? 0) > 0)
                                  .map((s) => `${sel.quantities[s.id]}× ${s.label}`)
                                  .join(", ");
                                return breakdown || "0 rugs";
                              })()}
                            </span>
                            <span className="text-xl sm:text-2xl font-bold text-[#152644] tabular-nums">
                              {(() => {
                                const freq = serviceFrequency[service.id] ?? "none";
                                const discounted = serviceTotal * frequencyMultiplier(freq);
                                return freq === "none" ? (
                                  formatPrice(serviceTotal)
                                ) : (
                                  <>
                                    {formatPrice(Math.round(discounted))}
                                    <span className="ml-2 text-sm font-medium text-gray-400 line-through">
                                      {formatPrice(serviceTotal)}
                                    </span>
                                  </>
                                );
                              })()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  // Collapsed carpet/rug cards carry a "per room"/"per rug"
                  // label, so their price should be the single-unit rate (not
                  // the default multi-unit total). The total only shows once the
                  // card is expanded, where its footer already spells it out.
                  const collapsedPrice = service.carpetModel && carpetSel
                    ? carpetTotal(service.carpetModel, { ...carpetSel, areas: 1 })
                    : service.rugModel
                    ? computeRugTotal(service.rugModel, defaultRugSelection(service.rugModel))
                    : serviceTotal;

                  return (
                    <Card
                      key={service.id}
                      data-service-card={service.id}
                      className={`cursor-pointer transition-all duration-200 border-2 ${
                        isSelected
                          ? "border-[#03D9E5] bg-[#03D9E5]/5 shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={{ borderRadius: 0 }}
                      onClick={() => handleServiceToggle(service.id)}
                    >
                      <CardContent className="p-2.5 sm:p-4">
                        <div className="flex items-center justify-between gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
                              <h3 className="font-bold text-sm sm:text-lg leading-tight text-[#152644]">
                                {service.name}
                              </h3>
                              <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded tracking-wide uppercase">
                                {service.unitLabel}
                              </span>
                            </div>
                            {service.description && (
                              <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
                                {service.description}
                              </p>
                            )}
                            {service.disclaimer && (
                              <p className="text-[10px] sm:text-[11px] italic text-gray-400 leading-snug mt-0.5">
                                {service.disclaimer}
                              </p>
                            )}
                            {/* Variants — stepper mode (upholstery): collapsed
                                until the card is selected, then a list of
                                furniture types with a unit count per type */}
                            {service.variants &&
                              service.variantMode === "steppers" &&
                              !isSelected && (
                                <p className="text-[11px] sm:text-xs text-gray-500 mt-1.5">
                                  Tap to choose pieces &amp; quantities
                                </p>
                              )}
                            {service.variants &&
                              service.variantMode === "steppers" &&
                              isSelected && (
                                <div
                                  className="mt-2 space-y-1.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {service.variants.map((variant) => {
                                    const vqty =
                                      variantQuantities[service.id]?.[
                                        variant.id
                                      ] ?? variant.defaultQuantity;
                                    const active = vqty > 0;
                                    return (
                                      <div
                                        key={variant.id}
                                        className={`flex items-center justify-between gap-3 px-3 py-2 border transition-colors duration-150 ${
                                          active
                                            ? "border-[#03D9E5] bg-[#03D9E5]/5"
                                            : "border-gray-200 bg-white"
                                        }`}
                                      >
                                        <div className="min-w-0">
                                          <div className="text-xs sm:text-sm font-semibold text-[#152644] truncate">
                                            {variant.name}
                                          </div>
                                          <div className="text-[11px] text-gray-500 tabular-nums">
                                            {formatPrice(variant.unitPrice)} each
                                          </div>
                                        </div>
                                        <CardStepper
                                          value={vqty}
                                          min={0}
                                          onChange={(next) =>
                                            setVariantQty(service.id, variant.id, next)
                                          }
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            {/* Variants — chip mode (default, e.g. dryer-vent exits) */}
                            {service.variants &&
                              service.variantMode !== "steppers" && (
                              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                                {service.variants.map((variant) => {
                                  const vqty = variantQuantities[service.id]?.[variant.id] ?? variant.defaultQuantity;
                                  const isActive = vqty > 0;
                                  return (
                                    <button
                                      key={variant.id}
                                      type="button"
                                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium border transition-all duration-150 ${
                                        isActive
                                          ? "bg-[#152644] text-white border-[#152644]"
                                          : "bg-white text-muted-foreground border-gray-200 hover:border-gray-400"
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleVariantChipClick(service, variant.id);
                                      }}
                                    >
                                      {variant.name} · {formatPrice(variant.unitPrice)}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            {/* Quantity controls - always visible for non-variant services */}
                            {!service.variants && !service.carpetModel && service.allowCustomQuantity && (
                              <div className="mt-2">
                                <CardStepper
                                  label={
                                    service.unit === "room"
                                      ? "Rooms"
                                      : service.unit === "vent"
                                      ? "Vents"
                                      : "Quantity"
                                  }
                                  value={quantity}
                                  onChange={(next) => handleQuantityChange(service.id, next)}
                                />
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 self-center ml-1 border-l border-gray-100 pl-2 sm:ml-3 sm:pl-4">
                            <div className="text-base sm:text-xl font-bold text-[#152644] tabular-nums">
                              {(() => {
                                const freq = serviceFrequency[service.id] ?? "none";
                                const discounted = collapsedPrice * frequencyMultiplier(freq);
                                return freq === "none" ? (
                                  formatPrice(collapsedPrice)
                                ) : (
                                  <div className="flex flex-col items-end leading-tight">
                                    <span>{formatPrice(Math.round(discounted))}</span>
                                    <span className="text-xs font-medium text-gray-400 line-through">
                                      {formatPrice(collapsedPrice)}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                        {isSelected && service.recurrenceOptions && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <FrequencyPicker
                              value={serviceFrequency[service.id] ?? "none"}
                              onChange={(next) => setFrequencyFor(service.id, next)}
                              options={service.recurrenceOptions}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedServices.length > 0 && (
            <div data-checkout-bar className="fixed bottom-0 left-0 right-0 lg:sticky lg:left-auto lg:right-auto lg:bottom-0 z-30 lg:z-20 border-t border-gray-200 bg-white px-4 py-3 sm:px-8 sm:py-6 flex-shrink-0 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full border-2 border-[#152644] flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#152644]" />
                      </div>
                      <span className="text-sm font-semibold text-[#152644]">
                        Total ({selectedServices.length} {selectedServices.length === 1 ? "service" : "services"})
                      </span>
                    </div>
                    <div className="text-right leading-tight">
                      {basePrice > totalPrice && (
                        <p className="text-[11px] sm:text-xs font-medium text-green-600">
                          Save {formatPrice(Math.round(basePrice - totalPrice))}
                        </p>
                      )}
                      <p className="text-lg sm:text-xl font-bold text-[#152644] tabular-nums">
                        {formatPrice(totalPrice)}
                      </p>
                    </div>
                  </div>

                  {(() => {
                    // The $165 visit minimum is waived once the cart holds a
                    // recurring subscription — those commit to ongoing revenue.
                    const hasRecurring = selectedServices.some(
                      (id) => (serviceFrequency[id] ?? "none") !== "none",
                    );
                    const belowMinimum = !hasRecurring && totalPrice < SERVICE_MINIMUM;
                    const remaining = Math.max(0, SERVICE_MINIMUM - totalPrice);
                    const progressPct = Math.min(100, (totalPrice / SERVICE_MINIMUM) * 100);
                    return (
                      <>
                        {!hasRecurring && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1">
                              <span className="font-semibold text-gray-600">
                                Service Minimum {formatPrice(SERVICE_MINIMUM)}
                              </span>
                              <span
                                className={`tabular-nums font-semibold ${
                                  belowMinimum ? "text-amber-600" : "text-green-600"
                                }`}
                              >
                                {belowMinimum ? `${formatPrice(remaining)} to go` : "Minimum met"}
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-200 ${
                                  belowMinimum ? "bg-amber-500" : "bg-[#03D9E5]"
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={handleContinueToScheduling}
                          size="lg"
                          disabled={belowMinimum}
                          className={`w-full font-semibold rounded-lg h-10 sm:h-11 ${
                            belowMinimum
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200"
                              : "bg-[#152644] hover:bg-[#152644]/90 text-white"
                          }`}
                        >
                          {belowMinimum ? `Add ${formatPrice(remaining)} to Continue` : "Continue"}
                        </Button>
                      </>
                    );
                  })()}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile House view: bottom-sheet configurator opened by tapping a pill. */}
      <Drawer.Root
        open={!!sheetServiceId}
        onOpenChange={(open) => {
          if (!open) setSheetServiceId(null);
        }}
        shouldScaleBackground={false}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[60] bg-[#14253E]/45" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[92%] flex-col rounded-t-[22px] bg-white outline-none lg:hidden">
            <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-gray-300" />
            {sheetService && (
              <>
                <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Drawer.Title className="text-xl font-bold text-[#152644] leading-tight">
                        {sheetService.name}
                      </Drawer.Title>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 uppercase tracking-wider">
                        {sheetService.unitLabel}
                      </span>
                    </div>
                    {sheetService.description && (
                      <Drawer.Description className="mt-1.5 text-xs text-gray-600 leading-snug">
                        {sheetService.description}
                      </Drawer.Description>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSheetServiceId(null)}
                    aria-label="Close"
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600 hover:bg-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
                  {renderSheetConfig(sheetService)}
                </div>

                <div className="border-t border-gray-200 px-5 pt-3 pb-[calc(14px+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(20,37,62,0.06)]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">Estimated</span>
                    <span className="text-2xl font-bold text-[#152644] tabular-nums">
                      {formatPrice(sheetTotal)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedServices.includes(sheetService.id)) {
                          handleServiceToggle(sheetService.id);
                        }
                        setSheetServiceId(null);
                      }}
                      className="px-4 py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg hover:text-[#152644] hover:border-gray-400"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setSheetServiceId(null)}
                      className="flex-1 px-4 py-3 text-[15px] font-semibold text-white bg-[#152644] rounded-lg hover:bg-[#152644]/90"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Mobile bottom sheet: Emergency & Restoration */}
      <Drawer.Root
        open={emergencySheetOpen}
        onOpenChange={(open) => {
          if (!open) setEmergencySheetOpen(false);
        }}
        shouldScaleBackground={false}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[60] bg-[#14253E]/45" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[92%] flex-col rounded-t-[22px] bg-white outline-none lg:hidden">
            <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-gray-300" />
            <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white shrink-0 shadow-sm">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <Drawer.Title className="text-xl font-bold text-[#152644] leading-tight">
                    Emergency &amp; Restoration
                  </Drawer.Title>
                  <Drawer.Description className="mt-0.5 text-xs text-gray-600 leading-snug">
                    Water, fire, storm or mold damage? We&apos;re here 24/7.
                  </Drawer.Description>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmergencySheetOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
              {renderEmergencyBody()}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Mobile bottom sheet: Healthy Home Bundle */}
      <Drawer.Root
        open={bundleSheetOpen}
        onOpenChange={(open) => {
          if (!open) setBundleSheetOpen(false);
        }}
        shouldScaleBackground={false}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[60] bg-[#14253E]/45" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[92%] flex-col rounded-t-[22px] bg-white outline-none lg:hidden">
            <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-gray-300" />
            <Drawer.Title className="sr-only">Healthy Home Bundle</Drawer.Title>
            <Drawer.Description className="sr-only">
              Carpet cleaning, vent cleaning, and an upholstery refresh bundled at a discount.
            </Drawer.Description>
            <div className="flex justify-end px-5 pt-2">
              <button
                type="button"
                onClick={() => setBundleSheetOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
              {bundleService && renderBundleCard(bundleService)}
            </div>
            <div className="border-t border-gray-200 px-5 pt-3 pb-[calc(14px+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(20,37,62,0.06)]">
              <button
                type="button"
                onClick={() => setBundleSheetOpen(false)}
                className="w-full px-4 py-3 text-[15px] font-semibold text-white bg-[#152644] rounded-lg hover:bg-[#152644]/90"
              >
                Done
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
