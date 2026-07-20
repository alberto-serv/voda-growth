"use client";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ArrowRight,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { business } from "@/lib/business";
import { Check } from "lucide-react";
import {
  carpetModel,
  computeCarpetLevelPricePerArea,
  computeCarpetTotal,
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
  type ServiceFrequency,
} from "@/lib/services-catalog";
import { FrequencyPicker } from "@/components/frequency-picker";

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
  carpetModel?: CarpetPricingModel;
  rugModel?: RugPricingModel;
  category: "floor-care" | "cleaning";
  recurrenceOptions?: ServiceFrequency[];
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
    position: { x: 520, y: 770 },
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
    position: { x: 440, y: 670 },
    category: "cleaning",
    variants: [
      { id: "sofa", name: "Sofa", unitPrice: 185, defaultQuantity: 1 },
      { id: "loveseat", name: "Loveseat", unitPrice: 120, defaultQuantity: 0 },
      { id: "chair", name: "Chair", unitPrice: 30, defaultQuantity: 0 },
      { id: "sectional", name: "Sectional", unitPrice: 375, defaultQuantity: 0 },
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
];

const SERVICE_MINIMUM = 165;

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
  const [rugSelection, setRugSelection] = useState<Record<string, RugSelection>>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [serviceFrequency, setServiceFrequency] = useState<Record<string, ServiceFrequency>>({});
  const [leftPanelStickyTop, setLeftPanelStickyTop] = useState(0);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lead capture overlay state
  const [showLeadOverlay, setShowLeadOverlay] = useState(true);
  const [leadFirstName, setLeadFirstName] = useState("");
  const [leadLastName, setLeadLastName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("estimateData") || "{}");
      if (stored?.lead) {
        // Pre-fill the form with any existing lead info, but still show the overlay
        if (stored.lead.firstName) setLeadFirstName(stored.lead.firstName);
        if (stored.lead.lastName) setLeadLastName(stored.lead.lastName);
        if (stored.lead.email) setLeadEmail(stored.lead.email);
        if (stored.lead.phone) setLeadPhone(stored.lead.phone);
      }
      // If the user is returning from a later step in the same session, skip the overlay.
      if (sessionStorage.getItem("leadOverlayCompleted") === "1") {
        setShowLeadOverlay(false);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const handleLeadSubmit = () => {
    if (!leadFirstName.trim() || !leadLastName.trim() || !leadEmail.trim() || !leadPhone.trim()) return;
    const stored = JSON.parse(localStorage.getItem("estimateData") || "{}");
    localStorage.setItem(
      "estimateData",
      JSON.stringify({
        ...stored,
        lead: {
          firstName: leadFirstName.trim(),
          lastName: leadLastName.trim(),
          email: leadEmail.trim(),
          phone: leadPhone.trim(),
        },
      }),
    );
    try {
      sessionStorage.setItem("leadOverlayCompleted", "1");
    } catch {
      // ignore
    }
    setShowLeadOverlay(false);
  };

  const updateStickyTop = useCallback(() => {
    if (leftPanelRef.current) {
      const panelHeight = leftPanelRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      // Stick when bottom of panel reaches bottom of viewport
      const stickyTop = viewportHeight - panelHeight;
      setLeftPanelStickyTop(stickyTop);
    }
  }, []);

  useEffect(() => {
    updateStickyTop();
    window.addEventListener("resize", updateStickyTop);
    return () => window.removeEventListener("resize", updateStickyTop);
  }, [updateStickyTop]);

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

  const getServiceBasePrice = (service: Service): number => {
    if (service.carpetModel) {
      return computeCarpetTotal(service.carpetModel, getCarpetSel(service));
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
          serviceFrequency,
          totalPrice: finalTotal,
        },
      };
      localStorage.setItem("estimateData", JSON.stringify(updatedData));
      router.push("/estimate/customer");
    }
  };

  useEffect(() => {
    setTotalPrice(calculateTotalPrice());
  }, [selectedServices, serviceFrequency, serviceQuantities, variantQuantities, carpetSelection, rugSelection]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {showLeadOverlay && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(10,22,40,0.55) 0%, rgba(21,38,68,0.55) 45%, rgba(26,58,107,0.50) 75%, rgba(3,217,229,0.40) 150%)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div className="w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-sm p-8 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Get Your Free Estimate
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter your info to start selecting services
                </p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="leadFirstName" className="text-sm font-medium">
                      First Name *
                    </Label>
                    <Input
                      id="leadFirstName"
                      value={leadFirstName}
                      onChange={(e) => setLeadFirstName(e.target.value)}
                      placeholder="First name"
                      className="mt-1"
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="leadLastName" className="text-sm font-medium">
                      Last Name *
                    </Label>
                    <Input
                      id="leadLastName"
                      value={leadLastName}
                      onChange={(e) => setLeadLastName(e.target.value)}
                      placeholder="Last name"
                      className="mt-1"
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="leadEmail" className="text-sm font-medium">
                    Email *
                  </Label>
                  <Input
                    id="leadEmail"
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div>
                  <Label htmlFor="leadPhone" className="text-sm font-medium">
                    Phone *
                  </Label>
                  <Input
                    id="leadPhone"
                    type="tel"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <Button
                  onClick={handleLeadSubmit}
                  size="lg"
                  className="w-full bg-[#03D9E5] hover:bg-[#03D9E5]/90 text-[#152644] font-semibold mt-2"
                  style={{ borderRadius: 0 }}
                  disabled={
                    !leadFirstName.trim() ||
                    !leadLastName.trim() ||
                    !leadEmail.trim() ||
                    !leadPhone.trim()
                  }
                >
                  Select Your Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <a
                  href="tel:+16083988632"
                  className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors mt-3"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-600 flex-shrink-0">
                    <PhoneCall className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-800 text-sm">
                      Emergency Services
                    </p>
                    <p className="text-xs text-red-600">Call (608) 398-8632</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      <Header />

      <h1 className="sr-only">
        Book {business.primaryService.toLowerCase()} in {business.city}, {business.state} — {business.brandName}
      </h1>

      <div
        className={`flex-1 max-w-[1800px] mx-auto w-full flex flex-col transition-all duration-200 lg:pt-[80px] ${
          scrolled ? "pt-[32px]" : "pt-[80px]"
        }`}
      >
        {/* Unified Sticky Header Bar */}
        <div
          className={`sticky z-40 w-full bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 lg:px-10 lg:py-5 lg:top-[80px] flex items-center gap-2 lg:gap-4 transition-all duration-200 ${
            scrolled ? "top-[32px] lg:top-[80px] py-2" : "top-[80px] py-3 sm:py-4"
          }`}
        >
           <h1 className="text-xl sm:text-2xl font-bold text-[#152644] tracking-tight shrink-0">Select Services</h1>
           <span className="text-[10px] sm:text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full uppercase tracking-wider shrink-0 border border-gray-200">STEP 1 OF 3</span>
        </div>

        <div className="flex-1 flex flex-col md:flex-row shadow-sm border-x border-gray-100 items-start relative">
          {/* Left Panel - Large House Graphic */}
          <div
            ref={leftPanelRef}
            className="hidden md:block md:w-[55%] shrink-0 border-r border-gray-200 bg-[#f8fafc] md:sticky"
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
                        <div className={`text-[10px] px-1.5 py-0.5 rounded transition-all duration-300 ${
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
          <div className="bg-white flex flex-col relative w-full md:w-[45%] shrink-0">
            <div className="block flex-1 py-4 px-4 sm:py-6 sm:px-6 lg:px-10 pb-[320px] md:pb-4">
              {/* Emergency / Restoration Services Card */}
              <div className="mb-6">
                <a
                  href="tel:+16083988632"
                  className="block p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                        <PhoneCall className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-red-900 text-sm sm:text-base leading-tight">Emergency & Restoration Services</p>
                        <p className="text-red-700 text-xs sm:text-sm">Call for immediate 24/7 assistance</p>
                      </div>
                    </div>
                    <div className="bg-white/80 rounded-md px-3 py-1.5 border border-red-100 shadow-sm ml-13 sm:ml-0">
                       <span className="text-xl sm:text-2xl font-black tracking-tight text-red-950 whitespace-nowrap">
                         (608) 398-8632
                       </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pl-[52px] text-xs sm:text-sm text-red-800/90 font-medium">
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                       <span>Water Damage Restoration</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                       <span>Fire & Smoke Damage</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                       <span>Storm Damage Restoration</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                       <span>Mold Remediation</span>
                    </div>
                  </div>
                </a>
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
                  const isSelected = selectedServices.includes(service.id);
                  const quantity =
                    serviceQuantities[service.id] || service.defaultQuantity;
                  const carpetSel = service.carpetModel ? getCarpetSel(service) : undefined;
                  const carpetActiveLevel = service.carpetModel && carpetSel
                    ? getCarpetLevelById(service.carpetModel, carpetSel.levelId)
                    : undefined;
                  const carpetActivePrice = service.carpetModel && carpetActiveLevel
                    ? computeCarpetLevelPricePerArea(service.carpetModel, carpetActiveLevel)
                    : 0;
                  const rugSel = service.rugModel ? getRugSel(service) : undefined;
                  const rugActiveLevel = service.rugModel && rugSel
                    ? getRugLevelById(service.rugModel, rugSel.levelId)
                    : undefined;
                  const rugTotalCount = rugSel ? totalRugCount(rugSel) : 0;
                  const serviceTotal = service.carpetModel && carpetSel
                    ? computeCarpetTotal(service.carpetModel, carpetSel)
                    : service.rugModel && rugSel
                    ? computeRugTotal(service.rugModel, rugSel)
                    : service.variants
                    ? service.variants.reduce((sum, v) => {
                        const qty = variantQuantities[service.id]?.[v.id] ?? v.defaultQuantity;
                        return sum + v.unitPrice * qty;
                      }, 0)
                    : service.unitPrice * quantity;

                  // Expanded carpet card (matches the source preview layout)
                  if (service.carpetModel && carpetSel && carpetActiveLevel && isSelected) {
                    const carpet = service.carpetModel;
                    const sel = carpetSel;
                    const activeIdx = Math.max(
                      0,
                      carpet.levels.findIndex((l) => l.id === sel.levelId),
                    );
                    const setSel = (next: CarpetSelection) => {
                      setCarpetSelection({ ...carpetSelection, [service.id]: next });
                    };
                    const TIER_DOTS = ["bg-amber-700", "bg-gray-500", "bg-yellow-500"];

                    return (
                      <Card
                        key={service.id}
                        className="cursor-pointer transition-all duration-200 border-2 border-[#03D9E5] bg-white shadow-md"
                        style={{ borderRadius: 0 }}
                        onClick={() => handleServiceToggle(service.id)}
                      >
                        <CardContent className="p-4 sm:p-5">
                          {/* Header: title + badge + description ↔ rooms stepper */}
                          <div className="flex items-start justify-between gap-3 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-2xl font-bold text-[#152644] leading-tight">
                                {service.name}
                              </h3>
                              <span className="inline-block mt-1.5 text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 uppercase tracking-wider">
                                {service.unitLabel}
                              </span>
                              {service.description && (
                                <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-snug">
                                  {service.description}
                                </p>
                              )}
                            </div>
                            <div
                              className="flex items-stretch border border-gray-200 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="hidden sm:flex items-center px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-50">
                                Rooms
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSel({ ...sel, areas: Math.max(1, sel.areas - 1) });
                                }}
                                className="px-2.5 sm:px-3 h-9 text-gray-600 hover:bg-gray-50 hover:text-[#152644] border-l border-gray-200"
                                aria-label="Decrease rooms"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <Input
                                type="number"
                                min={1}
                                value={sel.areas}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setSel({
                                    ...sel,
                                    areas: Math.max(1, Number.parseInt(e.target.value) || 1),
                                  });
                                }}
                                className="w-10 h-9 px-0 text-center text-sm font-bold text-[#152644] bg-white border-x border-y-0 border-gray-200 rounded-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSel({ ...sel, areas: sel.areas + 1 });
                                }}
                                className="px-2.5 sm:px-3 h-9 text-gray-600 hover:bg-gray-50 hover:text-[#152644]"
                                aria-label="Increase rooms"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Choose a Service Level */}
                          <div className="mt-5 pt-5 border-t border-gray-200">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                              Choose a Service Level
                            </span>
                            <div className="mt-3 border border-gray-200 divide-y divide-gray-200">
                              {carpet.levels.map((level, idx) => {
                                const isActive = idx === activeIdx;
                                const prevAddOnIds =
                                  idx > 0 ? carpet.levels[idx - 1].addOnIds : [];
                                const newAddOns = level.addOnIds.filter(
                                  (id) => !prevAddOnIds.includes(id),
                                );
                                const newAddOnNames = newAddOns
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSel({ ...sel, levelId: level.id });
                                    }}
                                    className={`w-full text-left transition-colors ${
                                      isActive
                                        ? "bg-[#152644]/[0.04]"
                                        : "bg-white hover:bg-gray-50"
                                    }`}
                                  >
                                    <div className="p-3 sm:p-4 grid grid-cols-[20px_1fr] sm:grid-cols-[20px_minmax(160px,200px)_1fr] items-start gap-3 sm:gap-4">
                                      {/* Radio */}
                                      <div className="pt-0.5">
                                        <div
                                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            isActive
                                              ? "bg-[#152644] border-[#152644]"
                                              : "border-gray-300 bg-white"
                                          }`}
                                        >
                                          {isActive && (
                                            <Check
                                              className="h-3 w-3 text-white"
                                              strokeWidth={3}
                                            />
                                          )}
                                        </div>
                                      </div>

                                      {/* Tier label + tagline */}
                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span
                                            className={`inline-block w-2 h-2 rounded-full ${
                                              TIER_DOTS[idx % TIER_DOTS.length]
                                            }`}
                                          />
                                          <span className="text-sm sm:text-base font-bold text-[#152644]">
                                            {level.name}
                                          </span>
                                          {level.mostPopular && (
                                            <span className="text-[8.5px] font-bold uppercase tracking-wider bg-[#03D9E5]/10 text-[#03D9E5] px-1.5 py-0.5 leading-tight">
                                              Most Popular
                                            </span>
                                          )}
                                        </div>
                                        {level.tagline && (
                                          <p className="text-[11px] text-gray-500 mt-0.5">
                                            {level.tagline}
                                          </p>
                                        )}
                                      </div>

                                      {/* Bullets / + items */}
                                      <div className="col-span-2 sm:col-span-1 -mt-1 sm:mt-0">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 block mb-1.5">
                                          {includesLabel}
                                        </span>
                                        <div className="space-y-1">
                                          {idx === 0
                                            ? level.features.map((feat, fi) => (
                                                <div
                                                  key={fi}
                                                  className="flex items-start gap-1.5 text-[12px] sm:text-sm text-gray-700 leading-snug"
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
                                                  className="flex items-start gap-1.5 text-[12px] sm:text-sm text-gray-700 leading-snug"
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
                              {carpetActiveLevel.name} × {sel.areas}{" "}
                              {sel.areas === 1 ? "room" : "rooms"}
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

                  return (
                    <Card
                      key={service.id}
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
                            {/* Variants (upholstery) */}
                            {service.variants && (
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
                                        setVariantQuantities({
                                          ...variantQuantities,
                                          [service.id]: {
                                            ...variantQuantities[service.id],
                                            [variant.id]: isActive ? 0 : 1,
                                          },
                                        });
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
                              <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-3 mt-2 bg-gray-50/50 p-1 sm:p-1.5 border border-gray-100">
                                <span className="text-xs sm:text-sm font-medium text-gray-600">
                                  {service.unit === "sq ft" ? "Square Feet" :
                                   service.unit === "room" ? "Rooms" :
                                   service.unit === "vent" ? "Vents" : "Quantity"}
                                </span>
                                <div className="flex items-center gap-1 sm:gap-1.5">
                                  {service.unit !== "sq ft" && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7 sm:h-9 sm:w-9 shrink-0 text-gray-500 border-gray-200 hover:text-black hover:border-gray-400"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        decrementQuantity(service.id);
                                      }}
                                    >
                                      <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </Button>
                                  )}
                                  <Input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleQuantityChange(
                                        service.id,
                                        Number.parseInt(e.target.value) || 1,
                                      );
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-14 sm:w-24 h-7 sm:h-9 text-center text-xs sm:text-base font-semibold border-gray-200"
                                    style={{ borderRadius: 0 }}
                                  />
                                  {service.unit !== "sq ft" && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7 sm:h-9 sm:w-9 shrink-0 text-gray-500 border-gray-200 hover:text-black hover:border-gray-400"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        incrementQuantity(service.id);
                                      }}
                                    >
                                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 self-center ml-1 border-l border-gray-100 pl-2 sm:ml-3 sm:pl-4">
                            <div className="text-base sm:text-xl font-bold text-[#152644] tabular-nums">
                              {(() => {
                                const freq = serviceFrequency[service.id] ?? "none";
                                const discounted = serviceTotal * frequencyMultiplier(freq);
                                return freq === "none" ? (
                                  formatPrice(serviceTotal)
                                ) : (
                                  <div className="flex flex-col items-end leading-tight">
                                    <span>{formatPrice(Math.round(discounted))}</span>
                                    <span className="text-xs font-medium text-gray-400 line-through">
                                      {formatPrice(serviceTotal)}
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

            <div className="fixed bottom-0 left-0 right-0 md:sticky md:left-auto md:right-auto md:bottom-0 z-30 md:z-20 border-t border-gray-200 bg-white px-4 py-3 sm:px-8 sm:py-6 flex-shrink-0 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
              {selectedServices.length > 0 ? (
                <>
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
                              {belowMinimum
                                ? `${formatPrice(remaining)} to go`
                                : "Minimum met"}
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
                          {belowMinimum
                            ? `Add ${formatPrice(remaining)} to Continue`
                            : "Continue"}
                        </Button>
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="text-center py-6 sm:py-8 border border-dashed border-gray-300 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Select services to continue
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
