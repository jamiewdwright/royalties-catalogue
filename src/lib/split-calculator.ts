import { 
  ReleaseSplit, 
  TrackSplit, 
  SplitAllocation, 
  SplitCalculationResult 
} from '@/types'

/**
 * SPLIT CALCULATOR SERVICE
 * 
 * This service handles revenue allocation calculations for both standard and tiered split methods.
 * 
 * Standard Method:
 * - All splits are percentages of total revenue
 * - Must sum to exactly 100%
 * - Simple proportional allocation
 * 
 * Primary First Method (Tiered):
 * - Primary splits take their percentage from gross revenue (in order)
 * - Secondary splits share the remaining revenue pool
 * - Secondary splits must sum to 100% of remainder
 * - Enables industry-standard structures like management commissions
 */

export class SplitCalculator {
  /**
   * Calculate revenue allocations based on splits and method
   */
  static calculateAllocations(
    revenue: number,
    splits: (ReleaseSplit | TrackSplit)[],
    method: 'standard' | 'primary_first'
  ): SplitCalculationResult {
    if (method === 'standard') {
      return this.calculateStandardSplits(revenue, splits)
    } else {
      return this.calculatePrimaryFirstSplits(revenue, splits)
    }
  }

  /**
   * Calculate standard splits - all percentages from total revenue
   */
  private static calculateStandardSplits(
    revenue: number,
    splits: (ReleaseSplit | TrackSplit)[]
  ): SplitCalculationResult {
    const allocations: SplitAllocation[] = []
    let calculationOrder = 1

    // Sort splits by order for consistent calculation
    const sortedSplits = [...splits].sort((a, b) => {
      // For standard method, use split_order if available, otherwise by creation time
      const orderA = a.split_order || 1
      const orderB = b.split_order || 1
      return orderA - orderB
    })

    // Calculate each split as percentage of total revenue
    for (const split of sortedSplits) {
      const amount = Math.round(revenue * (split.percentage / 100))
      
      allocations.push({
        split,
        amount,
        base_amount: revenue,
        calculation_order: calculationOrder++
      })
    }

    return {
      allocations,
      total_revenue: revenue,
      primary_deductions: 0,  // No primary deductions in standard method
      secondary_pool: revenue,
      method: 'standard'
    }
  }

  /**
   * Calculate tiered splits - primary from gross, secondary from remainder
   */
  private static calculatePrimaryFirstSplits(
    revenue: number,
    splits: (ReleaseSplit | TrackSplit)[]
  ): SplitCalculationResult {
    const allocations: SplitAllocation[] = []
    let calculationOrder = 1
    let remainingRevenue = revenue

    // Separate and sort splits by tier and order
    const primarySplits = splits
      .filter(s => s.tier === 'primary')
      .sort((a, b) => a.split_order - b.split_order)

    const secondarySplits = splits
      .filter(s => s.tier === 'secondary')
      .sort((a, b) => a.split_order - b.split_order)

    // Calculate primary splits from gross revenue (in order)
    for (const split of primarySplits) {
      const amount = Math.round(revenue * (split.percentage / 100))
      remainingRevenue -= amount
      
      allocations.push({
        split,
        amount,
        base_amount: revenue,  // Primary splits calculate from gross
        calculation_order: calculationOrder++
      })
    }

    // Calculate secondary splits from remaining revenue
    for (const split of secondarySplits) {
      const amount = Math.round(remainingRevenue * (split.percentage / 100))
      
      allocations.push({
        split,
        amount,
        base_amount: remainingRevenue,  // Secondary splits calculate from remainder
        calculation_order: calculationOrder++
      })
    }

    const primaryDeductions = revenue - remainingRevenue

    return {
      allocations,
      total_revenue: revenue,
      primary_deductions: primaryDeductions,
      secondary_pool: remainingRevenue,
      method: 'primary_first'
    }
  }

  /**
   * Validate splits configuration for a given method
   */
  static validateSplits(
    splits: (ReleaseSplit | TrackSplit)[],
    method: 'standard' | 'primary_first'
  ): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    if (splits.length === 0) {
      errors.push('At least one split is required')
      return { isValid: false, errors, warnings }
    }

    if (method === 'standard') {
      return this.validateStandardSplits(splits)
    } else {
      return this.validatePrimaryFirstSplits(splits)
    }
  }

  /**
   * Validate standard splits - must sum to 100%
   */
  private static validateStandardSplits(splits: (ReleaseSplit | TrackSplit)[]): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0)
    const tolerance = 0.01  // Allow small floating point differences

    if (Math.abs(totalPercentage - 100) > tolerance) {
      errors.push(`Standard splits must sum to exactly 100%, currently ${totalPercentage.toFixed(2)}%`)
    }

    // Check for duplicate holders
    const holderIds = splits.map(s => s.holder_id)
    const uniqueHolderIds = new Set(holderIds)
    if (holderIds.length !== uniqueHolderIds.size) {
      errors.push('Cannot assign the same holder multiple times')
    }

    // Check for zero percentages
    const zeroSplits = splits.filter(s => s.percentage <= 0)
    if (zeroSplits.length > 0) {
      errors.push('All splits must have a percentage greater than 0')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate tiered splits - primary can be 0-99%, secondary must sum to 100%
   */
  private static validatePrimaryFirstSplits(splits: (ReleaseSplit | TrackSplit)[]): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []
    const tolerance = 0.01

    const primarySplits = splits.filter(s => s.tier === 'primary')
    const secondarySplits = splits.filter(s => s.tier === 'secondary')

    // Validate primary splits
    const primaryTotal = primarySplits.reduce((sum, split) => sum + split.percentage, 0)
    
    if (primaryTotal >= 100) {
      errors.push(`Primary splits total ${primaryTotal.toFixed(2)}% - must be less than 100% to leave funds for secondary splits`)
    }

    if (primaryTotal < 0) {
      errors.push('Primary splits total cannot be negative')
    }

    // Validate secondary splits
    if (secondarySplits.length === 0) {
      errors.push('At least one secondary split is required when using tiered method')
    } else {
      const secondaryTotal = secondarySplits.reduce((sum, split) => sum + split.percentage, 0)
      
      if (Math.abs(secondaryTotal - 100) > tolerance) {
        errors.push(`Secondary splits must sum to exactly 100%, currently ${secondaryTotal.toFixed(2)}%`)
      }
    }

    // Check for duplicate holders across all tiers
    const holderIds = splits.map(s => s.holder_id)
    const uniqueHolderIds = new Set(holderIds)
    if (holderIds.length !== uniqueHolderIds.size) {
      errors.push('Cannot assign the same holder multiple times')
    }

    // Check for zero percentages
    const zeroSplits = splits.filter(s => s.percentage <= 0)
    if (zeroSplits.length > 0) {
      errors.push('All splits must have a percentage greater than 0')
    }

    // Warnings
    if (primaryTotal > 50) {
      warnings.push('Primary splits exceed 50% - ensure this matches your intended agreement')
    }

    if (primarySplits.length > 5) {
      warnings.push('Many primary splits may complicate revenue calculations')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Generate a preview calculation for display purposes
   */
  static generatePreview(
    exampleRevenue: number,
    splits: (ReleaseSplit | TrackSplit)[],
    method: 'standard' | 'primary_first'
  ): {
    allocations: Array<{
      holder_id: string
      description?: string
      tier?: 'primary' | 'secondary'
      percentage: number
      amount: number
      calculation_note: string
    }>
    summary: {
      total_revenue: number
      primary_deductions: number
      secondary_pool: number
      method: string
    }
  } {
    const result = this.calculateAllocations(exampleRevenue, splits, method)
    
    const allocations = result.allocations.map(allocation => ({
      holder_id: allocation.split.holder_id,
      description: allocation.split.description,
      tier: allocation.split.tier,
      percentage: allocation.split.percentage,
      amount: allocation.amount,
      calculation_note: method === 'primary_first' 
        ? allocation.split.tier === 'primary'
          ? `${allocation.split.percentage}% of £${(allocation.base_amount / 100).toFixed(2)} (gross)`
          : `${allocation.split.percentage}% of £${(allocation.base_amount / 100).toFixed(2)} (remainder)`
        : `${allocation.split.percentage}% of £${(allocation.base_amount / 100).toFixed(2)}`
    }))

    return {
      allocations,
      summary: {
        total_revenue: result.total_revenue,
        primary_deductions: result.primary_deductions,
        secondary_pool: result.secondary_pool,
        method: result.method
      }
    }
  }

  /**
   * Helper to format currency amounts
   */
  static formatCurrency(amountInMinorUnits: number, currency = 'GBP'): string {
    const amount = amountInMinorUnits / 100
    const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
    return `${symbol}${amount.toFixed(2)}`
  }

  /**
   * Helper to format percentages
   */
  static formatPercentage(percentage: number): string {
    return `${percentage.toFixed(2)}%`
  }
}