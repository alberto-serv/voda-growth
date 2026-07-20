"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { IntegratedHeader } from "@/components/integrated-header"
import { Footer } from "@/components/footer"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Clock,
  User,
  Mail,
  Phone,
  ArrowLeft,
  ArrowRight,
  MapPin,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Check,
  CheckCircle,
  Sparkles,
  Tag,
} from "lucide-react"
import {
  format,
  addDays,
  isWeekend,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns"
import { formatPrice } from "@/lib/format"
import {
  businessTimeSlots,
  EMERGENCY_NOTICE_HOURS,
  slotTo24Hour,
} from "@/lib/scheduling"
import {
  availableServices,
  resolveServiceLine,
  frequencyMultiplier,
  isBundleService,
  type ServiceFrequency,
} from "@/lib/services-catalog"
import { SelectedServicesCard } from "@/components/selected-services-card"
import { PromoBanner } from "@/components/promo-banner"
import { PROMO_CODES, getPromoPercent, LANDING_PROMO_CODE, LANDING_PROMO_PCT } from "@/lib/promo"

interface CustomerData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  preferredDate?: Date
  timeWindow: string
  additionalNotes?: string
}

interface AddOn {
  id: string
  name: string
  description: string
  price: number
  pricingType: string
  unit?: string
}

const availableAddOns: AddOn[] = [
  {
    id: "window-cleaning",
    name: "Window Cleaning",
    description: "Interior and exterior window cleaning",
    price: 8,
    pricingType: "perUnit",
    unit: "window",
  },
  {
    id: "gutter-guards",
    name: "Gutter Guard Installation",
    description: "Protect gutters from debris buildup",
    price: 350,
    pricingType: "flat",
  },
  {
    id: "concrete-sealing",
    name: "Concrete Sealing",
    description: "Protective sealant for driveways and walkways",
    price: 200,
    pricingType: "flat",
  },
  {
    id: "rust-removal",
    name: "Rust Stain Removal",
    description: "Specialized treatment for rust stains",
    price: 80,
    pricingType: "flat",
  },
]

// Service-specific add-ons mapped to which services they appear for
interface ServiceAddOn extends AddOn {
  forServices: string[]
}

const serviceAddOns: ServiceAddOn[] = [
  // Carpet cleaning add-ons
  {
    id: "carpet-protector",
    name: "Carpet Protector / Stain Repellent",
    description: "Scotchgard-type invisible barrier to prevent stains from setting and make future cleaning easier",
    price: 45,
    pricingType: "flat",
    forServices: ["carpet-cleaning"],
  },
  {
    id: "pet-odor-treatment",
    name: "Pet Odor & Stain Treatment",
    description: "Enzymatic cleaners to break down pet urine and odor from carpet backing",
    price: 75,
    pricingType: "flat",
    forServices: ["carpet-cleaning", "upholstery-cleaning"],
  },
  {
    id: "deodorizer-sanitizer",
    name: "Deodorizer / Sanitizer",
    description: "Sanitize to reduce allergens and bacteria, plus a fresh scent",
    price: 35,
    pricingType: "flat",
    forServices: ["carpet-cleaning", "upholstery-cleaning", "air-duct-cleaning"],
  },
  {
    id: "advanced-spot-removal",
    name: "Advanced Spot & Stain Removal",
    description: "Targeted treatment for wine, grease, heavy traffic areas, and other stubborn stains",
    price: 50,
    pricingType: "flat",
    forServices: ["carpet-cleaning", "tile-grout-stone", "hardwood-detailing"],
  },
  {
    id: "furniture-moving",
    name: "Furniture Moving",
    description: "Move, clean under, and replace heavy furniture during service",
    price: 60,
    pricingType: "flat",
    forServices: ["carpet-cleaning", "tile-grout-stone", "hardwood-detailing"],
  },
  // Dryer vent / air duct add-ons
  {
    id: "vent-inspection",
    name: "Full Vent System Inspection",
    description: "Comprehensive inspection with camera to identify blockages, damage, or fire hazards",
    price: 65,
    pricingType: "flat",
    forServices: ["dryer-vent-cleaning", "air-duct-cleaning"],
  },
  {
    id: "dryer-vent-repair",
    name: "Dryer Vent Repair / Reroute",
    description: "Fix damaged, crushed, or improperly routed dryer vent connections",
    price: 150,
    pricingType: "flat",
    forServices: ["dryer-vent-cleaning"],
  },
  // Tile & grout add-on
  {
    id: "grout-sealing",
    name: "Grout Sealing",
    description: "Apply protective sealant to grout lines to prevent future staining and moisture damage",
    price: 75,
    pricingType: "flat",
    forServices: ["tile-grout-stone"],
  },
  // Upholstery add-on
  {
    id: "fabric-protector",
    name: "Fabric Protector Application",
    description: "Protective coating to guard upholstery against spills, stains, and wear",
    price: 40,
    pricingType: "flat",
    forServices: ["upholstery-cleaning"],
  },
]

// Keep backward compat alias for carpet add-ons used in summary calculations
const carpetAddOns = serviceAddOns.filter(a => a.forServices.includes("carpet-cleaning"))

const TAX_RATE = 0.05

export default function CustomerPage() {
  const router = useRouter()
  const [customerData, setCustomerData] = useState<CustomerData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    timeWindow: "",
    additionalNotes: "",
  })
  const [estimateData, setEstimateData] = useState<any>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedCarpetAddOns, setSelectedCarpetAddOns] = useState<string[]>([])
  const [selectedRestorationRooms] = useState<string[]>([])
  // Remediation no-pay flow: cleaning services the customer flags interest in.
  const [interestedServices, setInterestedServices] = useState<string[]>([])
  const [interestOpen, setInterestOpen] = useState(false)
  
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState("")

  useEffect(() => {
    const storedData = localStorage.getItem("estimateData")

    if (!storedData) {
      router.push("/estimate/services")
      return
    }

    const data = JSON.parse(storedData)

    if (!data.services) {
      router.push("/estimate/services")
    } else {
      setEstimateData(data)
      // Pre-fill name, email, and phone from lead capture
      if (data.lead) {
        setCustomerData((prev: CustomerData) => ({
          ...prev,
          firstName: data.lead.firstName || prev.firstName,
          lastName: data.lead.lastName || prev.lastName,
          email: data.lead.email || prev.email,
          phone: data.lead.phone || prev.phone,
        }))
      }
    }
  }, [router])

  const handleInputChange = (field: keyof CustomerData, value: string | Date) => {
    const newData = { ...customerData, [field]: value }
    // Clear time slot when date changes (availability differs per date)
    if (field === "preferredDate") {
      const unavailable = getUnavailableSlots(value as Date)
      if (unavailable.includes(newData.timeWindow)) {
        newData.timeWindow = ""
      }
    }
    setCustomerData(newData)
  }

  const handleNext = () => {
    if (isFormComplete) {
      // Update localStorage with customer data
      const storedData = JSON.parse(localStorage.getItem("estimateData") || "{}")
      const updatedData = {
        ...storedData,
        customer: customerData,
        carpetAddOns: selectedCarpetAddOns,
        restorationRooms: selectedRestorationRooms,
        interestedServices,
        ...(appliedPromoCode ? {
          promo: {
            code: appliedPromoCode,
            discount: promoDiscount
          }
        } : {})
      }
      localStorage.setItem("estimateData", JSON.stringify(updatedData))

      // Emergency / no-payment checkout: skip the payment step entirely and go
      // straight to confirmation (which reads `bookingConfirmation`).
      if (updatedData.skipPayment) {
        localStorage.setItem("bookingConfirmation", JSON.stringify(updatedData))
        localStorage.removeItem("estimateData")
        router.push("/estimate/confirmation")
      } else {
        router.push("/estimate/payment")
      }
    }
  }

  const isFormComplete =
    customerData.firstName &&
    customerData.lastName &&
    customerData.email &&
    customerData.phone &&
    customerData.address &&
    customerData.preferredDate &&
    customerData.timeWindow

  // Emergency / remediation requests can be booked same-day and on weekends, but
  // use the same business-hours windows as commercial bookings — the only extra
  // constraint is the team's lead time.
  const isEmergency = !!estimateData?.emergency
  const timeSlots = businessTimeSlots

  const getAvailableDates = () => {
    const dates = []
    // Emergency requests can be same-day; regular bookings start tomorrow.
    let currentDate = isEmergency ? startOfDay(new Date()) : addDays(new Date(), 1)

    while (dates.length < 60) {
      // Extended range for calendar view. Emergency includes weekends.
      if (isEmergency || !isWeekend(currentDate)) {
        dates.push(new Date(currentDate))
      }
      currentDate = addDays(currentDate, 1)
    }

    return dates
  }

  const availableDates = getAvailableDates()

  const getUnavailableSlots = (date: Date | undefined) => {
    if (!date) return []

    if (isEmergency) {
      // Only today is constrained — require EMERGENCY_NOTICE_HOURS of lead time.
      if (!isToday(date)) return []
      const now = new Date()
      const earliestHour = now.getHours() + EMERGENCY_NOTICE_HOURS + (now.getMinutes() > 0 ? 1 : 0)
      return businessTimeSlots
        .filter((slot) => slotTo24Hour(slot.value) < earliestHour)
        .map((slot) => slot.value)
    }

    const day = date.getDate()
    const unavailableIndexes = [day % 6, (day + 2) % 6, (day + 5) % 6]
    return [...new Set(unavailableIndexes)].map((i) => timeSlots[i]?.value).filter(Boolean)
  }

  const isDateAvailable = (date: Date) => {
    return availableDates.some((availableDate) => availableDate.toDateString() === date.toDateString())
  }

  const generateCalendarDays = () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })

    // Add padding days from previous month
    const startDay = start.getDay()
    const paddingDays = []
    for (let i = startDay - 1; i >= 0; i--) {
      paddingDays.push(addDays(start, -i - 1))
    }

    return [...paddingDays, ...days]
  }

  const calendarDays = generateCalendarDays()

  const getSelectedServicesWithDetails = () => {
    if (!estimateData?.services?.selectedServices) {
      return []
    }

    return estimateData.services.selectedServices
      .map((serviceId: string) => {
        const service = availableServices.find((s) => s.id === serviceId)
        if (!service) return null

        const line = resolveServiceLine(service, estimateData.services)
        const freq: ServiceFrequency =
          (estimateData.services.serviceFrequency?.[serviceId] as ServiceFrequency) ?? "none"

        return {
          id: line.id,
          name: line.displayName,
          price: formatPrice(line.numericPrice),
          numericPrice: line.numericPrice,
          frequency: freq,
          discountedNumericPrice: line.numericPrice * frequencyMultiplier(freq),
          recurrenceOptions: service.recurrenceOptions,
          chargedToday: line.chargedToday,
          subLines: line.subLines,
        }
      })
      .filter(Boolean)
  }

  const updateServiceFrequency = (serviceId: string, freq: ServiceFrequency) => {
    setEstimateData((prev: any) => {
      if (!prev) return prev
      const nextFreqMap: Record<string, ServiceFrequency> = {
        ...(prev.services?.serviceFrequency ?? {}),
        [serviceId]: freq,
      }
      const next = {
        ...prev,
        services: { ...prev.services, serviceFrequency: nextFreqMap },
      }
      try {
        localStorage.setItem("estimateData", JSON.stringify(next))
      } catch {
        // ignore persistence errors
      }
      return next
    })
  }

  const getTotalServicesPrice = () => {
    const servicesWithDetails = getSelectedServicesWithDetails()
    return servicesWithDetails.reduce((total: number, service: any) => {
      return total + service.numericPrice
    }, 0)
  }

  const getSubtotal = () => {
    return getTotalServicesPrice() + getTotalAddOnsPrice() + getCarpetAddOnsTotal()
  }

  const getDiscountAmount = () => {
    const services = getSelectedServicesWithDetails()
    const freqMap = estimateData?.services?.serviceFrequency || {}
    const total = services.reduce((sum: number, s: any) => {
      const freq: ServiceFrequency = freqMap[s.id] ?? "none"
      return sum + s.numericPrice * (1 - frequencyMultiplier(freq))
    }, 0)
    return Math.round(total)
  }

  const hasAnySubscription = () => {
    const freqMap = estimateData?.services?.serviceFrequency || {}
    return (estimateData?.services?.selectedServices || []).some(
      (id: string) => freqMap[id] === "annual" || freqMap[id] === "6-month",
    )
  }

  const getDiscountedSubtotal = () => {
    return Math.max(0, getSubtotal() - getDiscountAmount() - promoDiscount)
  }

  const getTaxAmount = () => {
    return Math.round(getDiscountedSubtotal() * TAX_RATE)
  }

  const getSelectedAddOnsWithDetails = () => {
    if (!estimateData?.services?.selectedAddOns) {
      return []
    }

    return estimateData.services.selectedAddOns
      .map((addOnId: string) => {
        const addOn = availableAddOns.find((a) => a.id === addOnId)
        if (!addOn) return null

        const quantity = estimateData.services.addOnQuantities?.[addOnId] || 1
        const totalPrice = addOn.price * quantity

        return {
          id: addOn.id,
          name: addOn.name,
          price: totalPrice,
          quantity: quantity,
          unitPrice: addOn.price,
          pricingType: addOn.pricingType,
          unit: addOn.unit,
        }
      })
      .filter(Boolean)
  }

  const getTotalAddOnsPrice = () => {
    const addOnsWithDetails = getSelectedAddOnsWithDetails()
    return addOnsWithDetails.reduce((total: number, addOn: any) => total + addOn.price, 0)
  }

  const handleApplyPromoCode = () => {
    setPromoError("")

    const upperPromoCode = promoCode.toUpperCase()

    if (PROMO_CODES[upperPromoCode]) {
      const discountPercent = PROMO_CODES[upperPromoCode]
      const servicesWithDetails = getSelectedServicesWithDetails()
      const servicesTotal = servicesWithDetails.reduce((total: number, service: any) => {
        return typeof service.numericPrice === "string" ? total : total + service.numericPrice
      }, 0)
      const addOnsWithDetails = getSelectedAddOnsWithDetails()
      const addOnsTotal = addOnsWithDetails.reduce((total: number, addOn: any) => total + addOn.price, 0)
      const subtotal = servicesTotal + addOnsTotal
      const discount = Math.round(subtotal * (discountPercent / 100))

      setAppliedPromoCode(upperPromoCode)
      setPromoDiscount(discount)
      setPromoCode("")
    } else {
      setPromoError("Invalid promo code")
    }
  }

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(null)
    setPromoDiscount(0)
    setPromoError("")
  }

  const getCarpetAddOnsTotal = () => {
    return selectedCarpetAddOns.reduce((total, id) => {
      const addOn = serviceAddOns.find((a) => a.id === id)
      return total + (addOn?.price || 0)
    }, 0)
  }

  const toggleAddOn = (id: string) => {
    setSelectedCarpetAddOns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleInterest = (id: string) => {
    setInterestedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  // Cleaning services offered to remediation customers as a follow-up interest
  // list (the bundle is excluded — it's an upsell, not a single service).
  const interestServiceList = availableServices.filter((s) => !isBundleService(s))

  // A bundle's add-ons are the union of add-ons for the services it contains.
  const BUNDLE_ADDON_SERVICE_IDS: Record<string, string[]> = {
    "healthy-home-bundle": [
      "carpet-cleaning",
      "air-duct-cleaning",
      "dryer-vent-cleaning",
      "upholstery-cleaning",
    ],
  }

  // Group available add-ons by each selected service (or bundle), so the add-on
  // section renders one titled block per service.
  const getAddOnGroups = (): { id: string; title: string; addOns: ServiceAddOn[] }[] => {
    const selectedIds: string[] = estimateData?.services?.selectedServices ?? []
    const groups: { id: string; title: string; addOns: ServiceAddOn[] }[] = []
    for (const sid of selectedIds) {
      const svc = availableServices.find((s) => s.id === sid)
      if (!svc) continue
      const sourceIds = BUNDLE_ADDON_SERVICE_IDS[sid] ?? [sid]
      const seen = new Set<string>()
      const addOns: ServiceAddOn[] = []
      for (const addOn of serviceAddOns) {
        if (addOn.forServices.some((f) => sourceIds.includes(f)) && !seen.has(addOn.id)) {
          seen.add(addOn.id)
          addOns.push(addOn)
        }
      }
      if (addOns.length > 0) groups.push({ id: sid, title: svc.name, addOns })
    }
    return groups
  }
  const getFinalTotal = () => {
    return getDiscountedSubtotal() + getTaxAmount()
  }

  // Pre-tax amount billed today: recurring (subscription) services in full plus
  // any bundle up-front portion. One-time services and add-ons are paid on site.
  const getTodayPreTax = () => {
    const services = getSelectedServicesWithDetails()
    return services.reduce((sum: number, s: any) => {
      if (typeof s.chargedToday === "number") return sum + s.chargedToday
      const recurring = s.frequency && s.frequency !== "none"
      return recurring ? sum + s.discountedNumericPrice : sum
    }, 0)
  }

  // Tax-inclusive amount charged today: the recurring/bundle share. Allocated as
  // that portion's share of the pre-tax discounted subtotal times the rounded
  // final total — so it reconciles exactly and snaps to $0 (nothing recurring) or
  // the full total (everything recurring) without the residue that differencing
  // two independently-rounded bases would leave. Shared across all flows.
  const getChargedToday = () => {
    const disc = getDiscountedSubtotal()
    if (disc <= 0) return 0
    const todayPreTax = Math.max(0, Math.min(disc, getTodayPreTax()))
    return Math.round(Math.round(getFinalTotal()) * (todayPreTax / disc))
  }

  // Everything else is due on site; the two always reconcile to the final total.
  const getOnSiteBalance = () => {
    return Math.max(0, Math.round(getFinalTotal()) - getChargedToday())
  }

  // Did the visitor arrive via the /landing promo? Gates the promo banner so it
  // shows only for that route, not for manually-typed codes.
  const isPromoOrigin = estimateData?.promoCode === LANDING_PROMO_CODE

  // Auto-apply the promo carried in from /services2 (e.g. RESIDENTIAL15) so the
  // discount is on the moment the customer reaches this step — no code to type.
  useEffect(() => {
    if (!estimateData || appliedPromoCode) return
    const code = estimateData.promo?.code ?? estimateData.promoCode
    const pct = getPromoPercent(code)
    if (pct <= 0) return
    const subtotal = getTotalServicesPrice() + getTotalAddOnsPrice()
    setAppliedPromoCode(String(code).toUpperCase())
    setPromoDiscount(Math.round(subtotal * (pct / 100)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimateData, appliedPromoCode])

  // Schedule Appointment card.
  const scheduleCard = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-base md:text-lg text-foreground">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <span>Schedule Appointment</span>
            <p className="text-sm font-normal text-muted-foreground mt-1">
              {isEmergency
                ? "Choose a day and time that works for you — same-day and weekend appointments are available. Please allow at least 2 hours' notice so we can dispatch a crew."
                : "Please choose your preferred appointment window. Our team will get in touch with you to confirm the exact appointment time."}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </Button>
              <h4 className="text-base font-medium text-foreground">{format(currentMonth, "MMMM yyyy")}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1"
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isSelected = customerData.preferredDate && isSameDay(day, customerData.preferredDate)
                const isAvailable = isDateAvailable(day) && isCurrentMonth
                // Emergency requests allow same-day booking.
                const isPast = isEmergency ? day < startOfDay(new Date()) : day < new Date()

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (isAvailable && !isPast) {
                        handleInputChange("preferredDate", day)
                      }
                    }}
                    disabled={!isAvailable || isPast}
                    className={`
                      aspect-square text-xs font-medium rounded transition-colors h-8 w-8 mx-auto
                      ${isSelected
                        ? "bg-primary text-primary-foreground"
                        : isAvailable && !isPast
                          ? "hover:bg-gray-100 text-gray-900"
                          : "text-gray-300 cursor-not-allowed"
                      }
                      ${!isCurrentMonth ? "text-gray-300" : ""}
                    `}
                  >
                    {format(day, "d")}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-700">Select Appointment Time</h3>

            <Select
              value={customerData.timeWindow || undefined}
              onValueChange={(value) => handleInputChange("timeWindow", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => {
                  const isUnavailable = getUnavailableSlots(customerData.preferredDate).includes(
                    slot.value,
                  )
                  return (
                    <SelectItem key={slot.value} value={slot.value} disabled={isUnavailable}>
                      {slot.label}
                      {isUnavailable ? " — Unavailable" : ""}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <IntegratedHeader title="Get an Estimate" step="Step 2 of 3" />

      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">

          {isPromoOrigin && (
            <PromoBanner percent={LANDING_PROMO_PCT} className="mb-6 rounded-lg" />
          )}

          {/* min-w-0 on the columns: a grid item's automatic minimum size is its
              min-content, so a wide non-shrinking row inside (the frequency
              picker) would otherwise widen the whole track past the viewport and
              scroll the page sideways on a phone. The picker scrolls internally
              instead. */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Contact & Scheduling */}
            <div
              className={`space-y-6 min-w-0 ${
                estimateData?.emergency || estimateData?.commercial || estimateData?.noService
                  ? "lg:col-span-3"
                  : "lg:col-span-2"
              }`}
            >
              <div>
                <h2 className="text-lg md:text-xl font-semibold mb-2">Contact Details & Scheduling</h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  Provide your contact information and preferred appointment time.
                </p>
              </div>

              {/* Emergency / restoration request banner (no-payment checkout) */}
              {estimateData?.emergency && (
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 font-semibold text-red-700">
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      24/7
                    </span>
                    <span>{estimateData.emergency.damageType} Damage Remediation</span>
                  </div>
                  <p className="mt-1 text-sm text-red-700/80">
                    Priority emergency request — no payment is collected now. We&apos;ll
                    confirm your appointment and provide an on-site quote.
                  </p>
                </div>
              )}

              {/* Remediation no-pay flow: optional interest in cleaning services.
                  Collapsed under a link; selections are sent with the request so
                  the team can follow up. Nothing is charged. */}
              {estimateData?.emergency && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setInterestOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-base font-semibold text-[#152644] underline decoration-[#03D9E5] decoration-2 underline-offset-4 hover:text-[#03D9E5] transition-colors"
                  >
                    Interested in cleaning services?
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${interestOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {interestOpen && (
                    <Card>
                      <CardContent className="space-y-2 p-4">
                        <p className="text-sm text-muted-foreground">
                          Pick any you&apos;d like a quote on — we&apos;ll include them when we
                          follow up. Nothing is charged now.
                        </p>
                        {interestServiceList.map((svc) => {
                          const selected = interestedServices.includes(svc.id)
                          return (
                            <button
                              key={svc.id}
                              type="button"
                              onClick={() => toggleInterest(svc.id)}
                              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                selected
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                      selected
                                        ? "border-primary bg-primary text-white"
                                        : "border-gray-300"
                                    }`}
                                  >
                                    {selected && <Check className="h-3.5 w-3.5" />}
                                  </span>
                                  <span className="truncate text-sm font-medium text-foreground">
                                    {svc.name}
                                  </span>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Commercial inquiry banner (no-payment checkout) */}
              {estimateData?.commercial && (
                <div className="rounded-lg border-2 border-[#03D9E5]/30 bg-[#03D9E5]/10 p-4">
                  <div className="font-semibold text-[#152644]">Commercial Inquiry</div>
                  <p className="mt-1 text-sm text-[#152644]/70">
                    No payment is collected now. Share your details and we&apos;ll reach out
                    to scope your commercial project and provide a quote.
                  </p>
                </div>
              )}

              {/* Visit-without-service banner (no-payment checkout) */}
              {estimateData?.noService && (
                <div className="rounded-lg border-2 border-[#03D9E5]/30 bg-[#03D9E5]/10 p-4">
                  <div className="font-semibold text-[#152644]">Schedule a Visit</div>
                  <p className="mt-1 text-sm text-[#152644]/70">
                    No payment is collected now. Share your details and we&apos;ll confirm
                    your appointment and provide a quote on-site.
                  </p>
                </div>
              )}

              {/* Selected Services */}
              {getSelectedServicesWithDetails().length > 0 && (
                <SelectedServicesCard
                  services={getSelectedServicesWithDetails()}
                  onFrequencyChange={updateServiceFrequency}
                  promoDiscount={promoDiscount}
                  promoCode={appliedPromoCode}
                />
              )}

              {/* Add-Ons — one titled section per selected service (or bundle).
                  Regular flow only; add-ons are paid on site, never today. */}
              {!(estimateData?.emergency || estimateData?.commercial || estimateData?.noService) &&
                getAddOnGroups().length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-base md:text-lg text-foreground">
                        <Plus className="h-5 w-5 text-primary" />
                        <span>Add-Ons</span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Enhance your selected services. Add-ons are paid on site — not charged today.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {getAddOnGroups().map((group) => (
                        <div key={group.id} className="space-y-2">
                          <h4 className="text-sm font-semibold text-foreground">{group.title}</h4>
                          <div className="space-y-2">
                            {group.addOns.map((addOn) => {
                              const selected = selectedCarpetAddOns.includes(addOn.id)
                              return (
                                <button
                                  key={`${group.id}-${addOn.id}`}
                                  type="button"
                                  onClick={() => toggleAddOn(addOn.id)}
                                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                    selected
                                      ? "border-primary bg-primary/5"
                                      : "border-gray-200 hover:border-gray-300"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                      <span
                                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                          selected
                                            ? "border-primary bg-primary text-white"
                                            : "border-gray-300"
                                        }`}
                                      >
                                        {selected && <Check className="h-3.5 w-3.5" />}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="text-sm font-medium text-foreground">
                                          {addOn.name}
                                        </div>
                                        {addOn.description && (
                                          <div className="mt-0.5 text-xs text-muted-foreground">
                                            {addOn.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <span className="flex-shrink-0 text-sm font-semibold text-foreground">
                                      +{formatPrice(addOn.price)}
                                    </span>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base md:text-lg text-foreground">
                    <User className="h-5 w-5 text-primary" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={customerData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={customerData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="pl-10"
                        value={customerData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        className="pl-10"
                        value={customerData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This phone number will be used to communicate with you
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Service Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base md:text-lg text-foreground">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>Service Address</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      placeholder="123 Main St, City, State ZIP"
                      value={customerData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes" className="text-sm font-medium text-muted-foreground">
                      Additional Notes (Optional)
                    </Label>
                    <Textarea
                      id="additionalNotes"
                      placeholder="e.g., Areas requiring attention, water damage extent, stain locations, pet information, access instructions, gate code, preferred cleaning products, allergies, or any special concerns"
                      value={customerData.additionalNotes}
                      onChange={(e) => {
                        const value = e.target.value.slice(0, 500)
                        handleInputChange("additionalNotes", value)
                      }}
                      className="min-h-[100px] resize-none"
                      maxLength={500}
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {customerData.additionalNotes?.length || 0}/500 characters
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Appointment */}
              {scheduleCard}

              {/* Promo Code Component — hidden on no-payment flows (emergency,
                  commercial, no-service) and when a service is on a subscription. */}
              {!hasAnySubscription() &&
                !(estimateData?.emergency || estimateData?.commercial || estimateData?.noService) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base md:text-lg text-foreground">
                      <Tag className="h-5 w-5 text-primary" />
                      <span>Promo Code</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appliedPromoCode ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            {appliedPromoCode} applied
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePromoCode}
                          className="text-green-700 hover:text-green-800"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id="customerPromoCode"
                            placeholder="Enter promo code"
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(e.target.value)
                              setPromoError("")
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && promoCode.trim()) {
                                handleApplyPromoCode()
                              }
                            }}
                          />
                          <Button variant="outline" onClick={handleApplyPromoCode} disabled={!promoCode.trim()}>
                            Apply
                          </Button>
                        </div>
                        {promoError && <p className="text-sm text-red-600">{promoError}</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Summary (hidden for emergency/commercial/no-service no-payment) */}
            {!(estimateData?.emergency || estimateData?.commercial || estimateData?.noService) && (
            <div className="lg:col-span-1 min-w-0">
              <Card className="lg:sticky lg:top-24">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* Appointment Details */}
                  {customerData.preferredDate && customerData.timeWindow && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm font-medium text-foreground">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>Appointment Details</span>
                        </div>
                        <div className="space-y-1 pl-6">
                          <div className="text-sm text-muted-foreground">
                            {format(customerData.preferredDate, "EEEE, MMMM do, yyyy")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {timeSlots.find((s) => s.value === customerData.timeWindow)?.label}
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Selected Services */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm font-medium text-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Selected Services</span>
                    </div>
                    <div className="space-y-2 pl-6">
                      {(() => {
                        const servicesWithDetails = getSelectedServicesWithDetails()
                        return servicesWithDetails.length > 0 ? (
                          servicesWithDetails.map((service: any, index: number) => (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between text-sm gap-2">
                                <span className="text-muted-foreground break-words flex-1">{service.name}</span>
                                <span className="font-medium flex-shrink-0">
                                  {typeof service.price === "string" ? service.price : `$${service.price}`}
                                </span>
                              </div>
                              {service.subLines?.length > 0 && (
                                <div className="space-y-0.5 pl-3">
                                  {service.subLines.map((sub: any, si: number) => (
                                    <div key={si} className="flex justify-between text-xs gap-2">
                                      <span className="text-muted-foreground/70 break-words flex-1">{sub.label}</span>
                                      <span className="text-muted-foreground/70 tabular-nums flex-shrink-0">
                                        {formatPrice(sub.numericPrice)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {estimateData ? "No services selected" : "Loading services..."}
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Add-Ons (paid on site — not charged today) */}
                  {selectedCarpetAddOns.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm font-medium text-foreground">
                        <Plus className="h-4 w-4 text-primary" />
                        <span>Add-Ons</span>
                      </div>
                      <div className="space-y-2 pl-6">
                        {selectedCarpetAddOns.map((id) => {
                          const addOn = serviceAddOns.find((a) => a.id === id)
                          if (!addOn) return null
                          return (
                            <div key={id} className="flex justify-between text-sm gap-2">
                              <span className="text-muted-foreground break-words flex-1">{addOn.name}</span>
                              <span className="font-medium flex-shrink-0">{formatPrice(addOn.price)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Subscription Indicator */}
                  {(() => {
                    const freqMap = estimateData?.services?.serviceFrequency || {}
                    const subscribed = (estimateData?.services?.selectedServices || []).filter(
                      (id: string) => freqMap[id] === "annual" || freqMap[id] === "6-month",
                    )
                    if (subscribed.length === 0) return null
                    return (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-700 font-medium">
                          ✓ {subscribed.length} {subscribed.length === 1 ? "subscription" : "subscriptions"}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Your subscribed services will renew automatically with savings applied.
                        </p>
                      </div>
                    )
                  })()}

                  <Separator />

                  {/* Pricing Stack */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-muted-foreground flex-1">Subtotal</span>
                      <span className="font-medium flex-shrink-0">{formatPrice(getSubtotal())}</span>
                    </div>

                    {getDiscountAmount() > 0 && (
                      <div className="flex justify-between text-sm gap-2">
                        <span className="text-green-600 break-words flex-1">
                          Subscription Savings
                        </span>
                        <span className="font-medium text-green-600 flex-shrink-0">
                          -{formatPrice(getDiscountAmount())}
                        </span>
                      </div>
                    )}

                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-sm gap-2">
                        <span className="text-green-600 break-words flex-1">Promo Code ({appliedPromoCode})</span>
                        <span className="font-medium text-green-600 flex-shrink-0">
                          -{formatPrice(promoDiscount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-muted-foreground flex-1">Estimated Tax (5%)</span>
                      <span className="font-medium flex-shrink-0">{formatPrice(getTaxAmount())}</span>
                    </div>

                    <Separator className="my-2" />

                    <div className="flex items-center justify-between font-semibold">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-[#152644]" />
                        <span>Total Estimate</span>
                      </div>
                      <span className="text-lg text-[#152644]">{formatPrice(getFinalTotal())}</span>
                    </div>

                    {/* Charged today vs on-site balance */}
                    {(() => {
                      const today = getChargedToday()
                      const onSite = getOnSiteBalance()
                      return (
                        <div className="mt-2 rounded-lg border border-[#152644]/15 bg-[#152644]/[0.03] p-3 space-y-1.5">
                          {today > 0 && (
                            <div className="flex justify-between text-sm gap-2">
                              <span className="font-medium text-[#152644] flex-1">Charged today</span>
                              <span className="font-semibold text-[#152644] tabular-nums flex-shrink-0">
                                {formatPrice(today)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm gap-2">
                            <span className="text-muted-foreground flex-1">
                              {today > 0 ? "Balance due at service" : "Balance due at time of service"}
                            </span>
                            <span className="font-medium tabular-nums flex-shrink-0">
                              {formatPrice(onSite)}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug pt-0.5">
                            {today > 0
                              ? "Subscriptions are charged today; one-time services are paid on site once the work is done."
                              : "Your balance is collected on site once the work is done."}
                          </p>
                        </div>
                      )
                    })()}

                    <p className="text-xs text-muted-foreground italic">
                      *Final price may vary based on property inspection and actual service requirements
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            )}
          </div>

          <div className="flex flex-col gap-4 pt-6 border-t mt-8">
            {isFormComplete ? (
              <Button
                onClick={handleNext}
                size="lg"
                className="w-full bg-primary hover:bg-secondary text-primary-foreground"
              >
                {estimateData?.emergency || estimateData?.commercial || estimateData?.noService
                  ? "Continue"
                  : "Continue to Payment"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Please complete all required fields to continue</p>
              </div>
            )}

            <Button variant="outline" onClick={() => router.push("/estimate/services")} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
