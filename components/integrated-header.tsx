"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

export function IntegratedHeader({ title, step }: { title: string; step?: string }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="fixed top-0 w-full bg-white backdrop-blur-md border-b border-gray-200 shadow-sm z-50 transition-all duration-200">
      <div
        className={`max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-200 ${
          scrolled ? "py-2" : "py-2.5 sm:py-3"
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link href="/" className="hover:opacity-80 transition-opacity shrink-0">
            <Image
              src="/voda-logo.svg"
              alt="Voda Cleaning & Restoration"
              width={200}
              height={60}
              className={`w-auto transition-all duration-200 -translate-y-[4px] sm:-translate-y-[5px] lg:-translate-y-[6px] ${
                scrolled ? "h-7 lg:h-9" : "h-8 sm:h-9 lg:h-11"
              }`}
            />
          </Link>
          <div className="h-7 sm:h-8 w-px bg-gray-200 shrink-0 self-center" />
          <h1 className="text-lg sm:text-2xl font-bold text-[#152644] tracking-tight leading-none shrink-0 self-center">
            {title}
          </h1>
          {step && (
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-wider leading-none shrink-0 self-center border border-gray-200">
              {step}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
