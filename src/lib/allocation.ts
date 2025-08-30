import {
  Transaction,
  Release,
  Track,
  ReleaseSplit,
  TrackSplit,
  Holder,
  HolderBalance,
  WorkspaceSettings,
} from '@/types'

/**
 * ROYALTY ALLOCATION ENGINE
 * 
 * This module contains the core business logic for distributing revenue among holders.
 * Key principles:
 * - All amounts are in minor units (pence) for precision
 * - Uses largest remainder method for rounding to ensure exact totals
 * - Deterministic - same inputs always produce same outputs
 * - Auditable - every penny is accounted for
 */

/**
 * Result of allocating a transaction to holders
 */
export interface Allocation {
  holder_id: string  // Who gets the money
  percentage: number // What percentage they should receive
  amount: number     // Actual amount allocated in minor units (after rounding)
}

/**
 * Main function to allocate revenue from a transaction to holders
 * 
 * Logic:
 * 1. Determine which splits to use (release vs track)
 * 2. Validate splits sum to 100%
 * 3. Apply largest remainder method for exact allocation
 * 
 * @param transaction The revenue transaction to allocate
 * @param releases All releases (to find parent release for tracks)
 * @param tracks All tracks (to check split inheritance rules)
 * @param releaseSplits Release-level split configurations
 * @param trackSplits Track-level split configurations
 * @returns Array of allocations showing how much each holder receives
 */
export function allocateRevenue(
  transaction: Transaction,
  releases: Release[],
  tracks: Track[],
  releaseSplits: ReleaseSplit[],
  trackSplits: TrackSplit[]
): Allocation[] {
  // Only process revenue transactions (not payouts or adjustments)
  if (transaction.type !== 'revenue') {
    return []
  }

  let splits: { holder_id: string; percentage: number }[] = []

  // STEP 1: Determine which splits to use based on transaction linking
  if (transaction.track_id) {
    // Transaction is linked to a specific track
    const track = tracks.find(t => t.id === transaction.track_id)
    if (!track) {
      throw new Error(`Track not found: ${transaction.track_id}`)
    }

    // Check track's split inheritance setting
    if (track.use_release_splits) {
      // Use release-level splits (inherit from parent release)
      splits = releaseSplits
        .filter(s => s.release_id === track.release_id)
        .map(s => ({ holder_id: s.holder_id, percentage: s.percentage }))
    } else {
      // Use custom track-level splits
      splits = trackSplits
        .filter(s => s.track_id === track.id)
        .map(s => ({ holder_id: s.holder_id, percentage: s.percentage }))
    }
  } else if (transaction.release_id) {
    // Transaction is linked to entire release
    splits = releaseSplits
      .filter(s => s.release_id === transaction.release_id)
      .map(s => ({ holder_id: s.holder_id, percentage: s.percentage }))
  }

  // STEP 2: Validate we found splits
  if (splits.length === 0) {
    throw new Error('No splits found for transaction')
  }

  // STEP 3: Validate splits sum to 100% (with small tolerance for floating point precision)
  const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0)
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Splits do not sum to 100%: ${totalPercentage}%`)
  }

  // STEP 4: Apply largest remainder method to allocate the exact amount
  return allocateWithLargestRemainder(transaction.amount, splits)
}

/**
 * Allocates an amount among holders using the largest remainder method
 * 
 * This is the core of our rounding strategy. The largest remainder method ensures:
 * 1. Every penny is allocated (no money lost to rounding)
 * 2. Allocations are as close to the exact percentages as possible
 * 3. Results are deterministic (same inputs = same outputs)
 * 
 * How it works:
 * 1. Calculate exact amount for each holder (may have decimals)
 * 2. Floor all amounts (this creates a remainder)
 * 3. Sort by largest decimal remainder
 * 4. Distribute remaining pennies one by one to holders with largest remainders
 * 
 * Example: £1.00 split 33.33% / 33.33% / 33.34%
 * - Exact: 33.33p, 33.33p, 33.34p
 * - Floor: 33p, 33p, 33p = 99p (1p remaining)
 * - Remainders: 0.33, 0.33, 0.34
 * - Final: 33p, 33p, 34p = 100p ✓
 * 
 * @param totalAmount Total amount to distribute in minor units
 * @param splits Array of holders and their percentage entitlements
 * @returns Allocations with exact amounts that sum to totalAmount
 */
export function allocateWithLargestRemainder(
  totalAmount: number,
  splits: { holder_id: string; percentage: number }[]
): Allocation[] {
  const allocations: Allocation[] = []
  let remainingAmount = totalAmount

  // STEP 1: Calculate floor amounts for each holder
  for (const split of splits) {
    const exactAmount = (totalAmount * split.percentage) / 100
    const floorAmount = Math.floor(exactAmount)
    
    allocations.push({
      holder_id: split.holder_id,
      percentage: split.percentage,
      amount: floorAmount,
    })
    
    remainingAmount -= floorAmount
  }

  // STEP 2: Sort by largest remainder (with tie-breaker for deterministic results)
  allocations.sort((a, b) => {
    const aRemainder = ((totalAmount * a.percentage) / 100) - a.amount
    const bRemainder = ((totalAmount * b.percentage) / 100) - b.amount
    
    // If remainders are essentially equal, use holder_id as tie-breaker
    if (Math.abs(bRemainder - aRemainder) < 0.0001) {
      return a.holder_id.localeCompare(b.holder_id)
    }
    
    // Sort by largest remainder first
    return bRemainder - aRemainder
  })

  // STEP 3: Distribute remaining pennies to holders with largest remainders
  for (let i = 0; i < remainingAmount && i < allocations.length; i++) {
    allocations[i].amount += 1
  }

  // STEP 4: Sort back to consistent order for predictable results
  allocations.sort((a, b) => a.holder_id.localeCompare(b.holder_id))

  return allocations
}

/**
 * Calculates current balances for all holders
 * 
 * This function processes all transactions to determine how much each holder is owed.
 * It handles three types of transactions:
 * - Revenue: Gets allocated to holders based on splits
 * - Payouts: Reduce the amount owed to a specific holder (negative amounts)
 * - Adjustments: Manual corrections to balances
 * 
 * @param holders All holders in the system
 * @param transactions All transactions to process
 * @param releases All releases (needed for allocation logic)
 * @param tracks All tracks (needed for allocation logic)
 * @param releaseSplits Release-level split configurations
 * @param trackSplits Track-level split configurations
 * @param settings Workspace settings (for default thresholds)
 * @returns Array of balance information for each holder
 */
export function calculateBalances(
  holders: Holder[],
  transactions: Transaction[],
  releases: Release[],
  tracks: Track[],
  releaseSplits: ReleaseSplit[],
  trackSplits: TrackSplit[],
  settings: WorkspaceSettings
): HolderBalance[] {
  // Initialize balance tracking for all holders
  const balanceMap = new Map<string, number>()

  holders.forEach(holder => {
    balanceMap.set(holder.id, 0)
  })

  // Process each transaction to update balances
  for (const transaction of transactions) {
    if (transaction.type === 'revenue') {
      // Revenue gets allocated to holders based on splits
      try {
        const allocations = allocateRevenue(
          transaction,
          releases,
          tracks,
          releaseSplits,
          trackSplits
        )
        
        // Add allocated amounts to each holder's balance
        for (const allocation of allocations) {
          const currentBalance = balanceMap.get(allocation.holder_id) || 0
          balanceMap.set(allocation.holder_id, currentBalance + allocation.amount)
        }
      } catch (error) {
        // Log allocation failures but continue processing other transactions
        console.warn(`Failed to allocate transaction ${transaction.id}:`, error)
      }
    } else if (transaction.type === 'payout' && transaction.holder_id) {
      // Payouts reduce the amount owed (amounts are typically negative)
      const currentBalance = balanceMap.get(transaction.holder_id) || 0
      balanceMap.set(transaction.holder_id, currentBalance + transaction.amount)
    } else if (transaction.type === 'adjustment' && transaction.holder_id) {
      // Adjustments are manual corrections (can be positive or negative)
      const currentBalance = balanceMap.get(transaction.holder_id) || 0
      balanceMap.set(transaction.holder_id, currentBalance + transaction.amount)
    }
  }

  // Convert balances to HolderBalance objects with payout status
  return holders.map(holder => {
    const owed = balanceMap.get(holder.id) || 0
    // Use holder's custom threshold or workspace default
    const threshold = holder.min_payout_override ?? settings.min_payout_minor
    
    return {
      holder_id: holder.id,
      owed,
      status: owed >= threshold ? 'payable' : 'below_threshold',
      threshold,
    }
  })
}

/**
 * Validates that a set of splits is valid for use in the system
 * 
 * Checks:
 * - At least one split exists
 * - All splits are positive and <= 100%
 * - No duplicate holders
 * - Total sums to exactly 100%
 * 
 * @param splits Array of holder splits to validate
 * @returns Object containing validation result and any error messages
 */
export function validateSplits(splits: { holder_id: string; percentage: number }[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Must have at least one split
  if (splits.length === 0) {
    errors.push('At least one split is required')
    return { valid: false, errors }
  }

  // Check total percentage (allow small floating point tolerance)
  const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0)
  
  if (Math.abs(totalPercentage - 100) > 0.01) {
    errors.push(`Splits must sum to 100% (currently ${totalPercentage.toFixed(1)}%)`)
  }

  // Check individual splits and track duplicates
  const holderIds = new Set<string>()
  for (const split of splits) {
    // Percentage must be positive
    if (split.percentage <= 0) {
      errors.push('All splits must be greater than 0%')
    }
    // Percentage can't exceed 100%
    if (split.percentage > 100) {
      errors.push('No split can be greater than 100%')
    }
    // Can't have same holder twice
    if (holderIds.has(split.holder_id)) {
      errors.push('Duplicate holder in splits')
    }
    holderIds.add(split.holder_id)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}