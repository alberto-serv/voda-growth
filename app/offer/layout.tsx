import type { Metadata } from "next";

// New-customer upholstery offer landing page ($149 sofa & loveseat deep clean).
// Kept out of search so it doesn't compete with the canonical marketing pages.
export const metadata: Metadata = {
  title: "Sofa & Loveseat Deep Clean — $149 | Voda Cleaning",
  description:
    "New-customer offer in Madison, WI: fabric-safe sofa and loveseat deep clean for $149 (normally $209). 7-day re-clean guarantee. No card charged today.",
  robots: { index: false, follow: false },
};

export default function OfferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
