import { Star, ShieldCheck, RefreshCw, CreditCard } from "lucide-react";
import { trust } from "@/lib/trust";
import { formatPrice } from "@/lib/format";

type TrustSignalsProps = {
  /**
   * "bar" — one compact row of credentials, for under the sticky-bar CTA on a
   * services page. Carries no payment messaging: the billing split isn't known
   * there, and it belongs at the checkout anyway.
   * "panel" — stacked rows with icons, for under the checkout CTA, where the
   * exact charged-today / on-site amounts are known.
   */
  variant?: "bar" | "panel";
  /**
   * Panel only: the exact split. Recurring plans bill today; one-time work is
   * paid on site once it's done, so we never blanket-promise "no charge today"
   * — we say which of the two the customer is actually in.
   */
  chargedToday?: number;
  onSiteBalance?: number;
  className?: string;
};

const paymentLine = ({
  chargedToday,
  onSiteBalance,
}: Pick<TrustSignalsProps, "chargedToday" | "onSiteBalance">): string =>
  chargedToday && chargedToday > 0
    ? `${formatPrice(chargedToday)} charged today for your recurring plan — the remaining ${formatPrice(onSiteBalance ?? 0)} is paid on site after the job.`
    : "No card charged today — you pay on site once the job is done.";

const Stars = ({ rating }: { rating: number }) => (
  <span className="inline-flex items-center gap-px" aria-hidden="true">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${
          i <= Math.round(rating) ? "fill-[#F5B32E] text-[#F5B32E]" : "fill-gray-200 text-gray-200"
        }`}
      />
    ))}
  </span>
);

export function TrustSignals({
  variant = "bar",
  chargedToday,
  onSiteBalance,
  className = "",
}: TrustSignalsProps) {
  const ratingLabel = `Rated ${trust.googleRating} out of 5 from ${trust.googleReviewCount} Google reviews`;
  const guarantee = `${trust.guaranteeDays}-day satisfaction guarantee — we re-clean free`;

  if (variant === "bar") {
    // Credentials only — no payment line. Separator dots would dangle at the
    // wrap point, so the icons do that work instead.
    return (
      <div
        className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11.5px] leading-tight text-gray-600 ${className}`}
      >
        <span className="inline-flex items-center gap-1.5" aria-label={ratingLabel}>
          <Stars rating={trust.googleRating} />
          <span className="font-semibold text-[#152644]">{trust.googleRating}</span>
          <span>({trust.googleReviewCount} Google reviews)</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-[#06b3bd]" />
          Licensed &amp; insured
        </span>
        <span className="inline-flex items-center gap-1">
          <RefreshCw className="h-3.5 w-3.5 text-[#06b3bd]" />
          {trust.guaranteeDays}-day satisfaction guarantee
        </span>
      </div>
    );
  }

  const payment = paymentLine({ chargedToday, onSiteBalance });

  return (
    <div className={`rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm" aria-label={ratingLabel}>
        <Stars rating={trust.googleRating} />
        <span className="font-semibold text-[#152644]">{trust.googleRating}</span>
        <span className="text-muted-foreground">from {trust.googleReviewCount} Google reviews</span>
      </div>
      <ul className="mt-2.5 space-y-1.5 text-[13px] leading-snug text-muted-foreground">
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-[#06b3bd]" />
          <span>Licensed &amp; insured — every technician is background-checked.</span>
        </li>
        <li className="flex items-start gap-2">
          <RefreshCw className="mt-px h-4 w-4 shrink-0 text-[#06b3bd]" />
          <span>{guarantee}.</span>
        </li>
        <li className="flex items-start gap-2">
          <CreditCard className="mt-px h-4 w-4 shrink-0 text-[#06b3bd]" />
          <span>
            {payment} Your price is an estimate until we see the space — we confirm it before any
            work starts.
          </span>
        </li>
      </ul>
    </div>
  );
}
