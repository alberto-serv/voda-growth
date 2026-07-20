/**
 * Formats a number with commas for thousands separators
 * @param num - The number to format
 * @returns Formatted string with commas
 */
export function formatNumber(num: number | string): string {
  const numValue = typeof num === "string" ? Number.parseFloat(num) : num
  if (isNaN(numValue)) return "0"
  return numValue.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

/**
 * Formats a price with dollar sign and commas
 * @param price - The price to format
 * @returns Formatted price string (e.g., "$1,234.56")
 */
export function formatPrice(price: number | string): string {
  const numValue = typeof price === "string" ? Number.parseFloat(price) : price
  if (isNaN(numValue)) return "$0"
  return `$${numValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
