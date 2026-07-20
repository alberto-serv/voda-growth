"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, Phone } from "lucide-react"

export function Hero() {
  const router = useRouter()

  return (
    <section className="pt-24 pb-16 bg-gradient-to-br from-[#152644] via-[#152644] to-[#03D9E5]/20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-balance leading-tight text-white">
                Professional <span className="text-[#03D9E5]">Cleaning & Restoration</span> Services
              </h1>
              <p className="text-xl text-[#E8E9EC] text-pretty leading-relaxed">
                Transform your space with our expert cleaning and restoration services. From residential homes to
                commercial properties, we deliver exceptional results every time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-8 bg-[#03D9E5] text-[#152644] hover:bg-[#C6FF94] hover:text-[#152644] font-semibold"
                onClick={() => router.push("/estimate")}
              >
                Get Free Estimate
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 bg-transparent border-[#03D9E5] text-white hover:bg-[#03D9E5] hover:text-[#152644]"
              >
                <Phone className="mr-2 h-5 w-5" />
                Call (608) 398-8632
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#03D9E5]">5000+</div>
                <div className="text-sm text-[#E8E9EC]">Projects Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#03D9E5]">5★</div>
                <div className="text-sm text-[#E8E9EC]">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#03D9E5]">20+</div>
                <div className="text-sm text-[#E8E9EC]">Years Experience</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
