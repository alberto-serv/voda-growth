"use client"

import {
  FREQUENCY_DISCOUNT_PCT,
  frequencyCompactLabel,
  frequencyLongLabel,
  type ServiceFrequency,
} from "@/lib/services-catalog"

interface FrequencyPickerProps {
  value: ServiceFrequency
  onChange: (next: ServiceFrequency) => void
  options?: ServiceFrequency[]
  variant?: "default" | "compact"
  label?: string | null
  className?: string
}

const DEFAULT_OPTIONS: ServiceFrequency[] = ["none", "6-month", "annual"]

export function FrequencyPicker({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  variant = "default",
  label = "How often?",
  className,
}: FrequencyPickerProps) {
  const isCompact = variant === "compact"

  const stop = (e: React.MouseEvent) => e.stopPropagation()

  if (isCompact) {
    return (
      // All three options have to be visible at once: this sits in a card on a
      // phone, and a horizontally-scrolling segmented control hides the last
      // option behind a swipe nobody makes. Short labels + an even split keep it
      // inside the card; the long labels are only used from sm up.
      <div
        role="radiogroup"
        aria-label="Service frequency"
        className={`flex w-full sm:inline-flex sm:w-auto items-stretch gap-0.5 rounded-lg bg-gray-100 p-0.5 ring-1 ring-inset ring-gray-200/70 ${className ?? ""}`}
        onClick={stop}
      >
        {options.map((opt) => {
          const active = opt === value
          const pct = FREQUENCY_DISCOUNT_PCT[opt]
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={(e) => {
                e.stopPropagation()
                onChange(opt)
              }}
              className={`inline-flex flex-1 sm:flex-none min-w-0 items-center justify-center gap-1 sm:gap-1.5 rounded-md px-1.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors duration-150 ease-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#152644]/40 ${
                active
                  ? "bg-white text-[#152644] shadow-[0_1px_2px_rgba(21,38,68,0.08),0_0_0_1px_rgba(21,38,68,0.05)]"
                  : "bg-transparent text-gray-600 hover:bg-white/70 hover:text-[#152644]"
              }`}
            >
              <span className="sm:hidden">{frequencyCompactLabel(opt)}</span>
              <span className="hidden sm:inline">{frequencyLongLabel(opt)}</span>
              {pct > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold leading-none text-amber-700">
                  -{pct}%
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={className} onClick={stop}>
      {label !== null && (
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        aria-label={label ?? "Service frequency"}
        className={`mt-3 grid gap-2 ${
          options.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"
        }`}
      >
        {options.map((opt) => {
          const active = opt === value
          const pct = FREQUENCY_DISCOUNT_PCT[opt]
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={(e) => {
                e.stopPropagation()
                onChange(opt)
              }}
              className={`flex items-center justify-between gap-2 rounded-md border px-3 sm:px-4 h-11 text-sm font-semibold transition-colors duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#03D9E5]/50 ${
                active
                  ? "bg-[#152644] text-white border-[#152644] shadow-sm"
                  : "bg-white text-[#152644] border-gray-200 hover:border-[#152644]/40 hover:bg-gray-50"
              }`}
            >
              <span>{frequencyLongLabel(opt)}</span>
              {pct > 0 && (
                <span
                  className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                    active ? "bg-white/15 text-amber-200" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  -{pct}%
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
