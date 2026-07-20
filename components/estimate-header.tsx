import Link from "next/link"
import Image from "next/image"

/**
 * Checkout navbar in the /services6 style: a sticky white/blur bar whose content
 * sits in the same `container mx-auto px-4` box as the footer, with the logo
 * nudged up 4px to optically center its wordmark, a divider, the page title, and
 * a subtle step pill. Shared by the customer5, payment, and confirmation steps.
 */
export function EstimateHeader({ title, step }: { title: string; step?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e3e8ef] bg-white/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4 sm:gap-5">
        <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
          <Image
            src="/voda-logo.svg"
            alt="Voda Cleaning & Restoration"
            width={140}
            height={36}
            className="h-[30px] w-auto -translate-y-1"
          />
        </Link>
        <div className="h-6 w-px shrink-0 bg-[#e3e8ef]" />
        <h1 className="shrink-0 text-lg font-bold leading-none tracking-tight text-[#152644] sm:text-xl">
          {title}
        </h1>
        {step && (
          <span className="shrink-0 rounded-full border border-[#e3e8ef] bg-[#f4f6f9] px-3 py-1.5 text-xs font-semibold leading-none tracking-wide text-[#5b6675]">
            {step}
          </span>
        )}
      </div>
    </header>
  )
}
