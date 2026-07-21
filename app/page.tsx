"use client";
import "./voda-design.css";
import { Footer } from "@/components/footer";
import { useState, useEffect } from "react";
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
  X,
  RefreshCw,
  CalendarCheck,
  AlertTriangle,
  ChevronDown,
  Building2,
  ArrowRight,
  Info,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { business } from "@/lib/business";
import { Check } from "lucide-react";
import {
  carpetModel,
  CARPET_FURNITURE_FEE_PER_AREA,
  s6VacantDiscount,
  type CarpetPricingModel,
  type CarpetAddOn,
} from "@/lib/carpet";
import {
  CarpetConfigurator,
  carpetTotal,
  carpetPricePerRoom,
  type CarpetSel,
} from "@/components/lp/carpet-configurator";
import { RestorationStrip } from "@/components/lp/restoration-strip";
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
import { Drawer } from "vaul";
import { PromoBanner } from "@/components/promo-banner";
import {
  getFlatOffer,
  flatOfferDiscount,
  type FlatOffer,
} from "@/lib/promo";

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
  defaultQuantity: number;
  unit: string;
  unitLabel: string;
  icon: any;
  allowCustomQuantity: boolean;
  variants?: ServiceVariant[];
  /** "chips" = on/off toggles (default); "steppers" = collapsed-by-default list with per-type unit counts */
  variantMode?: "chips" | "steppers";
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
  { id: "floor-care" as const, label: "Floor Care", subtitle: "Carpet, rugs, tile, hardwood & more", icon: Grid3x3 },
  { id: "cleaning" as const, label: "Air & Upholstery", subtitle: "Vents, ducts, upholstery & odor", icon: Wind },
]

const availableServices: Service[] = [
  // Floor Care
  {
    id: "carpet-cleaning",
    name: "Eco-Friendly Carpet Cleaning",
    description:
      "Deep steam cleaning with non-toxic solutions to remove dirt, stains, and allergens.",
    disclaimer: `1 room = ${carpetModel.sqftPerArea} sq ft.`,
    unitPrice: 67.5,
    defaultQuantity: carpetModel.defaultAreas,
    unit: "room",
    unitLabel: "per room",
    icon: Sparkles,
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
    unitPrice: 75.0,
    defaultQuantity: 1,
    unit: "room",
    unitLabel: "per room",
    icon: Home,
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
    icon: Layers,
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
    icon: TreePine,
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
    icon: Grid3x3,
    allowCustomQuantity: true,
    category: "floor-care",
  },
  // Cleaning
  {
    id: "dryer-vent-cleaning",
    name: "Dryer Vent Cleaning",
    description:
      "Removes dust, allergens, and lint using negative air systems to improve airflow and air quality.",
    disclaimer: "Min. service applies.",
    unitPrice: 50.0,
    defaultQuantity: 1,
    unit: "vent",
    unitLabel: "per vent",
    icon: Fan,
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
    unitPrice: 50.0,
    defaultQuantity: 12,
    unit: "vent",
    unitLabel: "per vent",
    icon: Wind,
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
    icon: Sofa,
    allowCustomQuantity: false,
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
    category: "cleaning",
  },
  // Bundle — combines several services at a single discounted price.
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

type EmergencyDamage = "Water" | "Fire" | "Mold" | "Storm";

// The next business day (skips weekends). Computed on the client so the labels
// reflect the visitor's current date, not the build date.
function nextBusinessDay(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

// "Wed, July 15" — the topbar's earliest-appointment pill.
const nextBusinessDayLabel = (): string =>
  nextBusinessDay().toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });

// "Wed, Jul 15" — the same date on the CTA, where there's no room for the long form.
const nextBusinessDayShortLabel = (): string =>
  nextBusinessDay().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

// Short marketing blurb + cadence per service, used by the refined-light
// add-on cards and the "All other services" rows (mirrors the design copy).
const SVC_META: Record<string, { blurb: string; cadence?: string }> = {
  "dryer-vent-cleaning": { blurb: "Improve airflow, reduce fire risk", cadence: "1× a year" },
  "upholstery-cleaning": { blurb: "Refresh fabric furniture", cadence: "As needed" },
  rugs: { blurb: "Gentle hand-wash clean", cadence: "Seasonal" },
  "air-duct-cleaning": { blurb: "Cleaner air, less dust", cadence: "1–2× a year" },
  "routine-floor-care": { blurb: "Vacuum & mop between deep cleans", cadence: "Recurring" },
  "hardwood-detailing": { blurb: "Clean, polish & restore hardwood", cadence: "1–2× a year" },
  "tile-grout-stone": { blurb: "Steam-lift stains & buildup", cadence: "1–2× a year" },
  "odor-spot-control": { blurb: "Neutralize tough odors at the source", cadence: "As needed" },
  "healthy-home-bundle": { blurb: "Carpet, vents & upholstery — save 15%", cadence: "Best value" },
};

// services6 carpet pricing + the carpet product module now live in the shared
// components/lp/carpet-configurator, so the book page and the Madison landing
// pages render the same component. CarpetSel, carpetTotal, carpetPricePerRoom,
// CARPET_ADDONS and the CarpetConfigurator are imported from there.

export default function ServicesPage() {
  const router = useRouter();
  // services6: the carpet card is the always-visible hero and loads
  // pre-selected & pre-configured, so the estimate starts non-empty and the
  // visitor is one tap from the calendar.
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "carpet-cleaning",
  ]);
  const [serviceQuantities, setServiceQuantities] = useState<
    Record<string, number>
  >({});
  const [variantQuantities, setVariantQuantities] = useState<
    Record<string, Record<string, number>>
  >({});
  // Seeded with the carpet hero's default: the card is pre-selected without ever
  // passing through handleServiceToggle, and an absent entry would send checkout
  // an empty carpetSelection — which prices the clean off the legacy Silver tier
  // instead of the à-la-carte quote the card just showed.
  const [carpetSelection, setCarpetSelection] = useState<Record<string, CarpetSel>>({
    "carpet-cleaning": {
      areas: carpetModel.defaultAreas,
      addOnIds: [],
      moveFurniture: true,
      vacant: false,
    },
  });
  const [rugSelection, setRugSelection] = useState<Record<string, RugSelection>>({});
  // Customer-chosen quantities for unit-priced bundle components, keyed by
  // `${serviceId}:${componentId}` (e.g. how many vents in the bundle).
  const [bundleUnits, setBundleUnits] = useState<Record<string, number>>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [serviceFrequency, setServiceFrequency] = useState<Record<string, ServiceFrequency>>({ "carpet-cleaning": "none" });
  // Active flat-price offer (e.g. the /offer $149 upholstery deal). When set via
  // ?promo=, the required pieces are pre-selected, the running total reflects the
  // flat price, the service minimum is waived, and the offer is carried into
  // checkout so the discount survives to the customer/payment steps.
  const [flatOffer, setFlatOffer] = useState<FlatOffer | null>(null);
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("promo");
    const offer = getFlatOffer(code);
    if (!offer) return;
    const svc = availableServices.find((s) => s.id === offer.serviceId);
    if (!svc?.variants) return;
    // Pre-select only the offer's service, with one of each required piece.
    const qtys: Record<string, number> = {};
    svc.variants.forEach((v) => {
      qtys[v.id] = offer.requiredVariants.includes(v.id) ? 1 : 0;
    });
    setFlatOffer(offer);
    setSelectedServices([offer.serviceId]);
    setVariantQuantities((prev) => ({ ...prev, [offer.serviceId]: qtys }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Next-business-day label for the topbar's availability line. Set in an effect
  // so the server and first client render agree — it depends on today's date.
  const [bookDate, setBookDate] = useState("");
  const [bookDateShort, setBookDateShort] = useState("");
  useEffect(() => {
    setBookDate(nextBusinessDayLabel());
    setBookDateShort(nextBusinessDayShortLabel());
  }, []);
  // Service whose bottom-sheet configurator is open (mobile). null = closed.
  const [sheetServiceId, setSheetServiceId] = useState<string | null>(null);
  // services3: id of the card expanded inline in the unified grid. null = all collapsed.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Whether the sticky-bar breakdown popover is open.
  const [barOpen, setBarOpen] = useState(false);

  // Emergency & restoration popup.
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyDamage, setEmergencyDamage] = useState<EmergencyDamage | null>(null);
  // Mobile bottom sheets for the emergency and bundle cards.
  const [emergencySheetOpen, setEmergencySheetOpen] = useState(false);
  const [bundleSheetOpen, setBundleSheetOpen] = useState(false);

  // Default carpet selection: base clean (no add-ons) at the model's default
  // room count. Furnished (moveFurniture) is the base; vacancy is opt-in.
  const getCarpetSel = (service: Service): CarpetSel => {
    const stored = carpetSelection[service.id];
    if (stored) return stored;
    return { areas: service.carpetModel!.defaultAreas, addOnIds: [], moveFurniture: true, vacant: false };
  };

  const getRugSel = (service: Service): RugSelection => {
    const stored = rugSelection[service.id];
    if (stored) return stored;
    return defaultRugSelection(service.rugModel!);
  };

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
      return carpetTotal(service.carpetModel, getCarpetSel(service));
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
    return service.unitPrice * quantity;
  };

  // Dollar discount from the active flat offer, given the current selection.
  // 0 unless the offer's service is selected with all its required pieces.
  const getFlatOfferDiscount = (): number => {
    if (!flatOffer || !selectedServices.includes(flatOffer.serviceId)) return 0;
    const svc = availableServices.find((s) => s.id === flatOffer.serviceId);
    if (!svc?.variants) return 0;
    const prices: Record<string, number> = {};
    svc.variants.forEach((v) => {
      prices[v.id] = v.unitPrice;
    });
    return flatOfferDiscount(flatOffer, prices, variantQuantities[flatOffer.serviceId] ?? {});
  };

  const calculateTotalPrice = () => {
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
    setBasePrice(baseTotal);
    return Math.max(0, discountedTotal - getFlatOfferDiscount());
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
      if (service.variants) {
        const defaults: Record<string, number> = {};
        service.variants.forEach((v) => { defaults[v.id] = v.defaultQuantity; });
        setVariantQuantities({ ...variantQuantities, [serviceId]: defaults });
      } else if (service.carpetModel) {
        if (!carpetSelection[serviceId]) {
          setCarpetSelection({
            ...carpetSelection,
            [serviceId]: {
              areas: service.carpetModel.defaultAreas,
              addOnIds: [],
              moveFurniture: true,
              vacant: false,
            },
          });
        }
      } else if (service.rugModel) {
        if (!rugSelection[serviceId]) {
          setRugSelection({
            ...rugSelection,
            [serviceId]: defaultRugSelection(service.rugModel),
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

  // Mobile: add the bundle (if not already) and open its bottom sheet.
  const openBundleSheet = () => {
    if (!selectedServices.includes("healthy-home-bundle")) {
      handleServiceToggle("healthy-home-bundle");
    }
    setBundleSheetOpen(true);
  };

  const handleQuantityChange = (serviceId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
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
      if (!serviceFrequency[serviceId]) {
        setServiceFrequency({ ...serviceFrequency, [serviceId]: "none" });
      }
    } else if (!anyActive && selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    }
  };

  const handleContinueToScheduling = () => {
    if (selectedServices.length > 0) {
      const finalTotal = calculateTotalPrice();

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
        // Tag the checkout as originating from services6 so it can apply the
        // services6-only layout (scheduling first) and CTA copy.
        checkoutFlow: "services6",
        // Carry the flat offer into checkout as a precomputed dollar discount so
        // the customer/payment steps reduce the total to the flat price. Both
        // fields are set: `promoCode` gates the banner, `promo` carries the
        // amount (matching the shape the rest of the pipeline reads).
        ...(flatOffer && getFlatOfferDiscount() > 0
          ? {
              promoCode: flatOffer.code,
              promo: {
                code: flatOffer.code,
                discount: getFlatOfferDiscount(),
                flat: true,
                label: flatOffer.bannerLabel,
              },
            }
          : {}),
        // Normal booking — clear any emergency/commercial no-payment flags.
        emergency: undefined,
        commercial: undefined,
        skipPayment: undefined,
      };
      localStorage.setItem("estimateData", JSON.stringify(updatedData));
      router.push("/estimate/customer5");
    }
  };

  useEffect(() => {
    setTotalPrice(calculateTotalPrice());
  }, [selectedServices, serviceFrequency, serviceQuantities, variantQuantities, carpetSelection, rugSelection, bundleUnits, flatOffer]);


  // --- Emergency callback body ------------------------------------------------
  // Shared between the inline emergency card (desktop list) and the mobile
  // bottom sheet: call CTA, damage-type picker, callback form, confirmation.
  const renderEmergencyBody = () => (
    <>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
        Select damage type
      </p>
      {/* Damage chips + Book + a call button, all on one row. Pick a type, then
          Book drops into the (no-payment) checkout; the icon button dials. */}
      <div className="flex flex-wrap items-stretch gap-2 sm:gap-2.5">
        {(["Water", "Fire", "Mold", "Storm"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setEmergencyDamage(type)}
            className={`flex-1 min-w-[64px] py-2.5 sm:py-3 px-3 rounded-lg text-sm font-bold transition-colors ${
              emergencyDamage === type
                ? "bg-[#152644] text-white"
                : "bg-white text-[#152644] border border-gray-200 hover:border-gray-300"
            }`}
          >
            {type}
          </button>
        ))}
        <button
          type="button"
          disabled={!emergencyDamage}
          onClick={() => emergencyDamage && startEmergencyCheckout(emergencyDamage)}
          className={`px-6 py-2.5 sm:py-3 rounded-lg text-sm font-bold text-white transition-colors ${
            emergencyDamage
              ? "bg-red-500 hover:bg-red-600"
              : "bg-red-300 cursor-not-allowed"
          }`}
        >
          Book
        </button>
        <a
          href="tel:+16083988632"
          aria-label="Call now · (608) 398-8632"
          className="flex items-center justify-center px-3.5 py-2.5 sm:py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
        >
          <PhoneCall className="h-5 w-5" />
        </a>
      </div>
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
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-gray-500 border-gray-200 hover:text-black hover:border-gray-400"
                        disabled={units <= 0}
                        onClick={() => setBundleComponentUnits(service.id, c.id, units - 1)}
                        aria-label={`Fewer ${unitLabel}s`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center text-sm font-bold text-[#152644] tabular-nums">
                        {units}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-gray-500 border-gray-200 hover:text-black hover:border-gray-400"
                        onClick={() => setBundleComponentUnits(service.id, c.id, units + 1)}
                        aria-label={`More ${unitLabel}s`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
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

  // Configurator body for the add-on services (carpet is the hero card, and
  // configures itself inline — it never opens a sheet).
  const renderSheetConfig = (service: Service) => {
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
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    disabled={vqty <= 0}
                    onClick={() => setVariantQty(service.id, variant.id, vqty - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-7 text-center text-sm font-semibold tabular-nums">{vqty}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setVariantQty(service.id, variant.id, vqty + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
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
                onClick={() =>
                  setVariantQuantities({
                    ...variantQuantities,
                    [service.id]: {
                      ...variantQuantities[service.id],
                      [variant.id]: isActive ? 0 : 1,
                    },
                  })
                }
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
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 text-gray-500 border-gray-200 hover:text-black hover:border-gray-400"
                onClick={() => decrementQuantity(service.id)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                value={serviceQuantities[service.id] || service.defaultQuantity}
                onChange={(e) =>
                  handleQuantityChange(service.id, Number.parseInt(e.target.value) || 1)
                }
                className="w-16 h-9 text-center text-sm font-semibold border-gray-200"
                style={{ borderRadius: 0 }}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 text-gray-500 border-gray-200 hover:text-black hover:border-gray-400"
                onClick={() => incrementQuantity(service.id)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
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

  // services6: cross-sell surfaced directly under the carpet hero — every
  // bookable service (minus the carpet hero and the bundle, which lead the grid).
  const POPULAR_IDS = [
    "dryer-vent-cleaning",
    "upholstery-cleaning",
    "rugs",
    "air-duct-cleaning",
    "tile-grout-stone",
    "hardwood-detailing",
    "routine-floor-care",
    "odor-spot-control",
  ];
  // --- services3: unified expandable image grid -----------------------------
  // Representative "from" price shown on a collapsed service tile.
  const previewPrice = (service: Service): number => {
    if (isBundleService(service)) {
      return getBundleTotal(service, getBundleUnitsMap(service));
    }
    if (service.carpetModel) {
      const m = service.carpetModel;
      // Cheapest per-room quote: base clean of a vacant room, no upgrades.
      return carpetPricePerRoom(m, { areas: 1, addOnIds: [] });
    }
    if (service.rugModel) {
      const m = service.rugModel;
      return m.sizes.find((s) => s.id === m.defaultSizeId)?.pricePerRug ?? 0;
    }
    if (service.variants) {
      const prices = service.variants.map((v) => v.unitPrice).filter((p) => p > 0);
      return prices.length ? Math.min(...prices) : service.unitPrice;
    }
    return service.unitPrice;
  };

  const isDesktop = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches;

  // Open a card's configurator in a consistent place: a centered modal on
  // desktop, a services2-style bottom sheet on mobile.
  const openConfig = (id: string) => {
    if (isDesktop()) {
      setExpandedId(id);
      return;
    }
    if (id === "emergency") setEmergencySheetOpen(true);
    else if (id === "healthy-home-bundle") setBundleSheetOpen(true);
    else setSheetServiceId(id);
  };

  // Tapping a collapsed tile: select + open config if new, deselect if already
  // in the estimate.
  const openService = (service: Service) => {
    if (selectedServices.includes(service.id)) {
      handleServiceToggle(service.id);
      return;
    }
    handleServiceToggle(service.id);
    openConfig(service.id);
  };

  const openEmergency = (damage?: EmergencyDamage) => {
    if (damage) setEmergencyDamage(damage);
    openConfig("emergency");
  };

  // Deep link into the emergency flow: `/?emergency=1` (or a specific type,
  // `?emergency=Water|Fire|Mold|Storm`) opens the Emergency & Restoration card
  // on load. Used by the /landing restoration ribbon so "Get emergency help"
  // lands the visitor straight on the emergency/restoration flow.
  useEffect(() => {
    const val = new URLSearchParams(window.location.search).get("emergency");
    if (!val) return;
    const types: EmergencyDamage[] = ["Water", "Fire", "Mold", "Storm"];
    const match = types.find((t) => t.toLowerCase() === val.toLowerCase());
    openEmergency(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Emergency / restoration uses a no-payment checkout: stash the damage type
  // and a skipPayment flag, then drop the visitor into the normal checkout flow
  // (which collects address, phone, and scheduling) but skips the payment step.
  const startEmergencyCheckout = (damage: EmergencyDamage) => {
    const stored = JSON.parse(localStorage.getItem("estimateData") || "{}");
    localStorage.setItem(
      "estimateData",
      JSON.stringify({
        ...stored,
        checkoutFlow: "services6",
        // Emergency is standalone — start with an empty cart so no previously
        // selected services carry into the checkout. Clear any commercial flag.
        services: { selectedServices: [], totalPrice: 0 },
        emergency: { damageType: damage },
        commercial: undefined,
        noService: undefined,
        skipPayment: true,
      }),
    );
    router.push("/estimate/customer5");
  };

  // Commercial inquiries follow the same no-payment checkout path as emergency:
  // the team scopes the job and quotes it, so there's nothing to charge yet.
  const startCommercialInquiry = () => {
    const stored = JSON.parse(localStorage.getItem("estimateData") || "{}");
    localStorage.setItem(
      "estimateData",
      JSON.stringify({
        ...stored,
        checkoutFlow: "services6",
        services: { selectedServices: [], totalPrice: 0 },
        commercial: true,
        emergency: undefined,
        noService: undefined,
        skipPayment: true,
      }),
    );
    router.push("/estimate/customer5");
  };

  // Skip service selection entirely: book a visit and let the team scope the
  // work on site. Same no-payment checkout path as commercial.
  const startVisitWithoutService = () => {
    const stored = JSON.parse(localStorage.getItem("estimateData") || "{}");
    localStorage.setItem(
      "estimateData",
      JSON.stringify({
        ...stored,
        checkoutFlow: "services6",
        services: { selectedServices: [], totalPrice: 0 },
        noService: true,
        commercial: undefined,
        emergency: undefined,
        skipPayment: true,
      }),
    );
    router.push("/estimate/customer5");
  };


  // services6: the carpet card is the hero — always visible, pre-configured.
  // It shows the live room math inline (no silent per-room → total jump) with a
  // room stepper, the vacant-rooms discount, and the two add-ons, all inline: the
  // customer never leaves the card to configure the clean.
  //
  // ── How this card's price is built ────────────────────────────────────────
  // The number the customer sees is `carpetTotal(model, sel)` (see the helpers
  // near the top of this file). It is assembled bottom-up from `carpetModel`
  // in lib/carpet.ts. Worked through with the current model values:
  //
  //   1. Base per-room clean = ratePerSqft × sqftPerArea
  //        = $0.45 × 150 sq ft = $67.50 per room.
  //      (1 room ≡ 1 "area" ≡ 150 sq ft; `defaultAreas` = 3 rooms on load.)
  //
  //   2. Add-ons (CARPET_ADDONS above — the two ticks on the card). Each maps to
  //      an underlying model add-on and, because both are `unit: "area"`, adds a
  //      flat per-room amount (a `unit: "sqft"` add-on would instead scale by
  //      sqftPerArea — see carpetAddOnPricePerArea):
  //        • "Stain removal"    → s6-stain-removal      = +$71 / room
  //        • "Pet odor removal" → s6-pet-odor-control   = +$127 / room
  //      Per-area price = base $67.50 + every selected add-on
  //        (carpetPricePerArea).
  //
  //   3. Per-room price (carpetPricePerRoom) = per-area price − furniture fee.
  //      The base is quoted furnished, so on services6 `moveFurniture` stays
  //      true and NOTHING is subtracted here. Only a hypothetical
  //      moveFurniture=false would knock off CARPET_FURNITURE_FEE_PER_AREA ($2.50).
  //
  //   4. Total (carpetTotal) = per-room price × number of rooms (`sel.areas`,
  //      driven by the stepper) − the vacant-rooms discount.
  //
  //   5. Vacant discount (s6VacantDiscount, lib/carpet.ts) is a FLAT per-booking
  //      amount, not per room, and only applies when the "rooms are vacant" toggle
  //      is on AND more than one room is booked:
  //        • $50 if any card add-on is selected
  //        • $20 otherwise
  //      `availableVacantDiscount` below previews it before it's ticked so the
  //      saving is visible from load.
  //
  //   Example: 3 rooms, base clean, vacant unchecked, no add-ons
  //     = 3 × $67.50 − $0 = $202.50.
  //   Example: 3 rooms + stain removal, vacant checked
  //     = 3 × ($67.50 + $71) − $50 = 3 × $138.50 − $50 = $365.50.
  //
  //   Note: `baseRate` below is carpetPricePerArea(model, []) = the $67.50 base
  //   per-room rate shown in the headline; add-ons and the vacant discount roll
  //   up into the "+ extras" line rather than into that headline number. The same
  //   helpers feed checkout (via the seeded carpetSelection state), so the card
  //   quote and the booking price stay in lockstep.
  // ──────────────────────────────────────────────────────────────────────────
  const renderCarpetHero = () => {
    const service = availableServices.find((s) => s.id === "carpet-cleaning");
    if (!service?.carpetModel) return null;
    const sel = getCarpetSel(service);
    const total = carpetTotal(service.carpetModel, sel);
    const setSel = (next: CarpetSel) =>
      setCarpetSelection({ ...carpetSelection, [service.id]: next });
    const added = selectedServices.includes(service.id);

    // The book page's own CTA: add/remove the pre-selected service inline.
    const footer = added ? (
      <div className="hero-added">
        <span className="ha-txt">
          <Check className="h-4 w-4" strokeWidth={3} /> Added to your booking
        </span>
        <button
          type="button"
          className="ha-remove"
          onClick={() => handleServiceToggle(service.id)}
        >
          Remove
        </button>
      </div>
    ) : (
      <button
        type="button"
        className="btn btn-cta hero-book"
        onClick={() => handleServiceToggle(service.id)}
      >
        + Add · {formatPrice(total)}
      </button>
    );

    return (
      <CarpetConfigurator
        model={service.carpetModel}
        name={service.name}
        description={service.description}
        sel={sel}
        onChange={setSel}
        showMostBooked
        footer={footer}
      />
    );
  };

  // services6: a refined-light add-on card. Tapping it adds the service (and
  // opens its configurator popup if it needs one).
  const renderAddOn = (service: Service) => {
    const isSel = selectedServices.includes(service.id);
    const Icon = service.icon;
    const meta = SVC_META[service.id];
    return (
      <button
        key={service.id}
        type="button"
        onClick={() => openService(service)}
        aria-pressed={isSel}
        className={`addon-card${isSel ? " on" : ""}`}
      >
        <span className="a-check">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <span className="addon-ic">{Icon && <Icon className="h-[21px] w-[21px]" strokeWidth={2} />}</span>
        <div className="a-name">{service.name}</div>
        <div className="a-desc">{meta?.blurb ?? service.description}</div>
        <div className="a-foot">
          <span className="a-price">
            <span className="f">from </span>
            {formatPrice(previewPrice(service))}
          </span>
          <span className="a-add">
            {isSel ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={3} /> Added
              </>
            ) : (
              "+ Add"
            )}
          </span>
        </div>
      </button>
    );
  };

  // Desktop configurator: a single centered modal (one consistent place for
  // every card). Mobile uses the bottom sheets below instead.
  const renderDesktopModal = () => {
    if (!expandedId) return null;
    const close = () => setExpandedId(null);

    let body: JSX.Element | null = null;
    if (expandedId === "emergency") {
      body = (
        <>
          <div className="flex items-start justify-between gap-3 border-b border-red-100 bg-red-50 px-6 pt-5 pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white shrink-0 shadow-sm">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-[#152644] leading-tight">
                  Emergency &amp; Restoration
                </h3>
                <p className="mt-0.5 text-xs text-gray-600 leading-snug">
                  Water, fire, storm or mold damage? We&apos;re here 24/7.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 text-gray-600 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{renderEmergencyBody()}</div>
        </>
      );
    } else if (expandedId === "healthy-home-bundle" && bundleService) {
      body = (
        <>
          <div className="flex justify-end px-4 pt-3">
            <button
              type="button"
              onClick={() => {
                if (selectedServices.includes(bundleService.id)) {
                  handleServiceToggle(bundleService.id);
                }
                close();
              }}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-2">
            {renderBundleCard(bundleService)}
          </div>
          <div className="border-t border-gray-200 px-6 py-4">
            <Button
              type="button"
              onClick={close}
              className="w-full bg-[#152644] hover:bg-[#152644]/90 text-white font-semibold rounded-lg h-11"
            >
              Done
            </Button>
          </div>
        </>
      );
    } else {
      const svc = availableServices.find((s) => s.id === expandedId);
      if (!svc) return null;
      const svcTotal = Math.round(
        getServiceBasePrice(svc) *
          frequencyMultiplier(serviceFrequency[svc.id] ?? "none"),
      );
      body = (
        <>
          <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-6 pt-5 pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-[#152644] leading-tight">{svc.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5">
                  {svc.unitLabel}
                </span>
              </div>
              {svc.description && (
                <p className="mt-1.5 text-sm text-gray-600 leading-snug">{svc.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (selectedServices.includes(svc.id)) handleServiceToggle(svc.id);
                close();
              }}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{renderSheetConfig(svc)}</div>
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (selectedServices.includes(svc.id)) handleServiceToggle(svc.id);
                close();
              }}
              className="px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg hover:text-[#152644] hover:border-gray-400"
            >
              Remove
            </button>
            <div className="flex items-center gap-4">
              <div className="text-right leading-tight">
                <span className="block text-[11px] text-gray-500">Estimated</span>
                <span className="text-2xl font-bold text-[#152644] tabular-nums">
                  {formatPrice(svcTotal)}
                </span>
              </div>
              <Button
                type="button"
                onClick={close}
                className="bg-[#152644] hover:bg-[#152644]/90 text-white font-semibold rounded-lg h-11 px-6"
              >
                Done
              </Button>
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="hidden lg:flex fixed inset-0 z-[60] items-center justify-center p-6">
        <div className="absolute inset-0 bg-[#14253E]/45" onClick={close} />
        <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {body}
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="svc6">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-inner container mx-auto px-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/voda-logo.svg"
              alt="Voda Cleaning & Restoration"
              width={140}
              height={36}
              className="logo"
            />
          </Link>
          <span className="step-pill">Step 1 of 3</span>
          {/* Secondary paths (desktop only; below lg they live in the column
              instead, where the navbar has no room): the earliest-appointment
              pill with the skip-to-schedule button, then the commercial link. */}
          <div className="util">
            {/* Empty until the effect runs, so it never renders a stale
                build-time date. */}
            {bookDate && (
              <div className="appt-pill">
                <span className="appt-ic">
                  <CalendarCheck className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <div className="appt-txt">
                  <div className="appt-lbl">Earliest appointment</div>
                  <div className="appt-date">
                    <span className="appt-dot" />
                    {bookDate}
                  </div>
                </div>
                <button type="button" className="appt-cta" onClick={startVisitWithoutService}>
                  Skip to schedule
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <span className="util-div" aria-hidden="true" />

            <button type="button" className="commercial-link" onClick={startCommercialInquiry}>
              <Building2 className="h-[17px] w-[17px]" strokeWidth={2} />
              Commercial?
            </button>
          </div>
        </div>
      </header>

      {flatOffer && <PromoBanner label={flatOffer.bannerLabel} />}

      <div className="main">
        <div className="pane">
          {/* Restoration card — the whole row opens the popup,
              where the customer picks a damage type and books (or calls). */}
          <RestorationStrip onBook={() => openEmergency()} />

        <div className="conv-wrap">
          <h1 className="sr-only">
            Book {business.primaryService.toLowerCase()} in {business.city}, {business.state} — {business.brandName}
          </h1>

          {/* Head */}
          <div className="conv-head">
            <div className="head-text">
              <h1>Book your cleaning</h1>
              <p>Start with our most-booked service.</p>
            </div>
          </div>

          {/* Carpet cleaning — the pre-configured hero */}
          {renderCarpetHero()}

          {/* Popular services */}
          <div className="addons">
            <div className="addons-head">
              <h3>Popular Services</h3>
              <span>— add to your visit and save a trip</span>
            </div>
            <div className="addons-grid">
              {bundleService && renderAddOn(bundleService)}
              {POPULAR_IDS.map((id) => {
                const svc = availableServices.find((s) => s.id === id);
                return svc ? renderAddOn(svc) : null;
              })}
            </div>
          </div>

          {/* Secondary paths, deliberately quiet: both skip service selection and
              land in the no-payment checkout, so they must not compete with the
              carpet hero or the sticky CTA. Text links, not cards. */}
          <div className="alt-paths">
            <button type="button" className="alt-link" onClick={startVisitWithoutService}>
              <CalendarCheck className="h-[15px] w-[15px]" />
              <span>
                Not sure what you need? <b>Book a visit</b> — we&apos;ll scope it on site
              </span>
            </button>
            <span className="alt-sep" aria-hidden="true" />
            <button type="button" className="alt-link" onClick={startCommercialInquiry}>
              <Building2 className="h-[15px] w-[15px]" />
              <span>
                Commercial property? <b>Request a quote</b>
              </span>
            </button>
          </div>
        </div>

        {/* Sticky summary bar */}
        {selectedServices.length > 0 &&
          (() => {
            // A flat offer (e.g. the $149 upholstery deal) is a promotional
            // exception to the standard service minimum, so it never gates.
            const belowMinimum = !flatOffer && totalPrice < SERVICE_MINIMUM;
            const remaining = Math.max(0, SERVICE_MINIMUM - totalPrice);
            const progressPct = flatOffer ? 100 : Math.min(100, (totalPrice / SERVICE_MINIMUM) * 100);
            const breakdown = selectedServices
              .map((id) => {
                const s = availableServices.find((x) => x.id === id);
                if (!s) return null;
                const price = Math.round(
                  getServiceBasePrice(s) * frequencyMultiplier(serviceFrequency[id] ?? "none"),
                );
                let detail = "";
                if (s.carpetModel) {
                  const cs = getCarpetSel(s);
                  detail = `${cs.areas} ${cs.areas === 1 ? "room" : "rooms"}`;
                } else if (s.rugModel) {
                  const n = totalRugCount(getRugSel(s));
                  detail = `${n} ${n === 1 ? "rug" : "rugs"}`;
                } else if (isBundleService(s)) {
                  detail = "Whole home";
                }
                return { id, name: s.name, detail, price };
              })
              .filter(Boolean) as { id: string; name: string; detail: string; price: number }[];

            return (
              <div className="sbar">
                <div className="sbar-track">
                  <div className="fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="sbar-inner">
                  <div className={`sbar-total${barOpen ? " open" : ""}`}>
                    {barOpen && (
                      <div className="sbar-pop fade-in" onClick={(e) => e.stopPropagation()}>
                        <h4>Your booking</h4>
                        {breakdown.map((i) => (
                          <div key={i.id} className="li">
                            <span>
                              <span className="n">{i.name}</span>
                              {i.detail && <span className="d">{i.detail}</span>}
                            </span>
                            <span className="p">{formatPrice(i.price)}</span>
                          </div>
                        ))}
                        {flatOffer && getFlatOfferDiscount() > 0 && (
                          <div className="li">
                            <span>
                              <span className="n" style={{ color: "#1f9d62" }}>New-customer offer</span>
                              <span className="d">{flatOffer.code}</span>
                            </span>
                            <span className="p" style={{ color: "#1f9d62" }}>
                              -{formatPrice(getFlatOfferDiscount())}
                            </span>
                          </div>
                        )}
                        <div className="tot">
                          <span className="n">Total</span>
                          <span className="p">{formatPrice(totalPrice)}</span>
                        </div>
                      </div>
                    )}
                    <button type="button" className="lbl" onClick={() => setBarOpen((o) => !o)}>
                      {selectedServices.length} {selectedServices.length === 1 ? "service" : "services"}
                      <ChevronDown className="chev h-3.5 w-3.5" />
                    </button>
                    <div className="amt-row">
                      <span className="amt">{formatPrice(totalPrice)}</span>
                      <span className={`min ${belowMinimum ? "miss" : "met"}`}>
                        {belowMinimum ? `Min ${formatPrice(SERVICE_MINIMUM)}` : "Minimum met"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-cta sbar-cta"
                    disabled={belowMinimum}
                    onClick={handleContinueToScheduling}
                  >
                    {belowMinimum ? (
                      `Add ${formatPrice(remaining)} to continue`
                    ) : (
                      <span className="cta-stack">
                        <span className="cta-main">See available times</span>
                        {/* Empty until the effect runs — the date depends on today. */}
                        {bookDateShort && (
                          <span className="cta-date">Earliest {bookDateShort}</span>
                        )}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Mobile bottom-sheet configurator for an add-on service. */}
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
                    onClick={() => {
                      if (selectedServices.includes(sheetService.id)) {
                        handleServiceToggle(sheetService.id);
                      }
                      setSheetServiceId(null);
                    }}
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
                onClick={() => {
                  if (selectedServices.includes("healthy-home-bundle")) {
                    handleServiceToggle("healthy-home-bundle");
                  }
                  setBundleSheetOpen(false);
                }}
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

      <Footer />
    </div>

    {/* Desktop configurator modal — rendered outside .svc6 so its Tailwind
        styling isn't affected by the design system's element resets. */}
    {renderDesktopModal()}
    </>
  );
}
