import { BadgePercent } from "lucide-react"

// Slim promo notice shown across the booking flow when the visitor arrived via
// the /landing promo. Communicates that the discount is already applied.
export function PromoBanner({
  percent,
  label,
  className = "",
}: {
  // Percentage promo (e.g. RESIDENTIAL15). Ignored when `label` is set.
  percent?: number
  // Full banner text for flat-price offers, shown verbatim instead of the
  // "{percent}% off" copy.
  label?: string
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-center gap-2 bg-[#152644] px-4 py-2 text-center text-white ${className}`}
    >
      <BadgePercent className="h-4 w-4 shrink-0 text-[#03D9E5]" />
      <span className="text-xs font-semibold sm:text-sm">
        {label ? (
          label
        ) : (
          <>
            <span className="text-[#03D9E5]">{percent}% off</span> residential
            cleaning applied — no code needed.
          </>
        )}
      </span>
    </div>
  )
}
