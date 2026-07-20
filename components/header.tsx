"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

export function Header({ forceCollapse = false }: { forceCollapse?: boolean }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const collapsed = scrolled || forceCollapse

  return (
    <header
      className="fixed top-0 w-full bg-white backdrop-blur-md border-b border-gray-200 shadow-sm z-50 transition-all duration-200"
    >
      <div className={`container mx-auto px-4 transition-all duration-200 ${
        collapsed ? "py-1 lg:py-4" : "py-4"
      }`}>
        <div className="flex items-center justify-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/voda-logo.svg"
              alt="Voda Cleaning & Restoration"
              width={200}
              height={60}
              className={`w-auto transition-all duration-200 ${
                collapsed ? "h-6 lg:h-12" : "h-12"
              }`}
            />
          </Link>
        </div>
      </div>
    </header>
  )
}
