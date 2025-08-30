/**
 * CURRENCY AND FORMATTING UTILITIES
 * 
 * This module handles all currency operations and formatting for the application.
 * Key principle: All monetary values are stored as integers in minor units (pence)
 * to avoid floating point precision issues with financial calculations.
 */

// Application currency configuration
export const BASE_CURRENCY = 'GBP'                    // Default currency for the workspace
export const DEFAULT_MIN_PAYOUT_MINOR = 2000          // Default minimum payout threshold (£20.00)

// Currency conversion factor (1 GBP = 100 pence)
export const MINOR_UNIT_FACTOR = 100

/**
 * Formats an amount in minor units as a currency string
 * 
 * Example: formatCurrency(2050) => "£20.50"
 * 
 * @param amountInMinor Amount in minor units (pence)
 * @param currency Currency code (defaults to GBP)
 * @returns Formatted currency string using browser's locale formatting
 */
export function formatCurrency(amountInMinor: number, currency: string = BASE_CURRENCY): string {
  const amount = amountInMinor / MINOR_UNIT_FACTOR
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Converts a decimal amount to minor units
 * 
 * Example: parseCurrencyToMinor(20.50) => 2050
 * 
 * @param amount Decimal amount (e.g., 20.50)
 * @returns Amount in minor units, rounded to avoid floating point issues
 */
export function parseCurrencyToMinor(amount: number): number {
  return Math.round(amount * MINOR_UNIT_FACTOR)
}

/**
 * Formats a percentage with one decimal place
 * 
 * Example: formatPercentage(33.333) => "33.3%"
 * 
 * @param percentage Percentage as a number (e.g., 33.333)
 * @returns Formatted percentage string
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`
}