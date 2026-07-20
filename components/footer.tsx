import { Phone, Mail, Clock } from 'lucide-react'
import Image from "next/image"
import { business, formatPhoneUS, formatBusinessHours } from "@/lib/business"

export function Footer() {
  return (
    <footer className="bg-[#192A46] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <Image
              src="/voda-white-logo.svg"
              alt={business.brandName}
              width={200}
              height={60}
              className="h-12 w-auto"
            />
            <p className="text-[#E8E9EC] text-pretty max-w-sm">
              Professional cleaning and restoration services that transform your space and exceed your expectations.
            </p>
          </div>

          <div className="flex justify-end">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#03D9E5]">Contact</h3>
              <ul className="space-y-2 text-[#E8E9EC]">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#03D9E5] flex-shrink-0" />
                  <a
                    href={`tel:${business.businessPhone}`}
                    aria-label={`Call ${business.brandName}`}
                    className="hover:text-[#03D9E5] transition-colors"
                  >
                    {formatPhoneUS(business.businessPhone)}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#03D9E5] flex-shrink-0" />
                  <a
                    href={`mailto:${business.email}`}
                    className="hover:text-[#03D9E5] transition-colors"
                  >
                    {business.email}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#03D9E5] flex-shrink-0" />
                  <span>{formatBusinessHours(business.businessHours)}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-[#03D9E5]/20 mt-8 pt-8 text-center text-[#E8E9EC] text-sm">
          <p>&copy; {new Date().getFullYear()} {business.legalName}. All rights reserved. | Licensed & Insured</p>
        </div>
      </div>
    </footer>
  )
}
