import { redirect } from "next/navigation"

export default function EstimatePage() {
  // Redirect to the first step
  redirect("/estimate/services")
}
