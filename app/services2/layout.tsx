import type { Metadata } from "next";

// Alternate / experimental version of the services step. Kept out of search
// so it doesn't compete with the canonical /estimate/services page.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Services2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
