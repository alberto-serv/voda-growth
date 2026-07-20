"use client";
import "./voda-design.css";
import { Footer } from "@/components/footer";
import { TrustSignals } from "@/components/trust-signals";
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
  List,
  X,
  RefreshCw,
  CalendarCheck,
  AlertTriangle,
  ChevronDown,
  Building2,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { business } from "@/lib/business";
import { Check } from "lucide-react";
import {
  carpetModel,
  CARPET_FURNITURE_FEE_PER_AREA,
  type CarpetPricingModel,
  type CarpetAddOn,
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
      "Deep steam cleaning with non-toxic solutions to remove dirt, stains, and allergens—fast drying, safe for homes and pets.",
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
    defaultQuantity: 1,
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
    defaultQuantity: 1,
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
    unitPrice: 50.0,
    defaultQuantity: 1,
    unit: "vent",
    unitLabel: "per vent",
    icon: Fan,
    allowCustomQuantity: false,
    position: { x: 340, y: 920 },
    labelPosition: "above",
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

type EmergencyDamage = "Water" | "Fire" | "Mold" | "Storm";

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
};

// services5 carpet pricing (mirrors /services4): the customer starts at the
// base steam clean and ticks à-la-carte upgrades — no Bronze/Silver/Gold tiers.
// The selection carries the chosen add-on ids plus a move-furniture flag.
type CarpetSel = { areas: number; addOnIds: string[]; moveFurniture?: boolean };

// Add-ons are grouped into two upgrade packages so the card stays simple — the
// customer starts at the base clean and ticks at most two boxes.
const CARPET_PACKAGES: { id: string; name: string; addOnIds: string[] }[] = [
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

const carpetPackageActive = (sel: CarpetSel, addOnIds: string[]): boolean =>
  addOnIds.every((id) => sel.addOnIds.includes(id));

// Per-area price = base steam clean + every selected add-on.
const carpetPricePerArea = (model: CarpetPricingModel, addOnIds: string[]): number =>
  model.ratePerSqft * model.sqftPerArea +
  model.addOns
    .filter((a) => addOnIds.includes(a.id))
    .reduce((sum, a) => sum + carpetAddOnPricePerArea(model, a), 0);

// Per-room price. The base clean is quoted for a vacant room; "move furniture"
// (furnished) adds the per-room surcharge back on.
const carpetPricePerRoom = (model: CarpetPricingModel, sel: CarpetSel): number =>
  carpetPricePerArea(model, sel.addOnIds) -
  (sel.moveFurniture ? 0 : CARPET_FURNITURE_FEE_PER_AREA);

// Carpet total = per-room price × number of rooms.
const carpetTotal = (model: CarpetPricingModel, sel: CarpetSel): number =>
  sel.areas * carpetPricePerRoom(model, sel);

export default function ServicesPage() {
  const router = useRouter();
  // services5: the carpet card is the always-visible hero and loads
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
  const [carpetSelection, setCarpetSelection] = useState<Record<string, CarpetSel>>({});
  const [rugSelection, setRugSelection] = useState<Record<string, RugSelection>>({});
  // Customer-chosen quantities for unit-priced bundle components, keyed by
  // `${serviceId}:${componentId}` (e.g. how many vents in the bundle).
  const [bundleUnits, setBundleUnits] = useState<Record<string, number>>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [serviceFrequency, setServiceFrequency] = useState<Record<string, ServiceFrequency>>({ "carpet-cleaning": "none" });
  // Mobile-only toggle between the House (pills) view and the List (cards) view.
  // Desktop always shows both panes, so this is ignored at md+.
  const [mobileView, setMobileView] = useState<"house" | "list">("house");
  // Service whose bottom-sheet configurator is open (mobile House view). null = closed.
  const [sheetServiceId, setSheetServiceId] = useState<string | null>(null);
  // services3: id of the card expanded inline in the unified grid. null = all collapsed.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // services5: whether the full "All services" menu accordion is open.
  const [menuOpen, setMenuOpen] = useState(false);
  // Whether the sticky-bar breakdown popover is open.
  const [barOpen, setBarOpen] = useState(false);

  // Emergency & restoration popup.
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyDamage, setEmergencyDamage] = useState<EmergencyDamage | null>(null);
  // Mobile bottom sheets for the emergency and bundle cards.
  const [emergencySheetOpen, setEmergencySheetOpen] = useState(false);
  const [bundleSheetOpen, setBundleSheetOpen] = useState(false);


  // Default carpet selection: base clean (no add-ons) at the model's default
  // room count. Furnished is the common case, so move-furniture starts on.
  const getCarpetSel = (service: Service): CarpetSel => {
    const stored = carpetSelection[service.id];
    if (stored) return stored;
    return { areas: service.carpetModel!.defaultAreas, addOnIds: [], moveFurniture: true };
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
        // Tag the checkout as originating from services5 so it can apply the
        // services5-only layout (scheduling first) and CTA copy.
        checkoutFlow: "services5",
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
  }, [selectedServices, serviceFrequency, serviceQuantities, variantQuantities, carpetSelection, rugSelection, bundleUnits]);


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

  // Shared carpet upgrades UI (mirrors /services4): the "move light furniture"
  // toggle plus the optional à-la-carte upgrade packages. Used by the hero card
  // and any configurator sheet. `stop` prevents a click from bubbling to a
  // parent card toggle.
  // Refined-light option row (checkbox + label + price) used by the carpet
  // configurator inside the popup. Cyan highlight when selected.
  const optRow = (
    on: boolean,
    title: string,
    price: string,
    onClick: (e: React.MouseEvent) => void,
    key?: string,
  ) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`w-full text-left flex items-center gap-3 rounded-xl border-[1.5px] px-[15px] py-[13px] transition-all ${
        on
          ? "border-[#03D9E5] bg-[#f2fdfe] shadow-[0_0_0_1.5px_#03D9E5]"
          : "border-gray-200 bg-white hover:border-[#06b3bd]"
      }`}
    >
      <span
        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-2 transition-colors ${
          on ? "bg-[#152644] border-[#152644] text-white" : "border-gray-200 bg-white text-white"
        }`}
      >
        {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1 text-[14.5px] font-bold text-[#152644]">{title}</span>
      <span className="shrink-0 whitespace-nowrap text-[14.5px] font-bold tabular-nums text-[#152644]">
        {price}
      </span>
    </button>
  );

  const renderCarpetConfig = (
    model: CarpetPricingModel,
    sel: CarpetSel,
    setSel: (next: CarpetSel) => void,
    stop = false,
  ) => {
    const movePrice = `+$${
      CARPET_FURNITURE_FEE_PER_AREA % 1 === 0
        ? CARPET_FURNITURE_FEE_PER_AREA
        : CARPET_FURNITURE_FEE_PER_AREA.toFixed(2)
    }/room`;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 text-[14.5px] font-semibold text-[#152644]">
          <Check className="h-4 w-4 shrink-0 text-[#1f9d62]" strokeWidth={3} />
          Base steam clean included
        </div>

        {optRow(
          !!sel.moveFurniture,
          "Move light furniture during cleaning",
          movePrice,
          (e) => {
            if (stop) e.stopPropagation();
            setSel({ ...sel, moveFurniture: !sel.moveFurniture });
          },
        )}

        <div className="pt-1">
          <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-gray-400">
            Upgrades{" "}
            <span className="normal-case tracking-normal text-gray-400">(optional)</span>
          </span>
          <div className="mt-2.5 space-y-2.5">
            {CARPET_PACKAGES.map((pkg) => {
              const active = carpetPackageActive(sel, pkg.addOnIds);
              const each = carpetPackagePricePerArea(model, pkg.addOnIds);
              return optRow(
                active,
                pkg.name,
                `+${formatPrice(each)}/room`,
                (e) => {
                  if (stop) e.stopPropagation();
                  const next = active
                    ? sel.addOnIds.filter((id) => !pkg.addOnIds.includes(id))
                    : [
                        ...sel.addOnIds,
                        ...pkg.addOnIds.filter((id) => !sel.addOnIds.includes(id)),
                      ];
                  setSel({ ...sel, addOnIds: next });
                },
                pkg.id,
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderSheetConfig = (service: Service) => {
    // Carpet — rooms + base clean + optional upgrades + frequency
    if (service.carpetModel) {
      const carpet = service.carpetModel;
      const sel = getCarpetSel(service);
      const setSel = (next: CarpetSel) =>
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

  // services5: cross-sell surfaced directly under the carpet hero — the services
  // most often added to a carpet clean.
  const ADDON_IDS = [
    "dryer-vent-cleaning",
    "upholstery-cleaning",
    "rugs",
    "air-duct-cleaning",
  ];
  // Every bookable service except the carpet hero — the full menu that lives,
  // collapsed, under the "All services" accordion.
  const menuServices = availableServices.filter(
    (s) => s.id !== "carpet-cleaning" && !isBundleService(s),
  );
  // Services shown in the "All other services" dropdown: everything in the menu
  // that isn't one of the popular add-ons surfaced above.
  const otherServices = menuServices.filter((s) => !ADDON_IDS.includes(s.id));
  // Count on the dropdown label: the other services plus the bundle row.
  const otherCount = otherServices.length + (bundleService ? 1 : 0);

  // --- services3: unified expandable image grid -----------------------------
  // Representative "from" price shown on a collapsed service tile.
  const previewPrice = (service: Service): number => {
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

  const openBundleCard = () => {
    if (selectedServices.includes("healthy-home-bundle")) {
      handleServiceToggle("healthy-home-bundle");
      return;
    }
    handleServiceToggle("healthy-home-bundle");
    openConfig("healthy-home-bundle");
  };

  const openEmergency = (damage?: EmergencyDamage) => {
    if (damage) setEmergencyDamage(damage);
    openConfig("emergency");
  };

  // Emergency / restoration uses a no-payment checkout: stash the damage type
  // and a skipPayment flag, then drop the visitor into the normal checkout flow
  // (which collects address, phone, and scheduling) but skips the payment step.
  const startEmergencyCheckout = (damage: EmergencyDamage) => {
    const stored = JSON.parse(localStorage.getItem("estimateData") || "{}");
    localStorage.setItem(
      "estimateData",
      JSON.stringify({
        ...stored,
        checkoutFlow: "services5",
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
        checkoutFlow: "services5",
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
        checkoutFlow: "services5",
        services: { selectedServices: [], totalPrice: 0 },
        noService: true,
        commercial: undefined,
        emergency: undefined,
        skipPayment: true,
      }),
    );
    router.push("/estimate/customer5");
  };


  // services5: the carpet card is the hero — always visible, pre-configured.
  // It shows the live room math inline (no silent per-room → total jump) with a
  // room stepper, and a row to open the full service-level configurator.
  const renderCarpetHero = () => {
    const service = availableServices.find((s) => s.id === "carpet-cleaning");
    if (!service?.carpetModel) return null;
    const carpet = service.carpetModel;
    const sel = getCarpetSel(service);
    const perRoom = carpetPricePerRoom(carpet, sel);
    const total = carpetTotal(carpet, sel);
    const setSel = (next: CarpetSel) =>
      setCarpetSelection({ ...carpetSelection, [service.id]: next });
    const setAreas = (n: number) => setSel({ ...sel, areas: Math.max(1, n) });
    const added = selectedServices.includes(service.id);
    const roomWord = sel.areas === 1 ? "room" : "rooms";

    // Summary of the upgrades chosen in the popup, shown on the "customize" row.
    const extras: string[] = [];
    if (sel.moveFurniture) extras.push("Move furniture");
    CARPET_PACKAGES.forEach((p) => {
      if (carpetPackageActive(sel, p.addOnIds)) extras.push(p.name);
    });
    const summary = extras.length
      ? extras.join(" · ")
      : "Move furniture & optional upgrades";

    return (
      <section className="hero">
        <div className="hero-band">
          <div className="badge-row">
            <span className="badge-most">
              <Sparkles className="h-3 w-3" strokeWidth={2.5} /> Most booked
            </span>
          </div>
          <h2 className="hero-title">{service.name}</h2>
          <p className="hero-desc">
            {service.description}
            {service.disclaimer && <span className="sqft"> {service.disclaimer}</span>}
          </p>
        </div>

        <div className="price-block">
          <span className="price-amt">{formatPrice(total)}</span>
          <span className="price-sub">
            {sel.areas} {roomWord} × {formatPrice(perRoom)} ·{" "}
            <b>every visit includes {formatPrice(SERVICE_MINIMUM)} of service</b>
          </span>
        </div>

        <div className="hero-body">
          <div className="rooms-row">
            <span className="r-lbl">
              <b>How many rooms?</b>
              {service.disclaimer && <span>{service.disclaimer}</span>}
            </span>
            <div className="stepper">
              <button
                type="button"
                onClick={() => setAreas(sel.areas - 1)}
                disabled={sel.areas <= 1}
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
          </div>

          {/* Move-furniture + upgrades are chosen in the popup configurator */}
          <button type="button" className="config-row" onClick={() => openConfig("carpet-cleaning")}>
            <span className="cr-main">
              <span className="cr-t">Customize your clean</span>
              <span className="cr-s">{summary}</span>
            </span>
            <ChevronDown className="cr-chev h-5 w-5 -rotate-90" />
          </button>

          {added ? (
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
          )}
        </div>
      </section>
    );
  };

  // services5: a refined-light add-on card. Tapping it adds the service (and
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

  // A row in the "All other services" dropdown (icon + name + blurb + price).
  const renderServiceRow = (service: Service) => {
    const isSel = selectedServices.includes(service.id);
    const Icon = service.icon;
    const meta = SVC_META[service.id];
    return (
      <button
        key={service.id}
        type="button"
        onClick={() => openService(service)}
        aria-pressed={isSel}
        className={`svc-row${isSel ? " on" : ""}`}
      >
        <span className="svc-ic">{Icon && <Icon className="h-5 w-5" strokeWidth={2} />}</span>
        <span className="svc-main">
          <span className="svc-name">{service.name}</span>
          <span className="svc-desc">{meta?.blurb ?? service.description}</span>
          {meta?.cadence && (
            <span className="svc-cadence">
              <CalendarCheck className="h-3 w-3" /> {meta.cadence}
            </span>
          )}
        </span>
        <span className="svc-right">
          <span className="svc-price">
            <span className="f">from</span> {formatPrice(previewPrice(service))}
          </span>
          <span className="svc-add">
            {isSel ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={3} /> Added
              </>
            ) : (
              "+ Add"
            )}
          </span>
        </span>
      </button>
    );
  };

  // The Healthy Home bundle, rendered as a highlighted service row.
  const renderBundleRow = (service: Service) => {
    const isSel = selectedServices.includes(service.id);
    const total = getBundleTotal(service, getBundleUnitsMap(service));
    return (
      <button
        key={service.id}
        type="button"
        onClick={openBundleCard}
        aria-pressed={isSel}
        className={`svc-row${isSel ? " on" : ""}`}
      >
        <span className="svc-ic">
          <Sparkles className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="svc-main">
          <span className="svc-name">
            {service.name}
            <span className="ml-2 rounded-full bg-[#e8f6ee] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[#1f9d62]">
              Save 15%
            </span>
          </span>
          <span className="svc-desc">Carpet + whole-home vents + upholstery, priced together.</span>
        </span>
        <span className="svc-right">
          <span className="svc-price">
            <span className="f">from</span> {formatPrice(total)}
          </span>
          <span className="svc-add">
            {isSel ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={3} /> Added
              </>
            ) : (
              "+ Add"
            )}
          </span>
        </span>
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
    <div className="svc5">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-inner">
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
          <div className="util">
            <a className="util-link" href="tel:+16083988632">
              <PhoneCall className="ic h-[15px] w-[15px]" /> (608) 398-8632
            </a>
          </div>
        </div>
      </header>

      {/* Emergency strip — text opens the call-or-book popup; button dials. */}
      <div className="emg-strip">
        <div className="emg-inner">
          <button
            type="button"
            className="emg-txt"
            onClick={() => openEmergency()}
            aria-label="Emergency & Restoration — call or book online"
          >
            <AlertTriangle className="h-[18px] w-[18px]" strokeWidth={2.5} />
            <b>Emergency?</b>
            <span className="emg-sub">Water · fire · mold — 24/7</span>
          </button>
          <a className="emg-call" href="tel:+16083988632">
            <PhoneCall className="h-4 w-4" /> Call now
          </a>
        </div>
      </div>

      <div className="main">
        <div className="conv-wrap">
          <h1 className="sr-only">
            Book {business.primaryService.toLowerCase()} in {business.city}, {business.state} — {business.brandName}
          </h1>

          {/* Head */}
          <div className="conv-head">
            <div className="head-text">
              <h1>Book your cleaning</h1>
              <p>Start with our most-booked service — no charge until after your appointment.</p>
            </div>
          </div>

          {/* Carpet cleaning — the pre-configured hero */}
          {renderCarpetHero()}

          {/* Popular add-ons */}
          <div className="addons">
            <div className="addons-head">
              <h3>Popular add-ons</h3>
              <span>— add to your visit and save a trip</span>
            </div>
            <div className="addons-grid">
              {ADDON_IDS.map((id) => {
                const svc = availableServices.find((s) => s.id === id);
                return svc ? renderAddOn(svc) : null;
              })}
            </div>
          </div>

          {/* All other services — collapsible list of service rows */}
          <div className="more">
            <button
              type="button"
              className={`more-toggle${menuOpen ? " open" : ""}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
            >
              <span className="mt-left">
                <span className="mt-ic">
                  <Grid3x3 className="h-[17px] w-[17px]" />
                </span>
                <span className="mt-txt">
                  <span className="mt-t">All other services</span>
                  <span className="mt-s">Browse the full menu — cleaning, air &amp; specialty services</span>
                </span>
              </span>
              <span className="mt-right">
                <span className="mt-count">{otherCount}</span>
                <ChevronDown className="mt-chev h-[18px] w-[18px]" />
              </span>
            </button>
            {menuOpen && (
              <div className="more-grid fade-in">
                {bundleService && renderBundleRow(bundleService)}
                {otherServices.map((service) => renderServiceRow(service))}
              </div>
            )}
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
            const belowMinimum = totalPrice < SERVICE_MINIMUM;
            const remaining = Math.max(0, SERVICE_MINIMUM - totalPrice);
            const progressPct = Math.min(100, (totalPrice / SERVICE_MINIMUM) * 100);
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
                    {belowMinimum ? `Add ${formatPrice(remaining)} to continue` : "See available times"}
                  </button>
                </div>
                {/* Trust signals sit under the primary CTA — the moment the
                    customer is deciding whether to commit. */}
                <div className="sbar-trust">
                  <TrustSignals variant="bar" />
                </div>
              </div>
            );
          })()}
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

    {/* Desktop configurator modal — rendered outside .svc5 so its Tailwind
        styling isn't affected by the design system's element resets. */}
    {renderDesktopModal()}
    </>
  );
}
