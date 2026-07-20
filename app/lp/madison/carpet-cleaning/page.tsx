"use client";
import "../lp-styles.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RestorationRibbon } from "../restoration-ribbon";
import { business } from "@/lib/business";
import { formatPrice } from "@/lib/format";
import {
  carpetModel,
  computeCarpetTotal,
  computeCarpetAddOnsPricePerArea,
  carpetAddOnPricePerArea,
  s6VacantDiscount,
} from "@/lib/carpet";

/* ============================================================
   Voda Product-Led Landing Page — Carpet × Madison.
   Ported from the "Voda Landing - Carpet Madison" design.
   Pricing + checkout handoff are driven by lib/carpet using the
   same services6 semantics as the homepage, so the price the
   visitor configures here is the exact price they see at
   /estimate/customer5.
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
  reviewRating: 4.9,
  reviewCount: 218,
  sinceYear: 2019, // NEEDS-SOURCING: confirm at launch
  licenseLine: "Licensed & insured — WI #CR-XXXXX", // NEEDS-SOURCING
  hours: "Mon–Sat, 7AM–6PM",
  nextSlot: "Today, 4:30 PM",
  nextSlotShort: "Today 4:30 PM",
};

const brand = {
  name: business.brandName,
  ctaLabel: "See available times",
  microcopy: "Book in 60 seconds · No payment until service day · Free rescheduling.",
  restoration: { label: "Restoration", line: "Water · Fire · Mold — 24/7", href: "/?emergency=1" },
  guarantee: {
    title: "The Voda Clean Guarantee",
    body: "If you're not fully happy with the results, we'll re-clean the area free. No arguments, no fine print — that's our promise on every job.",
  },
  faqQuestions: [
    "How is the price calculated — will my final price match what I see here?",
    "How long will the service take?",
    "Do I need to be home during the service?",
    "How should I prepare before the crew arrives?",
    "Are the products and methods safe for kids and pets?",
    "What if I'm not happy with the results?",
  ],
  footerLegal: "© 2026 Voda Cleaning & Restoration. All rights reserved.",
};

const product = {
  slug: "carpet-cleaning",
  name: "Eco-Friendly Carpet Cleaning",
  h1: `Carpet Cleaning in ${loc.city}, ${loc.state}`,
  subhead: "Deep steam cleaning with non-toxic solutions — upfront per-room pricing, no upsell games.",
  includes: [
    "Pre-treatment of high-traffic areas & spots",
    "Deep steam extraction, non-toxic pet-safe solutions",
    "Deodorize + fast-dry finish",
  ],
  faqAnswers: [
    "The price you see is your quote for the rooms and add-ons you select. On rare occasions (heavy soiling or oversized rooms beyond 150 sq ft) the tech may suggest an adjustment on-site — always confirmed with you before any work begins.",
    "Most 3–5 room jobs take 1.5–2.5 hours. Add-ons like stain or pet-odor treatment add a little time. Carpets are damp-dry on departure and fully dry within 4–6 hours.",
    "You don't have to be, as long as we can access the home. Most customers meet the crew at the start, then go about their day. We'll text when we're wrapping up.",
    "Please vacuum if you can, pick up small items and valuables off the floor, secure pets in a separate room, and leave a parking spot near the entrance. We move light furniture; we ask that you clear breakables.",
    "Yes. Our solutions are non-toxic and safe for kids and pets once carpets are dry. Let the treated areas dry fully (4–6 hrs) before heavy foot traffic.",
    "We back every job with the Voda Clean Guarantee: if you're not happy, we re-clean the area free. Just call us within 7 days.",
  ],
};

const reviews = [
  { quote: "Booked in two minutes and they arrived right in the window. Our carpets look brand new — no lingering smell, dry by dinner.", name: "Sarah M.", area: "Middleton", stars: 5 },
  { quote: "The pet-odor treatment actually worked where two other companies failed. Signed up for the recurring plan on the spot.", name: "Priya R.", area: "Fitchburg", stars: 5 },
  { quote: "Upfront per-room pricing, no surprise upsells, and the techs were spotless and professional start to finish.", name: "James T.", area: "Sun Prairie", stars: 5 },
];

const flags = { show_restoration_ribbon: true, show_pricing: true };

/* ---- Carpet pricing bridge to lib/carpet (services6 à-la-carte model) ----
   The base steam clean is quoted furnished (moveFurniture stays true); the
   "vacant" toggle applies the flat s6 per-booking discount, matching the
   homepage. Each landing add-on maps to a priced carpet-model add-on id. */
const UNIT_PRICE = computeCarpetAddOnsPricePerArea(carpetModel, []); // base per room
const MIN_QTY = carpetModel.defaultAreas;

const LP_ADDONS = [
  { id: "stain", modelId: "s6-stain-removal", name: "Stain removal", desc: "Targeted treatment for set-in spots" },
  { id: "petodor", modelId: "s6-pet-odor-control", name: "Pet odor removal", desc: "Natural oxygen deep-odor neutralizer" },
] as const;

/* ---- icons (lucide-style) ---- */
const ICONS: Record<string, string> = {
  check: "M20 6 9 17l-5-5",
  clock: "M12 6v6l4 2|M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  pin: "M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z|M12 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z",
  mail: "M4 4h16v16H4z|M22 6l-10 7L2 6",
  chevron: "M6 9l6 6 6-6",
  lock: "M5 11h14v10H5z|M8 11V7a4 4 0 0 1 8 0v4",
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

/* ===== M0 restoration ribbon + on-page emergency popup =====
   Shared with the other-services LP — see ../restoration-ribbon. */

/* ===== M1 micro-header ===== */
function Header() {
  return (
    <header className="hdr">
      <div className="wrap">
        <Logo />
        <span className="loc"><Icon name="pin" size={14} />{loc.city}, {loc.state}</span>
      </div>
    </header>
  );
}

/* ===== M2 hero ===== */
function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home-background.jpeg" alt="Freshly cleaned carpeted living room" />
      </div>
      <div className="scrim" />
      <div className="wrap">
        <span className="eyebrow"><Icon name="droplet" size={13} />Eco-friendly · Non-toxic</span>
        <h1>{product.h1}</h1>
        <p className="subhead">{product.subhead}</p>
        <div className="trust">
          <span className="b"><Stars size={15} /><span className="rating">{loc.reviewRating}</span> Google ({loc.reviewCount})</span>
          <span className="tsep" />
          <span className="b"><Icon name="shield" size={14} />Licensed &amp; Insured</span>
          <span className="tsep" />
          <span className="b">Serving {loc.city} since {loc.sinceYear}</span>
        </div>
        <div className="cta-wrap">
          <button className="btn btn-cta" onClick={() => scrollToId("configure")}>
            {brand.ctaLabel} <span className="sub">· Next: {loc.nextSlot}</span>
          </button>
        </div>
        <p className="microcopy">{brand.microcopy}</p>
      </div>
    </section>
  );
}

/* ===== M3 configurator (wired to checkout) ===== */
function Configurator() {
  const router = useRouter();
  const [qty, setQty] = useState(MIN_QTY);
  const [vacant, setVacant] = useState(false);
  const [addons, setAddons] = useState<Record<string, boolean>>({});
  const toggleAddon = (id: string) => setAddons((a) => ({ ...a, [id]: !a[id] }));

  const activeAddons = LP_ADDONS.filter((a) => addons[a.id]);
  const addOnIds = activeAddons.map((a) => a.modelId);

  // Same shape + math the homepage (services6) hands to checkout.
  const sel = { areas: qty, addOnIds, moveFurniture: true, vacant };
  const discount = s6VacantDiscount({ areas: qty, addOnIds, vacant: true });
  const total = computeCarpetTotal(carpetModel, sel) - (vacant ? discount : 0);

  const calcParts = [`${qty} room${qty !== 1 ? "s" : ""} × ${formatPrice(UNIT_PRICE)}`];
  activeAddons.forEach((a) => calcParts.push(`+ ${a.name}`));
  if (vacant) calcParts.push(`vacant − ${formatPrice(discount)}`);

  // Hand the configured cart to the shared checkout, mirroring the homepage's
  // handleContinueToScheduling exactly, then jump to the scheduling step.
  const handleBook = () => {
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

  return (
    <section className="sec" id="configure">
      <div className="wrap">
        <div className="cfg-layout">
          <div className="cfg-intro">
            <div className="sec-kicker">Build your quote</div>
            <h2>Upfront pricing, no upsell games.</h2>
            <p className="sec-head sh-sub" style={{ marginTop: 8 }}>Pick your rooms and add-ons — see your real price before you book. You only pay on service day.</p>
          </div>

          <div className="cfg">
            <div className="cfg-top">
              <div className="p-name">{product.name}</div>
              <div className="p-desc">{product.subhead}</div>
              <ul className="cfg-inc">
                {product.includes.map((inc, i) => (
                  <li key={i}><span className="ck"><Icon name="check" size={12} /></span>{inc}</li>
                ))}
              </ul>
            </div>

            <div className="cfg-body">
              <div className="cfg-lbl">How many rooms?</div>
              <div className="qty-row">
                <div>
                  <div className="stepper">
                    <button onClick={() => setQty((q) => Math.max(MIN_QTY, q - 1))} disabled={qty <= MIN_QTY} aria-label="fewer rooms">–</button>
                    <span className="val">{qty}</span>
                    <button onClick={() => setQty((q) => q + 1)} aria-label="more rooms">+</button>
                  </div>
                  <div className="qty-unit">Min. {MIN_QTY} rooms · 1 room = up to 150 sq ft.</div>
                </div>
                <div className="unit-price">
                  <div className="up-amt">{formatPrice(UNIT_PRICE)}</div>
                  <div className="up-per">per room</div>
                </div>
              </div>

              {flags.show_pricing && (
                <div className={"incentive" + (vacant ? " on" : "")} onClick={() => setVacant((v) => !v)} role="button" aria-pressed={vacant}>
                  <div className="txt">
                    <div className="it-name">My rooms are vacant (no furniture to move)</div>
                    <div className="it-save">Save {formatPrice(discount)} — nothing to move</div>
                  </div>
                  <span className="switch" />
                </div>
              )}

              <div className="addons">
                <div className="cfg-lbl">Add-ons <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--muted)", fontWeight: 500 }}>· optional, per room</span></div>
                {LP_ADDONS.map((a) => (
                  <div key={a.id} className={"addon" + (addons[a.id] ? " on" : "")} onClick={() => toggleAddon(a.id)} role="button" aria-pressed={!!addons[a.id]}>
                    <span className="box">{addons[a.id] && <Icon name="check" size={13} />}</span>
                    <div className="txt">
                      <div className="a-name">{a.name}</div>
                      <div className="a-desc">{a.desc}</div>
                    </div>
                    <div className="a-price">+{formatPrice(carpetAddOnPricePerArea(carpetModel, a.modelId))}/room</div>
                  </div>
                ))}
              </div>

              <div className="cfg-total">
                <div>
                  <div className="t-k">Your price</div>
                  <div className="t-calc">{calcParts.join("  ")}</div>
                </div>
                <div className="t-v">{formatPrice(total)}</div>
              </div>

              <div className="cfg-cta-wrap">
                <button className="btn btn-cta" onClick={handleBook}>
                  {brand.ctaLabel} <span className="sub">· Next: {loc.nextSlot}</span>
                </button>
                <div className="cfg-note"><Icon name="lock" size={13} style={{ color: "var(--faint)" }} />No payment until service day · Free rescheduling</div>
              </div>
            </div>
          </div>
        </div>

        {/* M3b escape hatch — the other Voda services in Madison */}
        <div className="escape"><a href="/lp/madison/other-services">Need a different service? →</a></div>
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/voda-trucks.webp" alt="Voda Cleaning &amp; Restoration branded vans parked at a Madison home" />
          </div>
          <div>
            <div className="sec-kicker">Proudly local</div>
            <h2 className="sec-head" style={{ fontSize: 29, fontWeight: 800 }}>Serving {loc.city} &amp; greater Dane County</h2>
            <p style={{ color: "var(--muted)", fontSize: 16, marginTop: 8 }}>Locally staffed crews, background-checked and fully insured. Same-week availability across the area:</p>
            <div className="area-list">
              {loc.serviceArea.map((a) => <span className="area-chip" key={a}><Icon name="pin" size={13} />{a}</span>)}
            </div>
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
          <h2>Questions, answered</h2>
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

/* ===== M8 final cta ===== */
function FinalCTA() {
  return (
    <section className="sec sec-navy">
      <div className="wrap final">
        <h2>Ready for carpets that look new?</h2>
        <p>Pick a time that works — most {loc.city} bookings are next-day.</p>
        <div className="cta-wrap">
          <button className="btn btn-cta" onClick={() => scrollToId("configure")}>
            {brand.ctaLabel} <span className="sub">· Next: {loc.nextSlot}</span>
          </button>
          <p className="microcopy">{brand.microcopy}</p>
        </div>
      </div>
    </section>
  );
}

/* ===== M9 sticky mobile CTA ===== */
function StickyCTA() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const cfg = document.getElementById("configure");
    const onScroll = () => {
      if (!cfg) return;
      const past = cfg.getBoundingClientRect().bottom < window.innerHeight * 0.4;
      setShow(past);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className={"sticky-cta" + (show ? " show" : "")}>
      <button className="btn btn-cta" onClick={() => scrollToId("configure")}>
        {brand.ctaLabel} · {loc.nextSlotShort}
      </button>
    </div>
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
          <span className="foot-links"><a href="#">Privacy</a><a href="#">Terms</a></span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="voda-lp">
      <RestorationRibbon />
      <Header />
      <Hero />
      <Configurator />
      <Reviews />
      <Guarantee />
      <LocalProof />
      <FAQ />
      <FinalCTA />
      <LpFooter />
      <StickyCTA />
    </div>
  );
}
