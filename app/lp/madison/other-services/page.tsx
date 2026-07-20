import "../lp-styles.css";
import type { Metadata } from "next";
import {
  Grid3x3,
  Layers,
  Wind,
  Fan,
  Sofa,
  SprayCan,
  Sparkles,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { business } from "@/lib/business";
import { formatPrice } from "@/lib/format";
import { availableServices, isBundleService, type CatalogService } from "@/lib/services-catalog";

/* ============================================================
   Voda Madison — "Other services" catalog landing (/lp/madison/other-services).
   Companion to the Carpet × Madison LP: lists every non-carpet Voda service
   (sourced from the services6 catalog in lib/services-catalog) and funnels the
   visitor into the canonical estimate flow to configure and book.
   ============================================================ */

export const metadata: Metadata = {
  title: `Cleaning Services in ${business.city}, ${business.state} — Voda`,
};

const loc = {
  city: business.city,
  state: business.state,
  phone: "(608) 398-8632",
  phoneRaw: business.businessPhone,
  email: business.email,
  hours: "Mon–Sat, 7AM–6PM",
  licenseLine: "Licensed & insured — WI #CR-XXXXX",
  nextSlot: "Today, 4:30 PM",
};

// Where a service card sends the visitor to configure + book. The canonical
// multi-service estimate picker carries every service's own configurator.
const BOOK_HREF = "/estimate/services";
// The healthy-home bundle is selectable on /services2, so route it there.
const BUNDLE_HREF = "/services2";

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  "routine-floor-care": Grid3x3,
  rugs: Layers,
  "hardwood-detailing": Grid3x3,
  "tile-grout-stone": Grid3x3,
  "dryer-vent-cleaning": Wind,
  "air-duct-cleaning": Fan,
  "upholstery-cleaning": Sofa,
  "odor-spot-control": SprayCan,
};

// Starting ("from") price: the cheapest variant if the service has variants,
// otherwise its base unit price.
function fromPrice(s: CatalogService): number {
  if (s.variants && s.variants.length) return Math.min(...s.variants.map((v) => v.unitPrice));
  return s.unitPrice;
}

const otherServices = availableServices.filter((s) => s.id !== "carpet-cleaning" && !isBundleService(s));
const bundle = availableServices.find((s) => isBundleService(s));

function Ribbon() {
  return (
    <div className="ribbon">
      <div className="wrap">
        <span className="rk"><span className="dot" />Restoration</span>
        <span>Water · Fire · Mold — 24/7</span>
        <span className="sep">·</span>
        <a href="/?emergency=1">Get emergency help →</a>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="hdr">
      <div className="wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src="/voda-logo.svg" style={{ height: 28 }} alt={business.brandName} />
        <span className="loc"><MapPin size={14} />{loc.city}, {loc.state}</span>
      </div>
    </header>
  );
}

export default function OtherServicesPage() {
  return (
    <div className="voda-lp">
      <Ribbon />
      <Header />

      {/* Hero — compact, since this is a catalog rather than a single offer */}
      <section className="sec sec-navy" style={{ paddingTop: 44 }}>
        <div className="wrap">
          <div className="sec-kicker">Voda Cleaning &amp; Restoration · {loc.city}, {loc.state}</div>
          <h2 style={{ color: "#fff", fontSize: 34, fontWeight: 800, maxWidth: "18ch" }}>
            Every Voda service, one easy online booking
          </h2>
          <p className="sh-sub" style={{ color: "#cfdae6", marginTop: 12, maxWidth: "56ch" }}>
            Upfront pricing and same-week availability across {loc.city} and greater Dane County. Pick a
            service to see your price and book — you only pay on service day.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="sec" id="services">
        <div className="wrap">
          <div className="sec-head">
            <div className="sec-kicker">Choose a service</div>
            <h2>Our cleaning &amp; care services</h2>
          </div>

          <div className="svc-grid">
            {otherServices.map((s) => {
              const Ico = ICONS[s.id] ?? Sparkles;
              return (
                <a className="svc-card" key={s.id} href={BOOK_HREF}>
                  <span className="svc-ico"><Ico size={22} /></span>
                  <div className="s-name">{s.name}</div>
                  <div className="s-desc">{s.description}</div>
                  {s.disclaimer && <div className="svc-disc">{s.disclaimer}</div>}
                  <div className="svc-foot">
                    <div className="svc-price">
                      <div className="p-from">From</div>
                      <span className="p-amt">{formatPrice(fromPrice(s))}</span>{" "}
                      <span className="p-unit">{s.unitLabel}</span>
                    </div>
                    <span className="svc-cta">Book <ArrowRight size={15} /></span>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Featured bundle */}
          {bundle && (
            <div className="bundle">
              <div className="b-body">
                <span className="b-badge"><Sparkles size={13} /> Best value</span>
                <h3>{bundle.name}</h3>
                <p>{bundle.description}</p>
              </div>
              <div className="b-cta">
                <a className="btn btn-cta" href={BUNDLE_HREF} style={{ width: "auto" }}>
                  Build your bundle <ArrowRight size={17} />
                </a>
              </div>
            </div>
          )}

          <div className="backwrap">
            <a className="lp-nav-back" href="/lp/madison/carpet-cleaning"><ArrowLeft size={15} /> Looking for carpet cleaning?</a>
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="sec sec-alt">
        <div className="wrap">
          <div className="guar">
            <div className="shield"><ShieldCheck size={30} /></div>
            <h2>The Voda Clean Guarantee</h2>
            <p>If you&apos;re not fully happy with the results, we&apos;ll re-clean the area free. No arguments, no fine print — that&apos;s our promise on every job.</p>
          </div>
        </div>
      </section>

      {/* Local proof */}
      <section className="sec" id="local">
        <div className="wrap">
          <div className="local-grid">
            <div className="local-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/voda-trucks.webp" alt="Voda Cleaning &amp; Restoration branded vans parked at a Madison home" />
            </div>
            <div>
              <div className="sec-kicker">Proudly local</div>
              <h2 className="sec-head" style={{ fontSize: 29, fontWeight: 800 }}>Serving {loc.city} &amp; greater Dane County</h2>
              <p style={{ color: "var(--muted)", fontSize: 16, marginTop: 8 }}>Locally staffed crews, background-checked and fully insured. Same-week availability — most bookings are next-day.</p>
              <div style={{ marginTop: 22 }}>
                <a className="btn btn-cta" href={BOOK_HREF} style={{ width: "auto" }}>
                  Start your estimate <span className="sub">· Next: {loc.nextSlot}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="foot">
          <div className="wrap">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="logo" src="/voda-white-logo.svg" style={{ height: 36 }} alt={business.brandName} />
              <p className="f-about">Eco-friendly carpet, floor, air &amp; upholstery cleaning and 24/7 restoration for {loc.city} and greater Dane County.</p>
            </div>
            <div>
              <h4>Contact</h4>
              <ul>
                <li><Phone size={15} /><a href={"tel:" + loc.phoneRaw}>{loc.phone}</a></li>
                <li><Mail size={15} /><a href={"mailto:" + loc.email}>{loc.email}</a></li>
                <li><Clock size={15} />{loc.hours}</li>
              </ul>
            </div>
            <div>
              <h4>Voda Cleaning &amp; Restoration</h4>
              <ul>
                <li><MapPin size={15} /><span>{loc.city}, {loc.state}<br /><span className="lic">{loc.licenseLine}</span></span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <div className="wrap">
            <span>© 2026 Voda Cleaning &amp; Restoration. All rights reserved.</span>
            <span className="foot-links"><a href="#">Privacy</a><a href="#">Terms</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
