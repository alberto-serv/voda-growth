import type { Metadata } from "next";

// Product-led Madison landing pages (/lp/madison/*). Kept out of search so
// these experimental variants don't compete with the canonical marketing pages.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LpMadisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
