"use client";
import { PhoneCall } from "lucide-react";

/* ============================================================
   Shared services6 restoration strip.

   Extracted verbatim from the homepage's emergency card so the book page
   (app/page.tsx) and the Madison landing pages render the SAME component.
   Presentational: the caller wires `onBook` to whatever opens its emergency
   flow (the book page's inline card, the landing pages' on-page modal).

   Styled by `.svc6 .emg-strip / .emg-card / …` in app/voda-design.css, so it
   must render inside a `.svc6` ancestor.
   ============================================================ */

export type RestorationStripProps = {
  onBook: () => void;
  /** Visible sub-line. Defaults to the book page's copy; the landing pages pass
   *  the no-em-dash variant required by their copy rule. */
  sub?: string;
  ariaLabel?: string;
};

export function RestorationStrip({
  onBook,
  sub = "Water · fire · mold — 24/7",
  ariaLabel = "Restoration — call or book online",
}: RestorationStripProps) {
  return (
    <div className="emg-strip">
      <button type="button" className="emg-card" onClick={onBook} aria-label={ariaLabel}>
        <span className="emg-ic">
          <PhoneCall className="h-[19px] w-[19px]" />
        </span>
        <span className="emg-txt">
          <b>Restoration</b>
          <span className="emg-sub">{sub}</span>
        </span>
        <span className="emg-book">Book</span>
      </button>
    </div>
  );
}
