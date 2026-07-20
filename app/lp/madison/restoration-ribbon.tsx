"use client";
import "./lp-styles.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X, Phone } from "lucide-react";
import { business } from "@/lib/business";

/* ============================================================
   Shared restoration ribbon + on-page emergency popup for the /lp/madison
   landing pages. Clicking "Get emergency help" opens a modal on the current
   page; Book runs the shared no-payment emergency checkout (mirrors the
   homepage startEmergencyCheckout) and jumps to the scheduling step.
   ============================================================ */

type EmergencyDamage = "Water" | "Fire" | "Mold" | "Storm";

const PHONE_DISPLAY = "(608) 398-8632";

export function RestorationRibbon() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="ribbon">
        <div className="wrap">
          <span className="rk"><span className="dot" />Restoration</span>
          <span>Water · Fire · Mold — 24/7</span>
          <span className="sep">·</span>
          {/* href is a no-JS fallback to the homepage emergency flow */}
          <a href="/?emergency=1" onClick={(e) => { e.preventDefault(); setOpen(true); }}>Get emergency help →</a>
        </div>
      </div>
      {open && <EmergencyModal onClose={() => setOpen(false)} />}
    </>
  );
}

function EmergencyModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [damage, setDamage] = useState<EmergencyDamage | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const startEmergencyCheckout = () => {
    if (!damage) return;
    const stored = JSON.parse(localStorage.getItem("estimateData") || "{}");
    localStorage.setItem(
      "estimateData",
      JSON.stringify({
        ...stored,
        checkoutFlow: "services6",
        // Emergency is standalone — start with an empty cart so nothing carries in.
        services: { selectedServices: [], totalPrice: 0 },
        emergency: { damageType: damage },
        commercial: undefined,
        noService: undefined,
        skipPayment: true,
      }),
    );
    router.push("/estimate/customer5");
  };

  return (
    <div className="em-overlay" role="dialog" aria-modal="true" aria-label="Emergency & restoration help" onClick={onClose}>
      <div className="em-modal" onClick={(e) => e.stopPropagation()}>
        <div className="em-top">
          <span className="em-badge"><AlertTriangle size={21} /></span>
          <div>
            <div className="em-title">Emergency &amp; Restoration</div>
            <div className="em-sub">Water · Fire · Mold — 24/7 rapid response in {business.city}.</div>
          </div>
          <button className="em-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="em-lbl">Select damage type</div>
        <div className="em-chips">
          {(["Water", "Fire", "Mold", "Storm"] as const).map((type) => (
            <button key={type} className={"em-chip" + (damage === type ? " on" : "")} onClick={() => setDamage(type)} aria-pressed={damage === type}>
              {type}
            </button>
          ))}
        </div>

        <div className="em-actions">
          <button className="em-book" disabled={!damage} onClick={startEmergencyCheckout}>
            Request priority help
          </button>
          <a className="em-call" href={"tel:" + business.businessPhone} aria-label={"Call now · " + PHONE_DISPLAY}>
            <Phone size={20} />
          </a>
        </div>
        <div className="em-note">No payment online — our team scopes the job and responds fast.</div>
      </div>
    </div>
  );
}
