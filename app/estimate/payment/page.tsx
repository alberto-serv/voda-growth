"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { EstimateHeader } from "@/components/estimate-header"
import { Footer } from "@/components/footer"
import { DollarSign } from "lucide-react"
import { CreditCard, CheckCircle, Home, TreePine, Building, Droplets, ArrowLeft, Tag } from "lucide-react"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { formatPrice } from "@/lib/format"
import { resolveTimeWindowLabel } from "@/lib/scheduling"
import {
  availableServices,
  resolveServiceLine,
  frequencyMultiplier,
  type ServiceFrequency,
} from "@/lib/services-catalog"
import { PromoBanner } from "@/components/promo-banner"
import { PROMO_CODES, getFlatOffer, LANDING_PROMO_CODE, LANDING_PROMO_PCT } from "@/lib/promo"

const serviceDetails = {
  "dryer-vent-special": { name: "Dryer Vent Cleaning Special", icon: <Home className="h-4 w-4" /> },
  "roof-access": { name: "Roof Access Vent Cleaning", icon: <Building className="h-4 w-4" /> },
  "second-floor": { name: "Second Floor Cleaning", icon: <Building className="h-4 w-4" /> },
  "dryer-vent-cleaning": { name: "Dryer Vent Cleaning", icon: <Home className="h-4 w-4" /> },
  "ac-duct-cleaning": { name: "AC or DUCT Cleaning", icon: <Droplets className="h-4 w-4" /> },
  "repair-estimate": { name: "Repair or Reroute Estimate", icon: <TreePine className="h-4 w-4" /> },
}


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

const TAX_RATE = 0.05

const carpetAddOns: AddOn[] = [
  { id: "carpet-protector", name: "Carpet Protector / Stain Repellent", description: "", price: 45, pricingType: "flat" },
  { id: "pet-odor-treatment", name: "Pet Odor & Stain Treatment", description: "", price: 75, pricingType: "flat" },
  { id: "deodorizer-sanitizer", name: "Deodorizer / Sanitizer", description: "", price: 35, pricingType: "flat" },
  { id: "advanced-spot-removal", name: "Advanced Spot & Stain Removal", description: "", price: 50, pricingType: "flat" },
  { id: "furniture-moving", name: "Furniture Moving", description: "", price: 60, pricingType: "flat" },
  { id: "vent-inspection", name: "Full Vent System Inspection", description: "", price: 65, pricingType: "flat" },
  { id: "dryer-vent-repair", name: "Dryer Vent Repair / Reroute", description: "", price: 150, pricingType: "flat" },
  { id: "grout-sealing", name: "Grout Sealing", description: "", price: 75, pricingType: "flat" },
  { id: "fabric-protector", name: "Fabric Protector Application", description: "", price: 40, pricingType: "flat" },
]


export default function PaymentPage() {
  const router = useRouter()
  const [estimateData, setEstimateData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  })
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [isProcessing, setIsProcessing] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

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

  useEffect(() => {
    const storedData = localStorage.getItem("estimateData")
    if (!storedData) {
      router.push("/estimate/services")
      return
    }

    const data = JSON.parse(storedData)
    if (!data.services || !data.customer) {
      router.push("/estimate/services")
      return
    }

    setEstimateData(data)

    if (data.promo) {
       setAppliedPromoCode(data.promo.code)
       setPromoDiscount(data.promo.discount)
    }

    setIsLoading(false)
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }))
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

  const handlePayment = async () => {
    setIsProcessing(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsProcessing(false)
    setIsCompleted(true)

    localStorage.setItem("bookingConfirmation", JSON.stringify(estimateData))
    localStorage.removeItem("estimateData")

    router.push("/estimate/confirmation")
  }

  const isPaymentFormValid =
    paymentData.cardNumber.length >= 16 &&
    paymentData.expiryDate.length >= 5 &&
    paymentData.cvv.length >= 3 &&
    termsAccepted

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
        }
      })
      .filter(Boolean)
  }

  const getCarpetAddOnsTotal = () => {
    const selected = estimateData?.carpetAddOns || []
    return selected.reduce((total: number, id: string) => {
      const addOn = carpetAddOns.find((a) => a.id === id)
      return total + (addOn?.price || 0)
    }, 0)
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

  const getSubtotal = () => {
    return getServicesBaseTotal() + getAddOnsTotal() + getCarpetAddOnsTotal()
  }

  const getDiscountAmount = () => {
    const services = getSelectedServicesWithDetails()
    const total = services.reduce(
      (sum: number, s: any) => sum + (s.numericPrice - s.discountedNumericPrice),
      0,
    )
    return Math.round(total)
  }

  const getDiscountedSubtotal = () => {
    return Math.max(0, getSubtotal() - getDiscountAmount() - promoDiscount)
  }

  const getTaxAmount = () => {
    return Math.round(getDiscountedSubtotal() * TAX_RATE)
  }

  const getFinalTotal = () => {
    return getDiscountedSubtotal() + getTaxAmount()
  }

  if (isLoading || !estimateData) {
    return (
      <div className="min-h-screen bg-background">
        <EstimateHeader title="Payment" step="Step 3 of 3" />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading payment information...</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <EstimateHeader title="Payment" step="Step 3 of 3" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">

          {(() => {
            const offer = getFlatOffer(estimateData?.promoCode ?? estimateData?.promo?.code)
            if (offer) return <PromoBanner label={offer.bannerLabel} className="mb-6 rounded-lg" />
            if (estimateData?.promoCode === LANDING_PROMO_CODE)
              return <PromoBanner percent={LANDING_PROMO_PCT} className="mb-6 rounded-lg" />
            return null
          })()}

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-lg md:text-xl font-semibold mb-2">Payment & Confirmation</h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  Review your booking details and complete your appointment.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base md:text-lg text-[#152644]">
                    <CreditCard className="h-5 w-5 text-[#152644]" />
                    <span>Payment Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentData.cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 16)
                        const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ")
                        handleInputChange("cardNumber", formatted)
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={paymentData.expiryDate}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                          const formatted = value.replace(/(\d{2})(?=\d)/, "$1/")
                          handleInputChange("expiryDate", formatted)
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={paymentData.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                          handleInputChange("cvv", value)
                        }}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="promoCode" className="flex items-center space-x-2">
                      <Tag className="h-4 w-4" />
                      <span>Promo Code</span>
                    </Label>

                    {appliedPromoCode ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            {appliedPromoCode} applied
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePromoCode}
                          className="text-green-700 hover:text-green-800 dark:text-green-400"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id="promoCode"
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
                        {promoError && <p className="text-sm text-red-600 dark:text-red-400">{promoError}</p>}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#152644]/10 p-4 rounded-lg">
                    <p className="text-sm text-[#152644]">
                      <strong>Secure Payment:</strong> Your payment information is encrypted and secure. You'll be
                      charged after the service is completed to your satisfaction.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-24">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* Appointment Details */}
                  {estimateData.customer.preferredDate && estimateData.customer.timeWindow && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm font-medium text-foreground">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>Appointment Details</span>
                        </div>
                        <div className="space-y-1 pl-6">
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(estimateData.customer.preferredDate), "EEEE, MMMM do, yyyy")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {resolveTimeWindowLabel(estimateData.customer.timeWindow)}
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
                            <div key={index} className="flex justify-between text-sm gap-2">
                              <span className="text-muted-foreground break-words flex-1">{service.name}</span>
                              <span className="font-medium flex-shrink-0">
                                {typeof service.price === "string" ? service.price : `$${service.price}`}
                              </span>
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
                  {(estimateData?.carpetAddOns?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm font-medium text-foreground">
                        <Tag className="h-4 w-4 text-primary" />
                        <span>Add-Ons</span>
                      </div>
                      <div className="space-y-2 pl-6">
                        {estimateData.carpetAddOns.map((id: string) => {
                          const addOn = carpetAddOns.find((a) => a.id === id)
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
                    <p className="text-xs text-muted-foreground italic">
                      *Final price may vary based on property inspection and actual service requirements
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-6 border-t mt-8">
            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I agree to the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#152644] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#152644] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </a>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  By checking this box, you acknowledge that you have read and agree to our terms of service.
                </p>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={!isPaymentFormValid || isProcessing}
              size="lg"
              className="w-full bg-[#152644] hover:bg-[#152644]/90 text-white"
            >
              {isProcessing ? "Processing..." : "Confirm Booking & Schedule Service"}
            </Button>

            <Button variant="outline" onClick={() => router.push("/estimate/customer")} className="w-full">
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
