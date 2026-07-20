"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { EstimateHeader } from "@/components/estimate-header"
import { Footer } from "@/components/footer"
import { Textarea } from "@/components/ui/textarea"
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
import { PROMO_CODES, getPromoPercent, getFlatOffer, flatOfferDiscount, type FlatOffer, LANDING_PROMO_CODE, LANDING_PROMO_PCT } from "@/lib/promo"

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

const TAX_RATE = 0.05

// This checkout is shared by every flow that wants the scheduling-first
// treatment. `checkoutFlow` (stashed in estimateData by the services page) is
// what tells us which one the visitor actually came from, so "back to services"
// returns them to the page they started on instead of a sibling variant.
const SERVICES_ROUTE_BY_FLOW: Record<string, string> = {
  services5: "/services5",
  // services6 is the site homepage in this project (the carpet configurator),
  // so "back to services" for that flow returns to "/". The landing page also
  // writes checkoutFlow: "services6".
  services6: "/",
}
const servicesRouteFor = (flow: unknown): string =>
  SERVICES_ROUTE_BY_FLOW[String(flow)] ?? SERVICES_ROUTE_BY_FLOW.services5

// Build an estimate seeded with a flat offer's selection (e.g. the /offer $149
// sofa+loveseat deal). Lets the /offer CTAs skip the service picker and land the
// visitor straight on this scheduling step with the offer already applied. Mirrors
// the shape services6 writes, so the rest of checkout is unchanged. `prior` keeps
// any lead-capture data already stored.
function buildFlatOfferEstimate(offer: FlatOffer, prior: any) {
  const svc = availableServices.find((s) => s.id === offer.serviceId)
  const qtys: Record<string, number> = {}
  const prices: Record<string, number> = {}
  svc?.variants?.forEach((v) => {
    qtys[v.id] = offer.requiredVariants.includes(v.id) ? 1 : 0
    prices[v.id] = v.unitPrice
  })
  const discount = flatOfferDiscount(offer, prices, qtys)
  return {
    ...(prior ?? {}),
    services: {
      selectedServices: [offer.serviceId],
      serviceQuantities: {},
      variantQuantities: { [offer.serviceId]: qtys },
      carpetSelection: {},
      rugSelection: {},
      bundleUnits: {},
      serviceFrequency: { [offer.serviceId]: "none" },
      totalPrice: offer.flatPrice,
    },
    checkoutFlow: "services6",
    promoCode: offer.code,
    promo: { code: offer.code, discount, flat: true, label: offer.bannerLabel },
  }
}

export default function Customer5Page() {
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
    const data = storedData ? JSON.parse(storedData) : null

    // Fresh arrival from /offer (?promo=<flat offer>): seed the offer's selection
    // so the visitor lands straight on scheduling with the deal applied, without
    // passing through the service picker. Only when there isn't already an
    // in-progress estimate to preserve.
    const offer = getFlatOffer(new URLSearchParams(window.location.search).get("promo"))
    if (offer && !data?.services) {
      const seeded = buildFlatOfferEstimate(offer, data)
      localStorage.setItem("estimateData", JSON.stringify(seeded))
      setEstimateData(seeded)
      return
    }

    if (!data) {
      router.push(SERVICES_ROUTE_BY_FLOW.services5)
      return
    }

    if (!data.services) {
      router.push(servicesRouteFor(data.checkoutFlow))
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

  // Preselect the first available date and time so the scheduler arrives filled
  // in (the visitor can still change both). Runs once estimateData is loaded,
  // since availability depends on whether this is an emergency booking.
  useEffect(() => {
    if (!estimateData) return
    const first = availableDates[0]
    if (!first) return
    const unavailable = getUnavailableSlots(first)
    const firstSlot = timeSlots.find((s) => !unavailable.includes(s.value))?.value ?? ""
    setCustomerData((prev) =>
      prev.preferredDate
        ? prev
        : { ...prev, preferredDate: first, timeWindow: prev.timeWindow || firstSlot },
    )
    setCurrentMonth(startOfMonth(first))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimateData])

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

      // Skip the payment step and go straight to confirmation (which reads
      // `bookingConfirmation`) when there's nothing to collect a card for:
      // either an emergency / no-payment checkout, or an order of only one-time
      // services (subscriptions are charged today, one-time work is paid on site).
      if (updatedData.skipPayment || getChargedToday() === 0) {
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
  // services5-only checkout treatment: scheduling first + "Set Up My Appointment"
  // CTA. Other flows keep the original order and copy.
  // Dedicated services5 checkout route (/estimate/customer5): the services5
  // treatment (scheduling first, "Set Up My Appointment" CTA) always applies.
  const isServices5 = true
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
    return getTotalServicesPrice() + getTotalAddOnsPrice()
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

  const toggleInterest = (id: string) => {
    setInterestedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  // Cleaning services offered to remediation customers as a follow-up interest
  // list (the bundle is excluded — it's an upsell, not a single service).
  const interestServiceList = availableServices.filter((s) => !isBundleService(s))

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

  // Did the visitor arrive via a promo route? Gates the promo banner so it shows
  // only for promo-originated visits, not for manually-typed codes. Covers both
  // the /landing percentage promo and flat offers (e.g. the /offer $149 deal).
  const carriedOffer = getFlatOffer(estimateData?.promoCode ?? estimateData?.promo?.code)
  const isPromoOrigin = estimateData?.promoCode === LANDING_PROMO_CODE || !!carriedOffer

  // Auto-apply the promo carried in from the services flow so the discount is on
  // the moment the customer reaches this step — no code to type.
  useEffect(() => {
    if (!estimateData || appliedPromoCode) return
    // Flat offer (e.g. the $149 upholstery deal): the discount is a precomputed
    // dollar amount carried in `promo.discount`, not a percentage.
    const carried = estimateData.promo
    if (carried?.flat && carried.discount > 0) {
      setAppliedPromoCode(String(carried.code).toUpperCase())
      setPromoDiscount(carried.discount)
      return
    }
    const code = carried?.code ?? estimateData.promoCode
    const pct = getPromoPercent(code)
    if (pct <= 0) return
    const subtotal = getTotalServicesPrice() + getTotalAddOnsPrice()
    setAppliedPromoCode(String(code).toUpperCase())
    setPromoDiscount(Math.round(subtotal * (pct / 100)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimateData, appliedPromoCode])

  // Schedule Appointment card, rendered once and positioned differently per
  // flow: first (services5) or in its original spot (all other flows).
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
              {/* Day headers — keyed by index since S and T repeat. */}
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
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
                      aspect-square text-sm font-medium rounded-md transition-colors h-9 w-9 mx-auto
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

            <div className="space-y-3">
              {timeSlots.map((slot) => {
                const isUnavailable = getUnavailableSlots(customerData.preferredDate).includes(
                  slot.value,
                )
                const isSelected = customerData.timeWindow === slot.value
                return (
                  <button
                    key={slot.value}
                    type="button"
                    disabled={isUnavailable}
                    onClick={() => handleInputChange("timeWindow", slot.value)}
                    className={`w-full rounded-lg border px-4 py-3.5 text-left text-sm font-medium transition-colors
                      ${
                        isSelected
                          ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                          : isUnavailable
                            ? "cursor-not-allowed border-gray-200 text-gray-300 line-through"
                            : "border-gray-200 text-gray-900 hover:border-primary hover:bg-gray-50"
                      }`}
                  >
                    {slot.label}
                    {isUnavailable ? " — Unavailable" : ""}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <EstimateHeader title="Get an Estimate" step="Step 2 of 3" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">

          {isPromoOrigin && (
            carriedOffer ? (
              <PromoBanner label={carriedOffer.bannerLabel} className="mb-6 rounded-lg" />
            ) : (
              <PromoBanner percent={LANDING_PROMO_PCT} className="mb-6 rounded-lg" />
            )
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
                    Priority emergency request. We&apos;ll
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
                          follow up.
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
                    Share your details and we&apos;ll reach out
                    to scope your commercial project and provide a quote.
                  </p>
                </div>
              )}

              {/* Visit-without-service banner (no-payment checkout) */}
              {estimateData?.noService && (
                <div className="rounded-lg border-2 border-[#03D9E5]/30 bg-[#03D9E5]/10 p-4">
                  <div className="font-semibold text-[#152644]">Schedule a Visit</div>
                  <p className="mt-1 text-sm text-[#152644]/70">
                    Share your details and we&apos;ll confirm
                    your appointment and provide a quote on-site.
                  </p>
                </div>
              )}

              {/* services5 only: scheduling surfaced first, before services. */}
              {isServices5 && scheduleCard}

              {/* Selected Services */}
              {getSelectedServicesWithDetails().length > 0 && (
                <SelectedServicesCard
                  services={getSelectedServicesWithDetails()}
                  onFrequencyChange={updateServiceFrequency}
                  promoDiscount={promoDiscount}
                  promoCode={appliedPromoCode}
                />
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

              {/* Non-services5 flows: scheduling stays in its original position. */}
              {!isServices5 && scheduleCard}

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

                    {/* Charged today vs on-site balance — only shown when there's
                        a subscription charged today. For one-time-only orders the
                        whole total is paid on site, so the Total Estimate above
                        already says everything and this split is redundant. */}
                    {(() => {
                      const today = getChargedToday()
                      const onSite = getOnSiteBalance()
                      if (today <= 0) return null
                      return (
                        <div className="mt-2 rounded-lg border border-[#152644]/15 bg-[#152644]/[0.03] p-3 space-y-1.5">
                          <div className="flex justify-between text-sm gap-2">
                            <span className="font-medium text-[#152644] flex-1">Charged today</span>
                            <span className="font-semibold text-[#152644] tabular-nums flex-shrink-0">
                              {formatPrice(today)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm gap-2">
                            <span className="text-muted-foreground flex-1">Balance due at service</span>
                            <span className="font-medium tabular-nums flex-shrink-0">
                              {formatPrice(onSite)}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug pt-0.5">
                            Subscriptions are charged today; one-time services are paid on site once the work is done.
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
            {/* Always show the primary CTA; keep it disabled (greyed out) until the
                required fields are filled, so the next step is visible up front. */}
            <Button
              onClick={handleNext}
              disabled={!isFormComplete}
              size="lg"
              className="w-full bg-primary hover:bg-secondary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isServices5
                ? "Set Up My Appointment"
                : estimateData?.emergency || estimateData?.commercial || estimateData?.noService
                  ? "Continue"
                  : "Continue to Payment"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {!isFormComplete && (
              <p className="text-center text-sm text-muted-foreground">
                Please complete all required fields to continue
              </p>
            )}

            <Button
              variant="outline"
              onClick={() => router.push(servicesRouteFor(estimateData?.checkoutFlow))}
              className="w-full"
            >
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
