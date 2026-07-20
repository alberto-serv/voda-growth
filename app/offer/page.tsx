"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { UPHOLSTERY_OFFER_CODE } from "@/lib/promo";

// Standalone new-customer offer page ($149 sofa & loveseat deep clean).
// Faithful implementation of the "Voda - Offer" design: minimal header/footer,
// countdown to the first of next month, value stack, proof, micro-FAQ, and a
// sticky mobile CTA. Self-contained inline styling to match the source design.

const PHONE_TEL = "+16083988632";
const PHONE_DISPLAY = "(608) 398-8632";

// Booking flow for the offer: go straight to scheduling. customer5 reads ?promo=
// and seeds the flat $149 sofa+loveseat deal (pre-selects the pieces, applies the
// discount) so the visitor skips the service picker. All CTAs route here.
const BOOK_HREF = `/estimate/customer5?promo=${UPHOLSTERY_OFFER_CODE}`;

// Brand mark used in the header and footer.
function VodaLogo({ style }: { style?: CSSProperties }) {
  return (
    <svg style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 139.33 87.11">
      <g>
        <circle fill="#03d9e5" cx="133.38" cy="5.95" r="5.95" />
        <path
          fill="#03d9e5"
          d="M124.43,18.38h0c-.81-.33-3.77-1.63-5.48-4.96-1.34-2.61-1.2-5.05-1.08-6.03.05-.34.09-.7.09-1.05C117.97,2.84,115.12,0,111.62,0s-6.33,3.07-6.34,6.34c0,2.12,1.3,4.12,2.81,5.21.44.32.85.52,1.14.65h0c.91.4,3.34,1.6,5.06,4.38,1.79,2.88,1.73,5.69,1.67,6.67-.05.29-.1.65-.1,1.05,0,2.96,2.21,5.3,4.46,6.06.92.31,1.66.28,1.88.28,3.5,0,6.34-2.84,6.34-6.34,0-2.46-1.6-4.51-3.21-5.47-.36-.21-.68-.35-.92-.45h0Z"
        />
        <path
          fill="#ffffff"
          d="M50.35,43.22c-9.1,0-16.47,7.12-16.47,15.89s7.37,15.89,16.47,15.89,16.47-7.12,16.47-15.89-7.37-15.89-16.47-15.89ZM50.35,67.7c-4.74,0-8.59-3.84-8.59-8.59s3.84-8.59,8.59-8.59,8.59,3.84,8.59,8.59-3.84,8.59-8.59,8.59Z"
        />
        <path
          fill="#ffffff"
          d="M25.86,44.07l-8.51,18.15c-.05.11-.21.11-.26,0l-8.51-18.15c-.02-.05-.08-.08-.13-.08H.15c-.11,0-.18.11-.13.21,1.21,2.61,13.12,28.33,14.2,30.65.05.11.15.17.27.17h5.4c.17,0,.33-.1.4-.26l14.15-30.56c.04-.1-.03-.21-.13-.21h-8.3c-.06,0-.11.03-.13.08Z"
        />
        <path
          fill="#ffffff"
          d="M94.39,34.84l.15,12.19c0,.13-.14.2-.24.12-2.15-1.71-5.03-3.33-8.53-3.46-7.41-.27-16.56,6.17-16.47,15.89.09,9.9,9.62,15.83,16.85,15.57,3.74-.13,6.69-1.91,8.45-3.21.1-.07.23,0,.24.12l.03,2.18c0,.08.07.15.15.15h7.44c.16,0,.29-.13.29-.29v-39.26c0-.08-.07-.15-.15-.15h-8.06c-.08,0-.15.07-.15.15ZM88.6,67.72c-6.9,2.21-13.17-4.06-10.96-10.96.8-2.5,2.81-4.51,5.31-5.31,6.9-2.21,13.17,4.06,10.96,10.96-.8,2.5-2.81,4.51-5.31,5.31Z"
        />
        <path
          fill="#ffffff"
          d="M138.95,73.77l-.04-15.26c.02-.27.05-.53.04-.8,0-.2-.03-.4-.05-.6v-.24s-.02.03-.02.03c-.64-6.89-8.04-14.17-16.79-13.94-8.34.21-16.15,7.19-16.15,16.15,0,8.75,7.47,15.71,14.93,16.04,4.04.18,7.37-1.62,9.86-3.65.1-.08.24-.01.24.12v2.16c0,.08.06.14.14.14h7.68c.08,0,.15-.07.15-.15ZM125.05,67.12c-6.47,1.82-12.25-3.96-10.43-10.43.76-2.68,2.9-4.83,5.58-5.58,6.47-1.82,12.25,3.96,10.43,10.43-.76,2.68-2.9,4.83-5.58,5.58Z"
        />
        <text fill="#ffffff" transform="translate(135.57 45.12)">
          <tspan x="0" y="0">TM</tspan>
        </text>
        <g fill="#ffffff">
          <path d="M27.59,85.49c0,.9-.6,1.61-1.56,1.61s-1.55-.71-1.55-1.61v-1.79c0-.9.58-1.61,1.54-1.61s1.55.67,1.55,1.55v.02h-.66v-.02c0-.53-.33-.92-.89-.92s-.88.42-.88.99v1.78c0,.57.32.99.9.99s.9-.42.9-.98v-.06h.67v.06Z" />
          <path d="M31.07,86.37h1.78v.62h-2.44v-4.79h.66v4.17Z" />
          <path d="M36.18,82.82v1.4h1.52v.62h-1.52v1.53h1.94v.62h-2.6v-4.79h2.6v.62h-1.94Z" />
          <path d="M43.14,85.86h-1.56l-.33,1.13h-.71l1.48-4.79h.66l1.48,4.79h-.7l-.33-1.13ZM42.96,85.24l-.6-2.07-.6,2.07h1.2Z" />
          <path d="M49.97,82.2v4.79h-.59l-1.94-3.47v3.47h-.66v-4.79h.61l1.92,3.38v-3.38h.66Z" />
          <path d="M53.7,82.2v4.79h-.66v-4.79h.66Z" />
          <path d="M59.96,82.2v4.79h-.59l-1.94-3.47v3.47h-.66v-4.79h.61l1.92,3.38v-3.38h.66Z" />
          <path d="M66.05,84.5c-.01.39-.03.78-.04,1.17-.03.16-.06.32-.09.49-.02.15-.1.44-.34.66-.37.35-.88.31-1.18.29-.25-.02-.61-.05-.94-.31-.36-.28-.56-.73-.56-1.25v-1.85c0-.9.61-1.61,1.59-1.61s1.53.68,1.53,1.54v.03h-.66v-.03c0-.51-.32-.92-.87-.92s-.92.42-.92.99v1.78c0,.59.34.99.93.99s.94-.34.94-.98v-.38h-.97v-.62h1.58Z" />
          <path d="M75.45,86.99c-.13-.13-.25-.26-.42-.45-.39.36-.83.52-1.33.52-.88,0-1.4-.59-1.4-1.27,0-.62.37-1.05.89-1.33v-.02c-.24-.3-.38-.63-.38-.95,0-.55.4-1.12,1.15-1.12.57,0,1,.38,1,.96,0,.48-.28.86-1,1.21v.02c.38.44.82.94,1.11,1.27.21-.32.35-.75.44-1.33h.54c-.12.72-.32,1.28-.65,1.68.24.26.48.51.75.8h-.7ZM74.74,86.21c-.27-.3-.78-.85-1.28-1.43-.24.16-.59.45-.59.92,0,.52.38.92.93.92.39,0,.72-.17.94-.41ZM73.36,83.43c0,.32.15.57.34.82.46-.26.75-.51.75-.89,0-.28-.16-.59-.53-.59s-.57.31-.57.66Z" />
          <path d="M82.47,84.84h-.31v2.15h-.66v-4.79h1.35c.99,0,1.43.65,1.43,1.32,0,.59-.34,1.16-1.09,1.29l1.53,2.18h-.78l-1.46-2.15ZM82.15,84.22h.69c.5,0,.76-.29.76-.7s-.26-.7-.76-.7h-.69v1.4Z" />
          <path d="M87.93,82.82v1.4h1.52v.62h-1.52v1.53h1.94v.62h-2.6v-4.79h2.6v.62h-1.94Z" />
          <path d="M94.87,83.57c0-.52-.37-.85-.84-.85-.41,0-.76.23-.76.66,0,.4.3.62.73.78l.49.18c.62.23,1.11.6,1.11,1.37,0,.88-.74,1.39-1.54,1.39s-1.56-.56-1.56-1.52v-.12h.66v.11c0,.54.38.91.9.91.49,0,.88-.28.88-.74s-.32-.64-.78-.82l-.49-.18c-.6-.23-1.06-.6-1.06-1.33s.59-1.31,1.42-1.31,1.49.6,1.49,1.46v.12h-.65v-.11Z" />
          <path d="M101.04,82.82h-1.21v4.17h-.66v-4.17h-1.21v-.62h3.08v.62Z" />
          <path d="M106.74,83.7v1.78c0,.91-.61,1.61-1.61,1.61s-1.61-.7-1.61-1.61v-1.78c0-.91.61-1.61,1.61-1.61s1.61.7,1.61,1.61ZM104.17,83.7v1.78c0,.57.34.99.96.99s.96-.42.96-.99v-1.78c0-.57-.34-.99-.96-.99s-.96.42-.96.99Z" />
          <path d="M110.65,84.84h-.31v2.15h-.66v-4.79h1.35c.99,0,1.43.65,1.43,1.32,0,.59-.34,1.16-1.09,1.29l1.53,2.18h-.78l-1.46-2.15ZM110.34,84.22h.69c.5,0,.76-.29.76-.7s-.26-.7-.76-.7h-.69v1.4Z" />
          <path d="M117.61,85.86h-1.56l-.33,1.13h-.71l1.48-4.79h.66l1.48,4.79h-.7l-.33-1.13ZM117.43,85.24l-.6-2.07-.6,2.07h1.2Z" />
          <path d="M123.56,82.82h-1.21v4.17h-.66v-4.17h-1.21v-.62h3.08v.62Z" />
          <path d="M126.9,82.2v4.79h-.66v-4.79h.66Z" />
          <path d="M133.08,83.7v1.78c0,.91-.61,1.61-1.61,1.61s-1.61-.7-1.61-1.61v-1.78c0-.91.61-1.61,1.61-1.61s1.61.7,1.61,1.61ZM130.51,83.7v1.78c0,.57.34.99.96.99s.96-.42.96-.99v-1.78c0-.57-.34-.99-.96-.99s-.96.42-.96.99Z" />
          <path d="M139.21,82.2v4.79h-.59l-1.94-3.47v3.47h-.66v-4.79h.61l1.92,3.38v-3.38h.66Z" />
        </g>
      </g>
    </svg>
  );
}

const STACK: { title: string; sub: string; val: string }[] = [
  { title: "Sofa deep clean (up to 3 seats)", sub: "Fabric-safe hot-water extraction", val: "$129" },
  { title: "Loveseat deep clean", sub: "Cushions, arms & backs", val: "$80" },
  { title: "Spot pre-treatment + deodorizer", sub: "Targets set-in stains & odors", val: "incl." },
  { title: "7-day satisfaction guarantee", sub: "Not happy? We re-clean free", val: "incl." },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Who qualifies for the $149 price?",
    a: "Any new residential Voda customer in Madison or the greater Dane County area, on their first upholstery cleaning. One offer per household.",
  },
  {
    q: "What furniture does this cover?",
    a: "One standard sofa (up to 3 seats) plus one loveseat. Sectionals, recliners, and additional chairs can be added at booking — we’ll confirm the total before any work starts.",
  },
  {
    q: "Is it safe for my fabric?",
    a: "Yes. We identify your fabric type and use the appropriate low-moisture or hot-water method, with fabric-safe solutions. Delicate materials like silk or leather are assessed first.",
  },
  {
    q: "Does this commit me to a plan?",
    a: "No. The $149 clean is a one-time service with zero commitment. You’re never enrolled in a recurring plan unless you choose one.",
  },
  {
    q: "Can I reschedule or cancel?",
    a: "Yes — reschedule or cancel free up to 24 hours before your appointment. No card is charged today; you pay on site once the job is done.",
  },
];

// Seconds remaining until midnight on the first of next month.
function secondsToMonthEnd(now: number): number {
  const end = new Date();
  end.setMonth(end.getMonth() + 1, 1);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((end.getTime() - now) / 1000));
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function OfferPage() {
  // Countdown ticks client-side only; `mounted` gates render to avoid a
  // server/client hydration mismatch on the time-dependent digits.
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  let diff = secondsToMonthEnd(now);
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hrs = Math.floor(diff / 3600);
  diff -= hrs * 3600;
  const min = Math.floor(diff / 60);
  const sec = diff - min * 60;

  const countdown = mounted
    ? [
        { v: pad(days), l: "Days" },
        { v: pad(hrs), l: "Hrs" },
        { v: pad(min), l: "Min" },
        { v: pad(sec), l: "Sec" },
      ]
    : [
        { v: "--", l: "Days" },
        { v: "--", l: "Hrs" },
        { v: "--", l: "Min" },
        { v: "--", l: "Sec" },
      ];

  const deadlineLabel =
    !mounted || days > 0 ? `Offer ends in ${mounted ? days : 30} day${days === 1 ? "" : "s"}` : "Offer ends today";

  return (
    <div style={{ fontFamily: "var(--font-barlow), sans-serif", color: "#152644", background: "#f4f6f9", overflowX: "hidden" }}>
      <style>{`
        .offer-cta{transition:background .15s ease}
        .offer-cta:hover{background:#C6FF94 !important}
        @media (min-width:760px){ .offer-sticky-cta{display:none !important} }
      `}</style>

      {/* MINIMAL HEADER (no nav) */}
      <header style={{ background: "#152644", padding: "14px 24px", display: "flex", justifyContent: "center" }}>
        <div style={{ maxWidth: 1000, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <VodaLogo style={{ height: 34, width: "auto", display: "block" }} />
          <div style={{ fontFamily: "var(--font-outfit), sans-serif", fontSize: 14, fontWeight: 600, color: "#cfd6e0" }}>🛡️ Licensed &amp; insured · ★ 4.9</div>
        </div>
      </header>

      {/* OFFER HERO */}
      <section style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#152644 0%,#152644 55%,#0c3a52 100%)" }}>
        <img
          src="/services/voda-upholstery.webp"
          alt="Voda upholstery cleaning"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.14 }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(21,38,68,.55),rgba(21,38,68,.9))" }} />
        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto", padding: "58px 24px 50px", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#03d9e5",
              color: "#152644",
              padding: "6px 14px",
              borderRadius: 999,
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: ".06em",
              marginBottom: 24,
              textTransform: "uppercase",
            }}
          >
            New-customer offer · Madison, WI
          </div>
          <h1
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 800,
              letterSpacing: "-.01em",
              lineHeight: 1.04,
              fontSize: "clamp(40px,7.5vw,66px)",
              margin: "0 0 18px",
              color: "#fff",
            }}
          >
            Sofa &amp; Loveseat
            <br />
            Deep Clean <span style={{ color: "#03d9e5" }}>$149</span>
          </h1>
          <p style={{ fontSize: "clamp(18px,2.6vw,21px)", lineHeight: 1.45, color: "#dfe4ec", margin: "0 0 8px" }}>
            Fabric-safe deep cleaning for your sofa and loveseat — <span style={{ textDecoration: "line-through", color: "#93a0b4" }}>normally $209</span>. That&apos;s{" "}
            <b style={{ color: "#fff" }}>$60 off</b> your first clean.
          </p>
          <p style={{ fontFamily: "var(--font-outfit), sans-serif", fontSize: 14.5, color: "#93a0b4", margin: "0 0 30px" }}>
            Discount applied automatically at checkout — no code to enter. Ends this month · first 40 homes.
          </p>

          {/* COUNTDOWN */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 30 }}>
            {countdown.map((c) => (
              <div
                key={c.l}
                style={{
                  background: "rgba(255,255,255,.07)",
                  border: "1px solid rgba(255,255,255,.16)",
                  borderRadius: 8,
                  padding: "14px 4px",
                  minWidth: 74,
                }}
              >
                <div style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 800, fontSize: "clamp(26px,5vw,36px)", lineHeight: 1, color: "#03d9e5" }}>{c.v}</div>
                <div style={{ fontFamily: "var(--font-outfit), sans-serif", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "#93a0b4", marginTop: 4 }}>{c.l}</div>
              </div>
            ))}
          </div>

          <Link
            href={BOOK_HREF}
            className="offer-cta"
            style={{
              display: "inline-block",
              background: "#03d9e5",
              color: "#152644",
              padding: "17px 40px",
              borderRadius: 8,
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 700,
              fontSize: 18,
              boxShadow: "0 8px 22px rgba(3,217,229,.35)",
            }}
          >
            Claim my $149 clean →
          </Link>
          <div style={{ fontFamily: "var(--font-outfit), sans-serif", fontSize: 13, color: "#93a0b4", marginTop: 14 }}>7-day re-clean guarantee · No card charged today</div>
        </div>
      </section>

      {/* VALUE STACK */}
      <section style={{ padding: "44px 24px 52px" }}>
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto",
            background: "#fff",
            border: "1px solid #e3e8ef",
            borderRadius: 14,
            padding: "clamp(26px,5vw,38px)",
            boxShadow: "0 1px 2px rgba(21,38,68,.05),0 8px 24px rgba(21,38,68,.07)",
          }}
        >
          <div style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 700, fontSize: 21, marginBottom: 22, textAlign: "center", color: "#152644" }}>What&apos;s included in your clean</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            {STACK.map((s) => (
              <div key={s.title} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    flex: "none",
                    borderRadius: 7,
                    background: "#e8f6ee",
                    color: "#1f9d62",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--font-outfit), sans-serif",
                    fontWeight: 800,
                  }}
                >
                  ✓
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 700, fontSize: 15.5, color: "#152644" }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: "#5b6675" }}>{s.sub}</div>
                </div>
                <div style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 700, color: "#5b6675" }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px dashed #d6dde6", paddingTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-outfit), sans-serif", fontSize: 15, color: "#5b6675" }}>
              Regular price<span style={{ textDecoration: "line-through" }}>$209</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 800, fontSize: 20, color: "#152644" }}>You pay today</span>
              <span style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 800, fontSize: 34, color: "#06b3bd" }}>$149</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section style={{ padding: "0 24px 52px" }}>
        <div style={{ maxWidth: 740, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 22, alignItems: "center" }}>
          <div style={{ aspectRatio: "4 / 3", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 6px rgba(21,38,68,.06),0 22px 50px rgba(21,38,68,.13)" }}>
            <img src="/services/voda-upholstery.webp" alt="Voda technician cleaning a sofa" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <div>
            <div style={{ color: "#F5B32E", fontSize: 22, marginBottom: 8 }}>★★★★★</div>
            <p style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 700, fontSize: "clamp(19px,3vw,23px)", lineHeight: 1.35, margin: "0 0 16px", letterSpacing: "-.01em", color: "#152644" }}>
              &quot;Our couch looks brand new — stains gone and dry by evening. Booking was quick and the $149 deal sealed it.&quot;
            </p>
            <div style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 700, color: "#152644" }}>Sarah L.</div>
            <div style={{ fontSize: 14, color: "#5b6675" }}>Rated 4.9/5 across 150+ Google reviews</div>
          </div>
        </div>
      </section>

      {/* MICRO FAQ */}
      <section style={{ padding: "0 24px 52px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 800, fontSize: 24, textAlign: "center", margin: "0 0 24px", letterSpacing: "-.01em", color: "#152644" }}>Before you book</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQS.map((f, i) => {
              const isOpen = !!open[i];
              return (
                <div key={f.q} style={{ background: "#fff", border: "1px solid #e3e8ef", borderRadius: 12, overflow: "hidden" }}>
                  <button
                    onClick={() => setOpen((st) => ({ ...st, [i]: !st[i] }))}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      padding: "18px 20px",
                      fontFamily: "var(--font-outfit), sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#152644",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      alignItems: "center",
                    }}
                    aria-expanded={isOpen}
                  >
                    {f.q}
                    <span style={{ transition: "transform .2s", fontSize: 19, color: "#06b3bd", transform: `rotate(${isOpen ? 45 : 0}deg)` }}>＋</span>
                  </button>
                  <div style={{ display: "grid", transition: "grid-template-rows .22s ease", gridTemplateRows: isOpen ? "1fr" : "0fr", overflow: "hidden" }}>
                    <div style={{ minHeight: 0, overflow: "hidden" }}>
                      <div style={{ padding: "0 20px 18px", color: "#5b6675", fontSize: 14.5, lineHeight: 1.6 }}>{f.a}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "0 24px 76px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", background: "#152644", color: "#fff", borderRadius: 16, padding: "clamp(34px,6vw,54px)", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: "auto -60px -80px auto", width: 280, height: 280, background: "radial-gradient(circle,rgba(3,217,229,.3),transparent 70%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontFamily: "var(--font-outfit), sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".04em", color: "#03d9e5" }}>⏳ {deadlineLabel}</div>
            <h2 style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 800, letterSpacing: "-.01em", fontSize: "clamp(28px,5vw,42px)", margin: "0 0 20px", color: "#fff" }}>Claim your $149 upholstery clean</h2>
            <Link
              href={BOOK_HREF}
              className="offer-cta"
              style={{ display: "inline-block", background: "#03d9e5", color: "#152644", padding: "17px 40px", borderRadius: 8, fontFamily: "var(--font-outfit), sans-serif", fontWeight: 700, fontSize: 18 }}
            >
              Book my appointment →
            </Link>
            <div style={{ fontFamily: "var(--font-outfit), sans-serif", fontSize: 13, color: "#93a0b4", marginTop: 14 }}>
              Offer auto-applied · No code · Call{" "}
              <a href={`tel:${PHONE_TEL}`} style={{ color: "#03d9e5" }}>
                {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* MINIMAL FOOTER */}
      <footer style={{ background: "#192a46", padding: "34px 24px 40px", textAlign: "center", color: "#aeb8c7", fontSize: 13 }}>
        <VodaLogo style={{ height: 30, width: "auto", margin: "0 auto 14px", display: "block" }} />
        <div style={{ fontFamily: "var(--font-barlow), sans-serif" }}>© 2026 Voda Cleaning &amp; Restoration · Madison, WI · Licensed &amp; Insured</div>
        <div style={{ marginTop: 8, opacity: 0.75, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
          Offer valid for new residential customers on a first upholstery cleaning of one sofa and one loveseat. One per household. Cannot be combined with other offers.
        </div>
      </footer>

      {/* STICKY MOBILE CTA */}
      <div
        className="offer-sticky-cta"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "#fff",
          borderTop: "1px solid #e3e8ef",
          padding: "12px 16px",
          display: "flex",
          gap: 12,
          alignItems: "center",
          boxShadow: "0 -8px 26px rgba(21,38,68,.12)",
        }}
      >
        <div style={{ flex: "none", textAlign: "left" }}>
          <div style={{ fontSize: 12, color: "#5b6675", textDecoration: "line-through", lineHeight: 1, fontFamily: "var(--font-outfit), sans-serif", fontWeight: 600 }}>$209</div>
          <div style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 800, fontSize: 22, color: "#06b3bd" }}>$149</div>
        </div>
        <Link href={BOOK_HREF} style={{ flex: 1, textAlign: "center", background: "#03d9e5", color: "#152644", padding: 15, borderRadius: 8, fontFamily: "var(--font-outfit), sans-serif", fontWeight: 700, fontSize: 16 }}>
          Claim offer →
        </Link>
      </div>
      <div className="offer-sticky-cta" style={{ height: 74 }} />
    </div>
  );
}
