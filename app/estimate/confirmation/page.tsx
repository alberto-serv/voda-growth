"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { EstimateHeader } from "@/components/estimate-header"
import { Footer } from "@/components/footer"
import {
  CheckCircle,
  User,
  Phone,
  Mail,
  Home,
  TreePine,
  Building,
  MessageSquare,
  ArrowRight,
  Shield,
  DollarSign,
  Plus,
  Wind,
  Fan,
  Sparkles,
  Hammer,
} from "lucide-react"
import { format } from "date-fns"
import { formatPrice } from "@/lib/format"
import { PromoBanner } from "@/components/promo-banner"
import { getFlatOffer, LANDING_PROMO_CODE, LANDING_PROMO_PCT } from "@/lib/promo"
import { resolveTimeWindowLabel } from "@/lib/scheduling"
import {
  availableServices,
  resolveServiceLine,
  frequencyMultiplier,
  frequencyShortLabel,
  type ServiceFrequency,
} from "@/lib/services-catalog"


// Added interfaces and data for detailed order summary
interface AddOn {
  id: string
  name: string
  description: string
  price: number
  pricingType?: "flat" | "perUnit"
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

const carpetAddOns = [
  { id: "carpet-protector", name: "Carpet Protector / Stain Repellent", price: 45 },
  { id: "pet-odor-treatment", name: "Pet Odor & Stain Treatment", price: 75 },
  { id: "deodorizer-sanitizer", name: "Deodorizer / Sanitizer", price: 35 },
  { id: "advanced-spot-removal", name: "Advanced Spot & Stain Removal", price: 50 },
  { id: "furniture-moving", name: "Furniture Moving", price: 60 },
  { id: "vent-inspection", name: "Full Vent System Inspection", price: 65 },
  { id: "dryer-vent-repair", name: "Dryer Vent Repair / Reroute", price: 150 },
  { id: "grout-sealing", name: "Grout Sealing", price: 75 },
  { id: "fabric-protector", name: "Fabric Protector Application", price: 40 },
]

const TAX_RATE = 0.05

export default function ConfirmationPage() {
  const router = useRouter()
  const [bookingData, setBookingData] = useState<any>(null)

  useEffect(() => {
    // Load booking data from localStorage
    const storedData = localStorage.getItem("bookingConfirmation")
    if (storedData) {
      setBookingData(JSON.parse(storedData))
      // Clear the confirmation data after loading
      localStorage.removeItem("bookingConfirmation")
    } else {
      // If no booking data, redirect to start
      router.push("/estimate/services")
    }
  }, [router])

  const getSelectedServicesWithDetails = () => {
    if (!bookingData?.services?.selectedServices) {
      return []
    }

    return bookingData.services.selectedServices
      .map((serviceId: string) => {
        const service = availableServices.find((s) => s.id === serviceId)
        if (!service) return null

        const line = resolveServiceLine(service, bookingData.services)
        const quantities = bookingData.services.serviceQuantities || {}
        const displayQuantity = quantities[serviceId] || service.defaultQuantity
        const freq: ServiceFrequency =
          (bookingData.services.serviceFrequency?.[serviceId] as ServiceFrequency) ?? "none"

        return {
          id: line.id,
          name: line.displayName,
          price: formatPrice(line.numericPrice),
          numericPrice: line.numericPrice,
          frequency: freq,
          discountedNumericPrice: line.numericPrice * frequencyMultiplier(freq),
          defaultQuantity: displayQuantity,
          unit: service.unit,
          chargedToday: line.chargedToday,
          subLines: line.subLines,
        }
      })
      .filter(Boolean)
  }

  const getSelectedAddOnsWithDetails = () => {
    if (!bookingData?.services?.selectedAddOns) {
      return []
    }

    return bookingData.services.selectedAddOns
      .map((addOnId: string) => {
        const addOn = availableAddOns.find((a) => a.id === addOnId)
        if (!addOn) return null

        const quantity = bookingData.services.addOnQuantities?.[addOnId] || 1
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

  const getServicesBaseTotal = () => {
    const servicesWithDetails = getSelectedServicesWithDetails()
    return servicesWithDetails.reduce((total: number, service: any) => {
      return total + service.numericPrice
    }, 0)
  }

  const getAddOnsTotal = () => {
    const addOnsWithDetails = getSelectedAddOnsWithDetails()
    return addOnsWithDetails.reduce((total: number, addOn: any) => total + addOn.price, 0)
  }

  const getCarpetAddOnsTotal = () => {
    const selected: string[] = bookingData?.carpetAddOns || []
    return selected.reduce((total: number, id: string) => {
      const addOn = carpetAddOns.find((a) => a.id === id)
      return total + (addOn?.price || 0)
    }, 0)
  }

  const getSubtotal = () => {
    return getServicesBaseTotal() + getAddOnsTotal() + getCarpetAddOnsTotal()
  }

  const getDiscountAmount = () => {
    const services = getSelectedServicesWithDetails()
    const freqMap = bookingData?.services?.serviceFrequency || {}
    const total = services.reduce((sum: number, s: any) => {
      const freq: ServiceFrequency = freqMap[s.id] ?? "none"
      return sum + s.numericPrice * (1 - frequencyMultiplier(freq))
    }, 0)
    return Math.round(total)
  }

  const getPromoDiscount = () => {
    return bookingData?.promo?.discount || 0
  }

  const getDiscountedSubtotal = () => {
    return Math.max(0, getSubtotal() - getDiscountAmount() - getPromoDiscount())
  }

  const getTaxAmount = () => {
    return Math.round(getDiscountedSubtotal() * TAX_RATE)
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

  if (!bookingData) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <EstimateHeader title="Confirmation" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {(() => {
            const offer = getFlatOffer(bookingData?.promoCode ?? bookingData?.promo?.code)
            if (offer) return <PromoBanner label={offer.bannerLabel} className="mb-6 rounded-lg" />
            if (bookingData?.promoCode === LANDING_PROMO_CODE)
              return <PromoBanner percent={LANDING_PROMO_PCT} className="mb-6 rounded-lg" />
            return null
          })()}
          {/* Success Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#152644] mb-2">
              {bookingData?.emergency
                ? "Emergency Request Received!"
                : bookingData?.commercial
                ? "Commercial Inquiry Received!"
                : bookingData?.noService
                ? "Visit Scheduled!"
                : "Booking Confirmed!"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {bookingData?.emergency
                ? "Your emergency remediation request has been received. Our team will call you shortly to confirm timing and provide an on-site quote — no payment was collected."
                : bookingData?.commercial
                ? "Your commercial inquiry has been received. Our team will reach out to scope your project and provide a quote — no payment was collected."
                : bookingData?.noService
                ? "Your visit has been scheduled. Our team will reach out to confirm timing and provide an on-site quote — no payment was collected."
                : "Your cleaning service appointment has been successfully scheduled. We'll contact you to confirm the exact time and provide any additional details."}
            </p>
          </div>

          {/* Commercial inquiry banner */}
          {bookingData?.commercial && (
            <div className="mb-8 rounded-lg border-2 border-[#03D9E5]/30 bg-[#03D9E5]/10 p-4 max-w-2xl mx-auto">
              <div className="font-semibold text-[#152644]">Commercial Inquiry</div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Order Summary - Left Column */}
            <Card className="border-[#152644]/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-[#152644]">
                  <Shield className="h-5 w-5 text-[#152644]" />
                  <span>Order Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Appointment Details */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-medium">
                    <CheckCircle className="h-4 w-4 text-[#152644]" />
                    <span>Appointment Details</span>
                  </div>
                  <div className="space-y-1 pl-6">
                    {bookingData.customer.preferredDate && (
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(bookingData.customer.preferredDate), "EEEE, MMMM do, yyyy")}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {resolveTimeWindowLabel(bookingData.customer.timeWindow)}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Selected Services */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-medium">
                    <CheckCircle className="h-4 w-4 text-[#152644]" />
                    <span>Selected Services</span>
                  </div>
                  <div className="space-y-2 pl-6">
                    {/* Emergency remediation shown as a red selected service */}
                    {bookingData?.emergency && (
                      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-3">
                        <div className="flex items-center gap-2 font-semibold text-red-700">
                          <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            24/7
                          </span>
                          <span>{bookingData.emergency.damageType} Damage Remediation</span>
                        </div>
                      </div>
                    )}
                    {(() => {
                      const servicesWithDetails = getSelectedServicesWithDetails()
                      if (servicesWithDetails.length === 0) {
                        return bookingData?.emergency ? null : (
                          <div className="text-sm text-muted-foreground">No services selected</div>
                        )
                      }
                      return servicesWithDetails.map((service: any, index: number) => {
                        const isRecurring = service.frequency && service.frequency !== "none"
                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm gap-2">
                              <span className="text-muted-foreground break-words flex-1">
                                {service.name}
                              </span>
                              <span className="text-right flex-shrink-0">
                                <span className="block font-medium tabular-nums">
                                  {formatPrice(Math.round(service.discountedNumericPrice))}
                                  {isRecurring && (
                                    <span className="ml-1 text-[10px] font-medium text-muted-foreground">
                                      {frequencyShortLabel(service.frequency)}
                                    </span>
                                  )}
                                </span>
                                {isRecurring && (
                                  <span className="block text-[11px] font-medium text-gray-400 line-through tabular-nums">
                                    {formatPrice(service.numericPrice)}
                                  </span>
                                )}
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
                        )
                      })
                    })()}
                  </div>
                </div>

                {/* Interested in cleaning services (remediation follow-up) */}
                {bookingData?.interestedServices?.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-[#152644]" />
                      <span>Interested In</span>
                    </div>
                    <div className="space-y-1 pl-6">
                      {bookingData.interestedServices.map((id: string) => {
                        const svc = availableServices.find((s) => s.id === id)
                        if (!svc) return null
                        return (
                          <div key={id} className="text-sm text-muted-foreground break-words">
                            {svc.name}
                          </div>
                        )
                      })}
                      <p className="text-[11px] text-muted-foreground leading-snug pt-0.5">
                        We&apos;ll follow up with a quote on these — nothing was charged.
                      </p>
                    </div>
                  </div>
                )}

                {/* Add-Ons */}
                {getSelectedAddOnsWithDetails().length > 0 && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm font-medium">
                        <Plus className="h-4 w-4 text-[#152644]" />
                        <span>Add-Ons</span>
                      </div>
                      <div className="space-y-2 pl-6">
                        {getSelectedAddOnsWithDetails().map((addOn: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm gap-2">
                            <span className="text-muted-foreground break-words flex-1">
                              {addOn.name}
                              {addOn.pricingType === "perUnit" &&
                                ` (${addOn.quantity} ${addOn.unit}${addOn.quantity > 1 ? "s" : ""})`}
                            </span>
                            <span className="font-medium flex-shrink-0">{formatPrice(addOn.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Service Add-Ons */}
                {bookingData?.carpetAddOns?.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm font-medium">
                        <Plus className="h-4 w-4 text-[#152644]" />
                        <span>Add-Ons</span>
                      </div>
                      <div className="space-y-2 pl-6">
                        {bookingData.carpetAddOns.map((id: string) => {
                          const addOn = carpetAddOns.find((a: any) => a.id === id)
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
                  </>
                )}

                {(() => {
                  const freqMap = bookingData?.services?.serviceFrequency || {}
                  const subscribed = (bookingData?.services?.selectedServices || []).filter(
                    (id: string) => freqMap[id] && freqMap[id] !== "none",
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

                {/* Pricing/estimate hidden for emergency, commercial & no-service requests */}
                {!(bookingData?.emergency || bookingData?.commercial || bookingData?.noService) && (
                <>
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

                  {getPromoDiscount() > 0 && (
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-green-600 break-words flex-1">
                        Promo Code{bookingData?.promo?.code ? ` (${bookingData.promo.code})` : ""}
                      </span>
                      <span className="font-medium text-green-600 flex-shrink-0">
                        -{formatPrice(getPromoDiscount())}
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

                  {/* Charged today vs on-site balance — only shown when there's a
                      subscription charged today. One-time-only orders are paid in
                      full on site, so the Total Estimate above already says it. */}
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
                </>
                )}
              </CardContent>
            </Card>

            {/* Customer Details & What's Next - Right Column */}
            <Card className="border-[#152644]/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-[#152644]">
                  <User className="h-5 w-5 text-[#152644]" />
                  <span>Customer Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {bookingData.customer.firstName} {bookingData.customer.lastName}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="break-all">{bookingData.customer.email}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{bookingData.customer.phone}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="flex items-center space-x-2 text-[#152644] font-semibold mb-4">
                    <ArrowRight className="h-5 w-5 text-[#152644]" />
                    <span>What's Next?</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[#152644] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Confirmation Call</p>
                        <p className="text-sm text-muted-foreground">
                          Our team will contact you within 24 hours to confirm your appointment details.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[#152644] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Property Assessment</p>
                        <p className="text-sm text-muted-foreground">
                          Our professional team will arrive and conduct a final assessment before beginning work.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[#152644] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Service Completion</p>
                        <p className="text-sm text-muted-foreground">
                          We'll complete your cleaning service and ensure you're completely satisfied.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Return Home Button */}
          <div className="text-center">
            <Button
              onClick={() => router.push("/")}
              size="lg"
              className="px-8 bg-[#152644] hover:bg-[#152644]/90 text-white"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
