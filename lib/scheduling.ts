export interface TimeSlot {
  value: string
  label: string
}

// Standard business-hours windows used for regular (paid) bookings.
export const businessTimeSlots: TimeSlot[] = [
  { value: "8am", label: "8:00 AM" },
  { value: "10am", label: "10:00 AM" },
  { value: "11am", label: "11:00 AM" },
  { value: "1pm", label: "1:00 PM" },
  { value: "2pm", label: "2:00 PM" },
  { value: "4pm", label: "4:00 PM" },
]

const formatHourLabel = (hour: number) => {
  const period = hour < 12 ? "AM" : "PM"
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:00 ${period}`
}

// Emergency / remediation requests are 24/7 — every hour of the day is selectable.
// Ordered to start at 8 AM (the typical preferred window) and wrap through to 7 AM.
export const emergencyTimeSlots: TimeSlot[] = Array.from({ length: 24 }, (_, i) => {
  const hour = (i + 8) % 24
  return { value: `${hour}h`, label: formatHourLabel(hour) }
})

// Minimum lead time the team needs before an emergency appointment, in hours.
export const EMERGENCY_NOTICE_HOURS = 2

// Convert a business-hours slot value (e.g. "8am", "1pm") to a 24-hour number,
// so same-day lead-time filtering can compare it against the current hour.
export const slotTo24Hour = (value: string) => {
  const match = value.match(/^(\d+)(am|pm)$/i)
  if (!match) return parseInt(value, 10)
  let hour = parseInt(match[1], 10) % 12
  if (match[2].toLowerCase() === "pm") hour += 12
  return hour
}

// Legacy time-window keys kept so older bookings still render a readable label.
const legacyWindows: Record<string, string> = {
  morning: "Morning (8:00 AM - 12:00 PM)",
  afternoon: "Afternoon (12:00 PM - 4:00 PM)",
  evening: "Evening (5:00 PM - 7:00 PM)",
  flexible: "Flexible - Any Time",
}

const labelMap: Record<string, string> = {
  ...legacyWindows,
  ...Object.fromEntries(
    [...businessTimeSlots, ...emergencyTimeSlots].map((slot) => [slot.value, slot.label]),
  ),
}

export const resolveTimeWindowLabel = (value?: string) =>
  value ? labelMap[value] ?? value : ""
