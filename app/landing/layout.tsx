import type { Metadata } from "next";

// Product-led carpet-cleaning landing page (Carpet × Madison). Kept out of
// search so this experimental variant doesn't compete with the canonical
// marketing pages.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
