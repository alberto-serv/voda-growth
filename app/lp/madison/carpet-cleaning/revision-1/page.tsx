"use client";
import "../../lp-styles.css";
import "@/app/voda-design.css";
import "./rev1-styles.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X, Phone } from "lucide-react";
import { business } from "@/lib/business";
import { formatPrice } from "@/lib/format";
import { carpetModel, s6VacantDiscount } from "@/lib/carpet";
import {
  CarpetConfigurator,
  carpetTotal,
  carpetPricePerArea,
  type CarpetSel,
} from "@/components/lp/carpet-configurator";
import { RestorationStrip } from "@/components/lp/restoration-strip";

/* ============================================================
   Voda Product-Led Landing Page — Carpet × Madison — REVISION 1.

   A revision of /lp/madison/carpet-cleaning that applies the Round-1 review.
   The reference page is kept intact.

   Per the "extract to shared components" decision, the restoration strip and
   the carpet product module are now the SAME components the book page renders
   (components/lp/restoration-strip + carpet-configurator). Those are styled by
   `.svc6 …` in app/voda-design.css, so they live in `.svc6` blocks that are
   SIBLINGS of the `.voda-lp` blocks — never nested, because both design systems
   define `.hero` / `.stepper` / `.val` and nesting would cross-apply them.

   Pricing + checkout still run through lib/carpet with the services6 semantics,
   so the configured price matches /estimate/customer5 exactly.
   ============================================================ */

/* ---- Location (NAP from lib/business; brand-constant display copy) ---- */
const loc = {
  slug: "madison",
  city: business.city,
  state: business.state,
  serviceArea: ["Madison", "Middleton", "Fitchburg", "Sun Prairie", "Verona", "Waunakee"],
  phone: "(608) 398-8632",
  phoneRaw: business.businessPhone,
  email: business.email,
  gbpUrl: "https://www.google.com/searchviewer/10?svid=CAwSHRIbCgNwdnESFENnMHZaeTh4TVd4NWVubDJOWFEzGAo&sa=X&ved=2ahUKEwiwgs3L1eGVAxURJzQIHZEGEGgQ_74PegoIAggACAAIDBAC",
  reviewRating: 4.9, // LAUNCH-GATE: confirm real rating before traffic
  reviewCount: 218, // LAUNCH-GATE: confirm real count before traffic
  sinceYear: 2019, // NEEDS-SOURCING: confirm at launch
  licenseLine: "Licensed & insured · WI #CR-XXXXX", // LAUNCH-GATE: real license number
  hours: "Mon–Sat, 7AM–6PM",
  nextSlot: "Today, 4:30 PM",
  nextSlotShort: "Today 4:30 PM",
};

const brand = {
  name: business.brandName,
  ctaLabel: "See available times",
  footerLegal: "© 2026 Voda Cleaning & Restoration. All rights reserved.",
  // LAUNCH-GATE: guarantee copy below is placeholder/invented, not a confirmed
  // Voda policy. Confirm the real terms (free re-clean, 7-day window) with the
  // client before any traffic. Do not launch an unverified guarantee.
  guarantee: {
    title: "The Voda Clean Guarantee",
    body: "If you're not fully happy with the results, we'll re-clean the area free. No arguments, no fine print, that's our promise on every job.",
  },
  faqQuestions: [
    "How is the price calculated · will my final price match what I see here?",
    "How long will the service take?",
    "Do I need to be home during the service?",
    "How should I prepare before the crew arrives?",
    "Are the products and methods safe for kids and pets?",
    "What if I'm not happy with the results?",
  ],
};

const product = {
  name: "Eco-Friendly Carpet Cleaning",
  h1: `Carpet Cleaning in ${loc.city}, ${loc.state}`,
  // Card description for the configurator — deliberately does NOT repeat
  // "non-toxic" (in the hero bullets) or "no upsell games" (removed): dedupe.
  cardDesc: "Deep steam cleaning that lifts set-in dirt and leaves carpets dry in hours.",
  // Hero "includes" bullets replace the paragraph subhead (review item 2).
  includes: [
    "Pre-treatment of high-traffic areas and spots",
    "Non-toxic, pet-safe steam extraction",
    "Deodorize and fast-dry finish",
  ],
  // LAUNCH-GATE: FAQ answers are drafted, not sourced. Durations, drying times,
  // prep steps, "we'll text when wrapping up" and the 7-day window all need
  // validation by Voda ops before launch.
  faqAnswers: [
    "The price you see is your quote for the rooms and add-ons you select. On rare occasions (heavy soiling or oversized rooms beyond 150 sq ft) the tech may suggest an adjustment on-site, always confirmed with you before any work begins.",
    "Most 3–5 room jobs take 1.5–2.5 hours. Add-ons like stain or pet-odor treatment add a little time. Carpets are damp-dry on departure and fully dry within 4–6 hours.",
    "You don't have to be, as long as we can access the home. Most customers meet the crew at the start, then go about their day. We'll text when we're wrapping up.",
    "Please vacuum if you can, pick up small items and valuables off the floor, secure pets in a separate room, and leave a parking spot near the entrance. We move light furniture; we ask that you clear breakables.",
    "Yes. Our solutions are non-toxic and safe for kids and pets once carpets are dry. Let the treated areas dry fully (4–6 hrs) before heavy foot traffic.",
    "We back every job with the Voda Clean Guarantee: if you're not happy, we re-clean the area free. Just call us within 7 days.",
  ],
};

// LAUNCH-GATE: review quotes are curated placeholders. Em dashes stripped.
const reviews = [
  { quote: "Booked in two minutes and they arrived right in the window. Our carpets look brand new, no lingering smell, dry by dinner.", name: "Sarah M.", area: "Middleton", stars: 5 },
  { quote: "The pet-odor treatment actually worked where two other companies failed. Signed up for the recurring plan on the spot.", name: "Priya R.", area: "Fitchburg", stars: 5 },
  { quote: "Upfront per-room pricing, no surprise upsells, and the techs were spotless and professional start to finish.", name: "James T.", area: "Sun Prairie", stars: 5 },
];

const UNIT_PRICE = carpetPricePerArea(carpetModel, []); // base per room, for the cart-bar line
const DEFAULT_ROOMS = carpetModel.defaultAreas;

/* ---- icons (lucide-style, for the LP chrome) ---- */
const ICONS: Record<string, string> = {
  check: "M20 6 9 17l-5-5",
  clock: "M12 6v6l4 2|M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  pin: "M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z|M12 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z",
  mail: "M4 4h16v16H4z|M22 6l-10 7L2 6",
  chevron: "M6 9l6 6 6-6",
  droplet: "M12 2.5S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.5 12 2.5z",
  external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6|M15 3h6v6|M10 14 21 3",
};

function Icon({ name, size = 18, cls, style }: { name: string; size?: number; cls?: string; style?: React.CSSProperties }) {
  const isStar = name === "star";
  const d = (ICONS[name] || "").split("|");
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={isStar ? "currentColor" : "none"}
      stroke={isStar ? "none" : "currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={cls} aria-hidden="true">
      {d.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}
const Stars = ({ n = 5, size = 16 }: { n?: number; size?: number }) => (
  <span className="stars">{Array.from({ length: n }).map((_, i) => <Icon key={i} name="star" size={size} />)}</span>
);
const Logo = ({ white, height = 28 }: { white?: boolean; height?: number }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img className="logo" src={white ? "/voda-white-logo.svg" : "/voda-logo.svg"} style={{ height }} alt={brand.name} />
);

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: "smooth" });
}

/* ===== on-page emergency popup (opened by the shared RestorationStrip) ===== */
type EmergencyDamage = "Water" | "Fire" | "Mold" | "Storm";

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
    <div className="voda-lp">
      <div className="em-overlay" role="dialog" aria-modal="true" aria-label="Emergency & restoration help" onClick={onClose}>
        <div className="em-modal" onClick={(e) => e.stopPropagation()}>
          <div className="em-top">
            <span className="em-badge"><AlertTriangle size={21} /></span>
            <div>
              <div className="em-title">Emergency &amp; Restoration</div>
              <div className="em-sub">Water · Fire · Mold · 24/7 rapid response in {loc.city}.</div>
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
            <a className="em-call" href={"tel:" + loc.phoneRaw} aria-label={"Call now · " + loc.phone}>
              <Phone size={20} />
            </a>
          </div>
          <div className="em-note">No payment online — our team scopes the job and responds fast.</div>
        </div>
      </div>
    </div>
  );
}

/* ===== M1 micro-header with desktop scroll CTA ===== */
function Header({ scrolled, onBook }: { scrolled: boolean; onBook: () => void }) {
  return (
    <header className="hdr">
      <div className="wrap">
        <Logo />
        <span className="loc"><Icon name="pin" size={14} />{loc.city}, {loc.state}</span>
        {/* Desktop only: appears once the hero scrolls out of view. */}
        <button className={"hdr-cta" + (scrolled ? " show" : "")} onClick={onBook}>
          {brand.ctaLabel} <span className="sub">· {loc.nextSlotShort}</span>
        </button>
      </div>
    </header>
  );
}

/* ===== M2 hero (compact) ===== */
function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-bg">
        {/* NEEDS-ASSET: replace with a product-specific real photo (before/after
            or crew cleaning carpet). Desktop-only; mobile renders text-only. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home-background.jpeg" alt="Freshly cleaned carpeted living room" />
      </div>
      <div className="scrim" />
      <div className="wrap">
        <span className="eyebrow"><Icon name="droplet" size={13} />Same-week availability</span>
        <h1>{product.h1}</h1>
        <ul className="hero-inc">
          {product.includes.map((inc, i) => (
            <li key={i}><span className="ck"><Icon name="check" size={11} /></span>{inc}</li>
          ))}
        </ul>
        <div className="trust">
          <span className="b"><Stars size={14} /><span className="rating">{loc.reviewRating}</span> Google ({loc.reviewCount})</span>
        </div>
        {/* Desktop CTA only (mobile uses the cart bar). Anchors to the module. */}
        <div className="cta-wrap">
          <button className="btn btn-cta" onClick={() => scrollToId("configure")}>
            {brand.ctaLabel} <span className="sub">· Next: {loc.nextSlot}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ===== M4 reviews ===== */
function Reviews() {
  return (
    <section className="sec sec-alt" id="reviews">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">Real results in {loc.city}</div>
          <h2>Neighbors who booked this service</h2>
        </div>
        <div className="rev-grid">
          {reviews.map((r, i) => (
            <div className="rev" key={i}>
              <Stars n={r.stars} />
              <p className="q">&ldquo;{r.quote}&rdquo;</p>
              <div className="who">
                <span className="av">{r.name.charAt(0)}</span>
                <div>
                  <div className="n">{r.name}</div>
                  <div className="c">{r.area}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== M5 guarantee ===== */
function Guarantee() {
  return (
    <section className="sec">
      <div className="wrap">
        <div className="guar">
          <div className="shield"><Icon name="shield" size={30} /></div>
          <h2>{brand.guarantee.title}</h2>
          <p>{brand.guarantee.body}</p>
        </div>
      </div>
    </section>
  );
}

/* ===== M6 local proof ===== */
function LocalProof() {
  return (
    <section className="sec sec-alt" id="local">
      <div className="wrap">
        <div className="local-grid">
          <div className="local-photo">
            {/* NEEDS-RIGHTS: confirm source/usage of this truck photo with the client. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/voda-trucks.webp" alt="Voda Cleaning &amp; Restoration branded vans parked at a Madison home" />
          </div>
          <div>
            <div className="sec-kicker">Proudly local</div>
            <h2 className="sec-head" style={{ fontSize: 29, fontWeight: 800 }}>Serving {loc.city} &amp; greater Dane County</h2>
            <p style={{ color: "var(--muted)", fontSize: 16, marginTop: 8 }}>Locally staffed crews, background-checked and fully insured. Same-week availability across the area:</p>
            {/* Plain-text middot list replaces the area chips. */}
            <p className="area-text">{loc.serviceArea.join(" · ")}</p>
            <a className="gbp-link" href={loc.gbpUrl} target="_blank" rel="noopener noreferrer"><Icon name="external" size={15} />See our Google Business Profile &amp; reviews</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== M7 faq ===== */
function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="sec" id="faq">
      <div className="wrap">
        <div className="sec-head" style={{ textAlign: "center" }}>
          <div className="sec-kicker">Good to know</div>
          <h2>Frequently Asked Questions</h2>
        </div>
        <div className="faq">
          {brand.faqQuestions.map((q, i) => (
            <div className={"faq-item" + (open === i ? " open" : "")} key={i}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                {q}<Icon name="chevron" size={20} cls="chev" />
              </button>
              <div className="faq-a" style={{ maxHeight: open === i ? 400 : 0 }}>
                <div className="faq-a-inner">{product.faqAnswers[i]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== M8 final cta (desktop end-cap) ===== */
function FinalCTA({ onBook }: { onBook: () => void }) {
  return (
    <section className="sec sec-navy">
      <div className="wrap final">
        <h2>Ready for carpets that look new?</h2>
        <p>Pick a time that works. Most {loc.city} bookings are next-day.</p>
        <div className="cta-wrap">
          <button className="btn btn-cta" onClick={onBook}>
            {brand.ctaLabel} <span className="sub">· Next: {loc.nextSlot}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ===== M10 footer ===== */
function LpFooter() {
  return (
    <footer>
      <div className="foot">
        <div className="wrap">
          <div>
            <Logo white height={36} />
            <p className="f-about">Eco-friendly carpet, floor, air &amp; upholstery cleaning and 24/7 restoration for {loc.city} and greater Dane County.</p>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li><Icon name="phone" size={15} /><a href={"tel:" + loc.phoneRaw}>{loc.phone}</a></li>
              <li><Icon name="mail" size={15} /><a href={"mailto:" + loc.email}>{loc.email}</a></li>
              <li><Icon name="clock" size={15} />{loc.hours}</li>
            </ul>
          </div>
          <div>
            <h4>Voda Cleaning &amp; Restoration</h4>
            <ul>
              <li><Icon name="pin" size={15} /><span>{loc.city}, {loc.state}<br /><span className="lic">{loc.licenseLine}</span></span></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="foot-bottom">
        <div className="wrap">
          <span>{brand.footerLegal}</span>
          {/* LAUNCH-GATE: point these at real Privacy / Terms pages. */}
          <span className="foot-links"><a href="#">Privacy</a><a href="#">Terms</a></span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPageRevision1() {
  const router = useRouter();

  // Cart state lives here so the shared configurator, the mobile cart bar and
  // the desktop header CTA all read/commit the same live cart.
  const [sel, setSel] = useState<CarpetSel>({
    areas: DEFAULT_ROOMS,
    addOnIds: [],
    moveFurniture: true,
    vacant: false,
  });
  const total = carpetTotal(carpetModel, sel);
  const hasExtras = sel.addOnIds.length > 0 || s6VacantDiscount(sel) > 0;

  const [emOpen, setEmOpen] = useState(false);

  // Hand the configured cart to the shared checkout (mirrors the homepage's
  // handleContinueToScheduling), then jump to the scheduling step.
  const book = () => {
    const stored = JSON.parse(localStorage.getItem("estimateData") || "{}");
    localStorage.setItem(
      "estimateData",
      JSON.stringify({
        ...stored,
        services: {
          selectedServices: ["carpet-cleaning"],
          serviceQuantities: {},
          variantQuantities: {},
          carpetSelection: { "carpet-cleaning": sel },
          rugSelection: {},
          bundleUnits: {},
          serviceFrequency: { "carpet-cleaning": "none" },
          totalPrice: total,
        },
        checkoutFlow: "services6",
        emergency: undefined,
        commercial: undefined,
        skipPayment: undefined,
      }),
    );
    router.push("/estimate/customer5");
  };

  // Desktop header CTA reveals once the hero has scrolled out of view.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("hero");
    const onScroll = () => {
      if (!hero) return;
      setScrolled(hero.getBoundingClientRect().bottom < 60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The book-page module's footer, adapted for the LP: a desktop-only
  // "See available times" button (mobile commits via the cart bar).
  const cardFooter = (
    <div className="rev1-card-cta">
      <button type="button" className="btn btn-cta hero-book" onClick={book}>
        {brand.ctaLabel} · Next: {loc.nextSlot}
      </button>
      <div className="rev1-card-note">No payment until service day · Free rescheduling</div>
    </div>
  );

  return (
    <div className="rev1-root">
      {/* Shared book-page restoration strip. onBook opens the on-page modal. */}
      <div className="svc6 rev1-ribbon">
        <RestorationStrip onBook={() => setEmOpen(true)} sub="Water · Fire · Mold · 24/7" />
      </div>

      {/* .voda-lp chrome: header + compact hero. */}
      <div className="voda-lp rev1">
        <Header scrolled={scrolled} onBook={book} />
        <Hero />
      </div>

      {/* Shared book-page product module in its own .svc6 block (single column). */}
      <section className="svc6 rev1-config" id="configure">
        <div className="rev1-config-inner">
          <div className="rev1-kicker">Book your cleaning</div>
          <CarpetConfigurator
            model={carpetModel}
            name={product.name}
            description={product.cardDesc}
            sel={sel}
            onChange={setSel}
            footer={cardFooter}
          />
          <div className="rev1-escape">
            <a href="/lp/madison/other-services">Need a different service? →</a>
          </div>
        </div>
      </section>

      {/* .voda-lp chrome: proof + trust + FAQ + footer. */}
      <div className="voda-lp rev1">
        <Reviews />
        <Guarantee />
        <LocalProof />
        <FAQ />
        <FinalCTA onBook={book} />
        <LpFooter />
      </div>

      {/* Mobile cart bar = the only mobile CTA, live-bound to the cart. */}
      <div className="cart-bar">
        <div className="cb-sum">
          <span className="cb-calc">
            {sel.areas} room{sel.areas !== 1 ? "s" : ""} × {formatPrice(UNIT_PRICE)}{hasExtras ? " + extras" : ""}
          </span>
          <span className="cb-total">{formatPrice(total)}</span>
        </div>
        <button type="button" className="cb-btn" onClick={book}>
          {brand.ctaLabel} · Next: {loc.nextSlotShort}
        </button>
      </div>

      {emOpen && <EmergencyModal onClose={() => setEmOpen(false)} />}
    </div>
  );
}
