"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench } from "lucide-react"
import { formatPrice } from "@/lib/format"
import {
  frequencyShortLabel,
  type ServiceFrequency,
} from "@/lib/services-catalog"
import { FrequencyPicker } from "@/components/frequency-picker"

export interface SelectedServiceItem {
  id: string
  name: string
  numericPrice: number
  discountedNumericPrice: number
  frequency: ServiceFrequency
  recurrenceOptions?: ServiceFrequency[]
  // Portion of this line billed up front. Set for bundles (their recurring
  // components bill today, the rest is on site). Undefined for plain services,
  // where `frequency` decides.
  chargedToday?: number
}

// The line's total at the price the customer pays (post subscription discount),
// and the slice of it billed up front.
function lineTotal(s: SelectedServiceItem): number {
  return s.frequency && s.frequency !== "none" ? s.discountedNumericPrice : s.numericPrice
}
function lineChargedToday(s: SelectedServiceItem): number {
  if (typeof s.chargedToday === "number") return s.chargedToday
  return s.frequency && s.frequency !== "none" ? s.discountedNumericPrice : 0
}

interface SelectedServicesCardProps {
  services: SelectedServiceItem[]
  onFrequencyChange?: (serviceId: string, freq: ServiceFrequency) => void
  className?: string
  // Order-level promo discount (dollars) to reflect in the charged-today / on-site
  // split, so the balance-due figure matches the authoritative Order Summary.
  promoDiscount?: number
  promoCode?: string | null
}

export function SelectedServicesCard({
  services,
  onFrequencyChange,
  className,
  promoDiscount = 0,
  promoCode,
}: SelectedServicesCardProps) {
  if (services.length === 0) return null

  // Subscriptions are billed today; one-time services are paid on site after the
  // work is done. A bundle can split across both. Tally each side per line.
  const rawChargedToday = services.reduce((sum, s) => sum + lineChargedToday(s), 0)
  const rawOnSite = services.reduce((sum, s) => sum + (lineTotal(s) - lineChargedToday(s)), 0)
  // An order-level promo (e.g. the $149 upholstery offer) discounts the on-site
  // balance first — one-time work is paid on site — then any remainder comes off
  // the charged-today portion, so the split reconciles with the Order Summary.
  const discount = Math.max(0, Math.min(promoDiscount, rawChargedToday + rawOnSite))
  const dueOnSite = Math.max(0, rawOnSite - discount)
  const chargedToday = Math.max(0, rawChargedToday - Math.max(0, discount - rawOnSite))

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <span className="text-foreground">Selected Services</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {services.map((service) => {
            const isRecurring = service.frequency && service.frequency !== "none"
            const showPicker =
              !!onFrequencyChange &&
              Array.isArray(service.recurrenceOptions) &&
              service.recurrenceOptions.length > 1
            return (
              <div key={service.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start gap-3">
                  <span className="font-medium text-gray-900 break-words flex-1 min-w-0">
                    {service.name}
                  </span>
                  <span className="text-right flex-shrink-0">
                    <span className="block font-semibold text-primary tabular-nums">
                      {formatPrice(Math.round(service.discountedNumericPrice))}
                      {isRecurring && (
                        <span className="ml-1 text-[10px] font-medium text-muted-foreground">
                          {frequencyShortLabel(service.frequency)}
                        </span>
                      )}
                    </span>
                    {isRecurring && (
                      <span className="block text-xs font-medium text-gray-400 line-through tabular-nums">
                        {formatPrice(service.numericPrice)}
                      </span>
                    )}
                    {(() => {
                      const ct = lineChargedToday(service)
                      const lt = lineTotal(service)
                      const partial = ct > 0.01 && ct < lt - 0.01
                      const label = ct <= 0.01 ? "Paid on site" : partial ? "Partly charged today" : "Charged today"
                      return (
                        <span
                          className={`block text-[10px] font-medium ${
                            ct <= 0.01 ? "text-muted-foreground" : "text-primary"
                          }`}
                        >
                          {label}
                        </span>
                      )
                    })()}
                  </span>
                </div>
                {showPicker && (
                  <div className="mt-2">
                    <FrequencyPicker
                      variant="compact"
                      value={service.frequency}
                      onChange={(next) => onFrequencyChange!(service.id, next)}
                      options={service.recurrenceOptions}
                      label={null}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Charged-today vs on-site split */}
        <div className="pt-3 border-t border-gray-200 space-y-1.5">
          {discount > 0 && (
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-sm text-green-600 break-words flex-1">
                Promo{promoCode ? ` (${promoCode})` : ""}
              </span>
              <span className="text-sm font-semibold text-green-600 tabular-nums flex-shrink-0">
                -{formatPrice(Math.round(discount))}
              </span>
            </div>
          )}
          {chargedToday > 0 && (
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-sm text-gray-600">
                Charged today{" "}
                <span className="text-muted-foreground">(subscriptions)</span>
              </span>
              <span className="text-sm font-semibold text-primary tabular-nums flex-shrink-0">
                {formatPrice(Math.round(chargedToday))}
              </span>
            </div>
          )}
          {dueOnSite > 0 && (
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-sm text-gray-600">Balance due at service</span>
              <span className="text-sm font-semibold text-gray-900 tabular-nums flex-shrink-0">
                {formatPrice(Math.round(dueOnSite))}
              </span>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground leading-snug pt-0.5">
            Subscriptions are charged today; one-time services are paid on site once
            the work is done.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
