"use client";
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
  List,
  X,
  RefreshCw,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { business } from "@/lib/business";
import { Check } from "lucide-react";
import {
  carpetModel,
  computeCarpetLevelPricePerArea,
  getCarpetLevelById,
  type CarpetPricingModel,
  type CarpetSelection,
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

// Branded Voda service photos (myvoda.com) shown as tiles in the service grid.
// Services without an entry fall back to a branded gradient tile + their icon.
const SERVICE_IMAGES: Record<string, string> = {
  "carpet-cleaning": "/services/voda-carpet.webp",
  "routine-floor-care": "/services/floor-care.png",
  "rugs": "/services/area-rug.png",
  "tile-grout-stone": "/services/voda-tile-grout.webp",
  "hardwood-detailing": "/services/voda-hardwood.webp",
  "dryer-vent-cleaning": "/services/dryer-vent.png",
  "upholstery-cleaning": "/services/voda-upholstery.webp",
  "air-duct-cleaning": "/services/voda-air-duct.webp",
  "odor-spot-control": "/services/voda-odor.webp",
};

type EmergencyDamage = "Water" | "Fire" | "Mold" | "Storm";

// Emergency & restoration is offered as four individual remediation cards, each
// opening the emergency flow (which routes into a no-payment checkout).
const REMEDIATION: {
  type: EmergencyDamage;
  shortName: string;
  name: string;
  blurb: string;
  img: string;
}[] = [
  { type: "Water", shortName: "Water Damage", name: "Water Damage Remediation", blurb: "Rapid water extraction and structural drying to stop damage spreading.", img: "/services/voda-water-damage.webp" },
  { type: "Fire", shortName: "Fire & Smoke", name: "Fire & Smoke Remediation", blurb: "Soot, smoke and odor removal with full contents restoration.", img: "/services/voda-fire-smoke.webp" },
  { type: "Mold", shortName: "Mold", name: "Mold Remediation", blurb: "Containment, safe remediation and air-quality restoration.", img: "/services/voda-mold.webp" },
  { type: "Storm", shortName: "Storm Damage", name: "Storm Damage Remediation", blurb: "Board-up, debris removal and full storm recovery.", img: "/services/voda-storm-damage.webp" },
];

// "Month Day" label for the next business day (skips weekends). Computed on the
// client so it reflects the visitor's current date, not the build date.
function nextBusinessDayLabel(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

// Service highlighted with a "Most booked" badge.
const POPULAR_SERVICE_ID = "carpet-cleaning";

// Carpet cleaning can be priced for a furnished home (furniture moved/cleaned
// around) or a vacant one (empty rooms, less labor). Vacant is the cheaper
// option. Per-room prices are set explicitly per tier and occupancy.
type CarpetOccupancy = "furnished" | "vacant";
const CARPET_ROOM_PRICE: Record<CarpetOccupancy, Record<string, number>> = {
  furnished: { bronze: 67.5, silver: 139, gold: 265 },
  vacant: { bronze: 65, silver: 100, gold: 194 },
};
// Falls back to the computed model price for any tier not in the table above.
const carpetPricePerRoom = (
  model: CarpetPricingModel,
  levelId: string,
  occupancy: CarpetOccupancy,
): number => {
  const override = CARPET_ROOM_PRICE[occupancy]?.[levelId];
  if (override != null) return override;
  return computeCarpetLevelPricePerArea(model, getCarpetLevelById(model, levelId));
};

export default function ServicesPage() {
  const router = useRouter();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceQuantities, setServiceQuantities] = useState<
    Record<string, number>
  >({});
  const [variantQuantities, setVariantQuantities] = useState<
    Record<string, Record<string, number>>
  >({});
  const [carpetSelection, setCarpetSelection] = useState<Record<string, CarpetSelection>>({});
  const [carpetOccupancy, setCarpetOccupancy] = useState<Record<string, CarpetOccupancy>>({});
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
  const [mobileView, setMobileView] = useState<"house" | "list">("house");
  // Service whose bottom-sheet configurator is open (mobile House view). null = closed.
  const [sheetServiceId, setSheetServiceId] = useState<string | null>(null);
  // services3: id of the card expanded inline in the unified grid. null = all collapsed.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Emergency & restoration popup.
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyDamage, setEmergencyDamage] = useState<EmergencyDamage | null>(null);
  // Mobile bottom sheets for the emergency and bundle cards.
  const [emergencySheetOpen, setEmergencySheetOpen] = useState(false);
  const [bundleSheetOpen, setBundleSheetOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getCarpetSel = (service: Service): CarpetSelection => {
    const stored = carpetSelection[service.id];
    if (stored) return stored;
    const model = service.carpetModel!;
    const popular = model.levels.find((l) => l.mostPopular) ?? model.levels[0];
    return { areas: model.defaultAreas, levelId: popular.id };
  };

  const getRugSel = (service: Service): RugSelection => {
    const stored = rugSelection[service.id];
    if (stored) return stored;
    return defaultRugSelection(service.rugModel!);
  };

  const getCarpetOccupancy = (serviceId: string): CarpetOccupancy =>
    carpetOccupancy[serviceId] ?? "furnished";

  const setOccupancyFor = (serviceId: string, occ: CarpetOccupancy) => {
    setCarpetOccupancy({ ...carpetOccupancy, [serviceId]: occ });
  };

  // Carpet total = per-room price (by tier + occupancy) × number of rooms.
  const carpetTotalFor = (service: Service, sel: CarpetSelection): number => {
    const perRoom = carpetPricePerRoom(
      service.carpetModel!,
      sel.levelId,
      getCarpetOccupancy(service.id),
    );
    return perRoom * sel.areas;
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
          const popular =
            service.carpetModel.levels.find((l) => l.mostPopular) ??
            service.carpetModel.levels[0];
          setCarpetSelection({
            ...carpetSelection,
            [serviceId]: { areas: service.carpetModel.defaultAreas, levelId: popular.id },
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
          carpetOccupancy,
          rugSelection,
          bundleUnits,
          serviceFrequency,
          totalPrice: finalTotal,
        },
        // Normal booking — clear any emergency/commercial no-payment flags.
        emergency: undefined,
        commercial: undefined,
        skipPayment: undefined,
      };
      localStorage.setItem("estimateData", JSON.stringify(updatedData));
      router.push("/estimate/customer");
    }
  };

  useEffect(() => {
    setTotalPrice(calculateTotalPrice());
  }, [selectedServices, serviceFrequency, serviceQuantities, variantQuantities, carpetSelection, carpetOccupancy, rugSelection, bundleUnits]);

  // Bottom-sheet configurator body (mobile House view). Renders the SAME options
  // and writes to the SAME live state as the List cards, just without the card
  // chrome — so the two stay in sync. The sheet's header/footer are provided by
  // the Drawer below.
  const TIER_DOTS = ["bg-amber-700", "bg-gray-500", "bg-yellow-500"];

  // --- Emergency callback body ------------------------------------------------
  // Shared between the inline emergency card (desktop list) and the mobile
  // bottom sheet: call CTA, damage-type picker, callback form, confirmation.
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

  // --- Service image grid -----------------------------------------------------
  // Replaces the old dollhouse illustration. One equal-size tile per service;
  // tapping a tile selects/deselects that service. Services with a branded photo
  // show it; the rest fall back to a navy gradient tile with the service icon.
  const renderServiceGrid = (
    onTap: (serviceId: string) => void,
    onEmergency: () => void,
    onBundle: () => void,
  ) => {
    const bundleSelected = selectedServices.includes("healthy-home-bundle");
    return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* Featured row: Emergency + Bundle */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
      {/* Emergency & Restoration — opens the urgent-help card */}
      <button
        type="button"
        onClick={onEmergency}
        aria-label="Emergency & Restoration"
        className="group relative aspect-[2/1] overflow-hidden rounded-xl border-2 border-transparent text-left shadow-sm transition-all duration-200 hover:border-red-300"
      >
        <img
          src="/services/voda-water-damage.webp"
          alt="Emergency & Restoration"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute top-2 left-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          24/7
        </span>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-red-950/90 via-red-900/40 to-transparent p-2.5 pt-7">
          <span className="block text-xs sm:text-sm font-semibold leading-tight text-white drop-shadow-sm">
            Emergency &amp; Restoration
          </span>
        </div>
      </button>

      {/* Healthy Home Bundle — selects the bundle */}
      <button
        type="button"
        onClick={onBundle}
        aria-label="Toggle Healthy Home Bundle"
        aria-pressed={bundleSelected}
        className={`group relative aspect-[2/1] overflow-hidden rounded-xl border-2 text-left transition-all duration-200 ${
          bundleSelected
            ? "border-[#03D9E5] ring-2 ring-[#03D9E5]/40 shadow-md"
            : "border-transparent hover:border-[#03D9E5]/50 shadow-sm"
        }`}
      >
        {/* Layered brand gradient with a cyan glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a3a52] via-[#152644] to-[#0a1426]" />
        <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-[#03D9E5]/30 blur-2xl transition-opacity duration-300 group-hover:bg-[#03D9E5]/45" />
        <div className="absolute -left-8 bottom-0 h-20 w-20 rounded-full bg-[#03D9E5]/10 blur-2xl" />
        <Sparkles
          className="absolute right-3 top-1/2 h-12 w-12 -translate-y-1/2 text-[#03D9E5]/80 drop-shadow-[0_0_12px_rgba(3,217,229,0.45)] transition-transform duration-300 group-hover:scale-110"
          strokeWidth={1.5}
        />

        <span className="absolute top-2 left-2 rounded-full bg-[#03D9E5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0d1a30] shadow-sm">
          Save 15%
        </span>
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <span className="block text-xs sm:text-sm font-bold leading-tight text-white drop-shadow-sm">
            Healthy Home Bundle
          </span>
          <span className="mt-0.5 block text-[10px] sm:text-[11px] font-medium leading-tight text-[#9fe9ee]">
            Carpet + Vents + Upholstery
          </span>
        </div>
        {bundleSelected && (
          <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#03D9E5] shadow-md ring-2 ring-white/70">
            <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
          </span>
        )}
      </button>
      </div>

      {/* Services — uniform 3-up grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
      {availableServices
        .filter((s) => !isBundleService(s))
        .map((service) => {
          const isSelected = selectedServices.includes(service.id);
          const img = SERVICE_IMAGES[service.id];
          const Icon = service.icon;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onTap(service.id)}
              aria-label={`Toggle ${service.name}`}
              aria-pressed={isSelected}
              className={`group relative aspect-[4/3] overflow-hidden rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? "border-[#03D9E5] ring-2 ring-[#03D9E5]/40 shadow-md"
                  : "border-transparent hover:border-gray-300 shadow-sm"
              }`}
            >
              {img ? (
                <img
                  src={img}
                  alt={service.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#16294a] via-[#152644] to-[#0d1a30]">
                  {Icon && <Icon className="h-9 w-9 text-[#03D9E5]/80" strokeWidth={1.5} />}
                </div>
              )}

              {/* Label, on a readability scrim */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-2.5 pt-7">
                <span className="block text-xs sm:text-sm font-semibold leading-tight text-white drop-shadow-sm">
                  {service.name}
                </span>
              </div>

              {/* Selected check */}
              {isSelected && (
                <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#03D9E5] shadow-md ring-2 ring-white/70">
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
    );
  };

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

  const renderSheetConfig = (service: Service) => {
    // Carpet — rooms + home status + service levels + frequency
    if (service.carpetModel) {
      const carpet = service.carpetModel;
      const sel = getCarpetSel(service);
      const activeIdx = Math.max(
        0,
        carpet.levels.findIndex((l) => l.id === sel.levelId),
      );
      const setSel = (next: CarpetSelection) =>
        setCarpetSelection({ ...carpetSelection, [service.id]: next });
      const occupancy = getCarpetOccupancy(service.id);
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

          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Home Status
            </span>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(
                [
                  { id: "furnished" as const, label: "Furnished", hint: "Furniture in place" },
                  { id: "vacant" as const, label: "Vacant", hint: "Empty rooms" },
                ]
              ).map((opt) => {
                const active = occupancy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setOccupancyFor(service.id, opt.id)}
                    className={`px-3 py-2.5 text-left border-2 transition-colors ${
                      active
                        ? "border-[#03D9E5] bg-[#03D9E5]/5"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className="block text-sm font-bold text-[#152644]">{opt.label}</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Choose a Service Level
            </span>
            <div className="mt-3 border border-gray-200 divide-y divide-gray-200">
              {carpet.levels.map((level, idx) => {
                const isActive = idx === activeIdx;
                const prevAddOnIds = idx > 0 ? carpet.levels[idx - 1].addOnIds : [];
                const newAddOnNames = level.addOnIds
                  .filter((id) => !prevAddOnIds.includes(id))
                  .map((id) => carpet.addOns.find((a) => a.id === id)?.name)
                  .filter(Boolean) as string[];
                const includesLabel =
                  idx === 0
                    ? "Includes"
                    : `Everything in ${carpet.levels[idx - 1].name}, plus`;
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setSel({ ...sel, levelId: level.id })}
                    className={`w-full text-left transition-colors ${
                      isActive ? "bg-[#152644]/[0.04]" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="p-3 grid grid-cols-[20px_1fr] items-start gap-3">
                      <div className="pt-0.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isActive ? "bg-[#152644] border-[#152644]" : "border-gray-300 bg-white"
                          }`}
                        >
                          {isActive && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              TIER_DOTS[idx % TIER_DOTS.length]
                            }`}
                          />
                          <span className="text-sm font-bold text-[#152644]">{level.name}</span>
                          {level.mostPopular && (
                            <span className="text-[8.5px] font-bold uppercase tracking-wider bg-[#03D9E5]/10 text-[#03D9E5] px-1.5 py-0.5 leading-tight">
                              Most Popular
                            </span>
                          )}
                        </div>
                        {level.tagline && (
                          <p className="text-[11px] text-gray-500 mt-0.5">{level.tagline}</p>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 block mt-2 mb-1.5">
                          {includesLabel}
                        </span>
                        <div className="space-y-1">
                          {idx === 0
                            ? level.features.map((feat, fi) => (
                                <div
                                  key={fi}
                                  className="flex items-start gap-1.5 text-[12px] text-gray-700 leading-snug"
                                >
                                  <Check
                                    className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-[#03D9E5]"
                                    strokeWidth={2.5}
                                  />
                                  <span>{feat}</span>
                                </div>
                              ))
                            : newAddOnNames.map((name, ai) => (
                                <div
                                  key={ai}
                                  className="flex items-start gap-1.5 text-[12px] text-gray-700 leading-snug"
                                >
                                  <Plus
                                    className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-[#03D9E5]"
                                    strokeWidth={2.5}
                                  />
                                  <span>{name}</span>
                                </div>
                              ))}
                        </div>
                      </div>
                    </div>
                  </button>
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

  // --- services3: unified expandable image grid -----------------------------
  // Representative "from" price shown on a collapsed service tile.
  const previewPrice = (service: Service): number => {
    if (service.carpetModel) {
      const m = service.carpetModel;
      return Math.min(...m.levels.map((l) => carpetPricePerRoom(m, l.id, "furnished")));
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
        // Emergency is standalone — start with an empty cart so no previously
        // selected services carry into the checkout. Clear any commercial flag.
        services: { selectedServices: [], totalPrice: 0 },
        emergency: { damageType: damage },
        commercial: undefined,
        skipPayment: true,
      }),
    );
    router.push("/estimate/customer");
  };

  // A service tile: an image with its info overlaid. Tapping opens the
  // configurator (modal on desktop / bottom sheet on mobile).
  // A feature checklist for a card, derived from the service's unit + disclaimer.
  // Service card: photo on top, then title, description, price, and a Book CTA.
  // The whole card is clickable — clicking a selected card deselects it.
  // Icon-gradient service card: light slate header with the service's line icon
  // (plus a big ghosted copy), a unit pill + optional badge, then a white body
  // with title, description, price, and a Book CTA. Whole card toggles select.
  const renderServiceCell = (service: Service) => {
    const isSel = selectedServices.includes(service.id);
    const Icon = service.icon;
    const img = SERVICE_IMAGES[service.id];
    const hasRange = !!(service.variants || service.carpetModel || service.rugModel);
    const isPopular = service.id === POPULAR_SERVICE_ID;
    return (
      <button
        key={service.id}
        type="button"
        onClick={() => openService(service)}
        aria-pressed={isSel}
        className={`group flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition-all duration-200 ${
          isSel
            ? "border-[#03D9E5] ring-1 ring-[#03D9E5]/40 shadow-md"
            : "border-gray-200 shadow-sm hover:shadow-md"
        }`}
      >
        {/* Photo header */}
        <div className="relative aspect-[2/1] w-full overflow-hidden bg-gray-100">
          {img ? (
            <img
              src={img}
              alt={service.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#16294a] via-[#152644] to-[#0d1a30]">
              {Icon && <Icon className="h-10 w-10 text-[#03D9E5]/80" strokeWidth={1.5} />}
            </div>
          )}
          <span className="absolute top-2.5 left-2.5 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 shadow-sm">
            {service.unitLabel}
          </span>
          {isPopular && (
            <span className="absolute top-2.5 right-2.5 rounded-md bg-[#03D9E5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0a1426] shadow-sm">
              Most booked
            </span>
          )}
          {isSel && (
            <span className="absolute bottom-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#03D9E5] shadow-md ring-2 ring-white/70">
              <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
            </span>
          )}
        </div>
        {/* Body */}
        <div className="flex flex-1 flex-col p-3">
          <h3 className="text-base font-bold leading-tight text-[#152644]">{service.name}</h3>
          {service.description && (
            <p className="mt-1 text-[13px] leading-snug text-gray-500">{service.description}</p>
          )}
          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <div className="flex items-end gap-1">
              {hasRange && (
                <span className="mb-0.5 text-[11px] font-medium text-gray-400">from</span>
              )}
              <span className="text-xl font-bold tabular-nums text-[#152644]">
                {formatPrice(previewPrice(service))}
              </span>
              <span className="mb-0.5 text-[13px] text-gray-400">/{service.unit}</span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                isSel
                  ? "bg-[#03D9E5] text-[#0a1426] group-hover:bg-[#03D9E5]/90"
                  : "bg-[#152644] text-white group-hover:bg-[#152644]/90"
              }`}
            >
              {isSel ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={3} /> Added
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" strokeWidth={2.5} /> Book
                </>
              )}
            </span>
          </div>
        </div>
      </button>
    );
  };

  // Bundle: dark navy icon header with WHOLE HOME + SAVE 15% pills.
  const renderBundleCell = (service: Service) => {
    const isSel = selectedServices.includes(service.id);
    const total = getBundleTotal(service, getBundleUnitsMap(service));
    return (
      <button
        key={service.id}
        type="button"
        onClick={openBundleCard}
        aria-pressed={isSel}
        className={`group flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition-all duration-200 ${
          isSel
            ? "border-[#03D9E5] ring-1 ring-[#03D9E5]/40 shadow-md"
            : "border-gray-200 shadow-sm hover:shadow-md"
        }`}
      >
        <div className="relative aspect-[2/1] w-full overflow-hidden bg-gradient-to-br from-[#0a3a52] via-[#152644] to-[#0a1426]">
          <Sparkles className="absolute -right-3 -bottom-5 h-28 w-28 text-[#03D9E5]/10" strokeWidth={1.25} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-9 w-9 text-[#03D9E5]" strokeWidth={1.75} />
          </div>
          <span className="absolute top-2.5 left-2.5 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 shadow-sm">
            Whole home
          </span>
          <span className="absolute top-2.5 right-2.5 rounded-md bg-[#03D9E5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0a1426] shadow-sm">
            Save 15%
          </span>
          {isSel && (
            <span className="absolute bottom-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#03D9E5] shadow-md ring-2 ring-white/70">
              <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3">
          <h3 className="text-base font-bold leading-tight text-[#152644]">{service.name}</h3>
          <p className="mt-1 text-[13px] leading-snug text-gray-500">
            Our most-booked refresh — carpet, whole-home vents, and an upholstery refresh, priced together so you save vs. booking separately.
          </p>
          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <div className="flex items-end gap-1">
              <span className="mb-0.5 text-[11px] font-medium text-gray-400">from</span>
              <span className="text-xl font-bold tabular-nums text-[#152644]">{formatPrice(total)}</span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                isSel
                  ? "bg-[#03D9E5] text-[#0a1426] group-hover:bg-[#03D9E5]/90"
                  : "bg-[#152644] text-white group-hover:bg-[#152644]/90"
              }`}
            >
              {isSel ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={3} /> Added
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" strokeWidth={2.5} /> Book
                </>
              )}
            </span>
          </div>
        </div>
      </button>
    );
  };

  // Emergency remediation cards — same format as the standard service cards
  // (gray border, white unit pill, navy Book button). The whole card routes
  // into the no-payment checkout for that damage type.
  const renderEmergencyCells = () =>
    REMEDIATION.map((r) => (
      <button
        key={r.type}
        type="button"
        onClick={() => startEmergencyCheckout(r.type)}
        aria-label={r.name}
        className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition-all duration-200 hover:shadow-md"
      >
        <div className="relative aspect-[2/1] w-full overflow-hidden bg-gray-100">
          <img
            src={r.img}
            alt={r.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute top-2.5 left-2.5 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 shadow-sm">
            24/7
          </span>
        </div>
        <div className="flex flex-1 flex-col p-3">
          <h3 className="text-base font-bold leading-tight text-[#152644]">{r.shortName}</h3>
          <p className="mt-1 text-[13px] leading-snug text-gray-500">{r.blurb}</p>
          <div className="mt-auto flex items-end justify-end pt-3">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#152644] px-4 py-2.5 text-sm font-bold text-white transition-colors group-hover:bg-[#152644]/90">
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Book
            </span>
          </div>
        </div>
      </button>
    ));


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
              onClick={close}
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
              onClick={close}
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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Combined header: logo on the left, page title next to it */}
      <header className="fixed top-0 w-full bg-white backdrop-blur-md border-b border-gray-200 shadow-sm z-50 transition-all duration-200">
        <div
          className={`max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-10 flex items-center justify-center transition-all duration-200 ${
            scrolled ? "py-2" : "py-3 sm:py-4"
          }`}
        >
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/voda-logo.svg"
              alt="Voda Cleaning & Restoration"
              width={200}
              height={60}
              className={`w-auto transition-all duration-200 ${
                scrolled ? "h-7 lg:h-9" : "h-8 sm:h-9 lg:h-11"
              }`}
            />
          </Link>
        </div>
      </header>

      <h1 className="sr-only">
        Book {business.primaryService.toLowerCase()} in {business.city}, {business.state} — {business.brandName}
      </h1>

      {/* Unified expandable image grid: every service is an image tile with its
          info overlaid; tapping a tile selects it and unfurls a full-width
          configurator in place. */}
      <main
        className={`flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6 pb-[260px] lg:pt-[80px] ${
          scrolled ? "pt-[56px]" : "pt-[68px]"
        }`}
      >
        <div className="py-4 sm:py-6 space-y-6 sm:space-y-8">
          {/* Page intro + appointment availability */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-4xl font-bold text-[#152644] tracking-tight">
                Select your services
              </h2>
              <p className="mt-1.5 max-w-md text-sm sm:text-base text-gray-500 leading-snug">
                Build your visit from our full menu — transparent pricing, no charge until
                after your appointment.
              </p>
            </div>
            {bookDate && (
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <CalendarCheck className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Appointments available as soon as
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-[#152644]">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {bookDate}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Service quick-nav — a single horizontally scrolling ribbon of every
              service pill (emergency first, then all bookable services). */}
          <div className="-mx-4 border-b border-gray-200 px-4 pb-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                ...REMEDIATION.map((r) => ({
                  key: `emergency-${r.type}`,
                  label: r.shortName,
                  icon: AlertTriangle,
                  accent: "text-red-500",
                  onClick: () => startEmergencyCheckout(r.type),
                })),
                ...availableServices
                  .filter((s) => !isBundleService(s))
                  .map((s) => ({
                    key: s.id,
                    label: s.name,
                    icon: s.icon,
                    accent: "text-[#03D9E5]",
                    onClick: () => openService(s),
                  })),
              ].map((chip) => {
                const ChipIcon = chip.icon;
                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.onClick}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#152644] shadow-sm transition-colors hover:border-[#03D9E5]/50 hover:bg-[#03D9E5]/5"
                  >
                    {ChipIcon && (
                      <ChipIcon className={`h-3.5 w-3.5 ${chip.accent}`} strokeWidth={2} />
                    )}
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emergency & Restoration — first */}
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-500">
                  <AlertTriangle className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-base font-bold text-[#152644]">Emergency &amp; Restoration</div>
                  <div className="text-[13px] text-gray-400">24/7 rapid response — call to dispatch</div>
                </div>
              </div>
              <a
                href="tel:+16083988632"
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-600"
              >
                <PhoneCall className="h-4 w-4" strokeWidth={2.5} /> Call (608) 398-8632
              </a>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch">
              {renderEmergencyCells()}
            </div>
          </section>

          {/* Category sections — Floor Care (bundle first), then Air & Upholstery */}
          {serviceCategories.map((cat) => {
            const items = availableServices.filter(
              (s) => !isBundleService(s) && s.category === cat.id,
            );
            if (items.length === 0) return null;
            const CatIcon = cat.icon;
            const showBundle = cat.id === "floor-care" && bundleService;
            return (
              <section key={cat.id}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#03D9E5]/10 text-[#2c8fa3]">
                      <CatIcon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <div>
                      <div className="text-base font-bold text-[#152644]">{cat.label}</div>
                      <div className="text-[13px] text-gray-400">{cat.subtitle}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                    {items.length} services
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch">
                  {showBundle && renderBundleCell(bundleService!)}
                  {items.map((service) => renderServiceCell(service))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* Sticky estimate bar */}
      {selectedServices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
          <div className="max-w-[1080px] mx-auto w-full px-4 py-3 sm:px-6 sm:py-5">
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
              const belowMinimum = totalPrice < SERVICE_MINIMUM;
              const remaining = Math.max(0, SERVICE_MINIMUM - totalPrice);
              const progressPct = Math.min(100, (totalPrice / SERVICE_MINIMUM) * 100);
              return (
                <>
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
        </div>
      )}

      {/* Desktop: one consistent centered configurator modal. */}
      {renderDesktopModal()}

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
