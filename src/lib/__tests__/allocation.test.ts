import { describe, it, expect } from 'vitest'
import {
  allocateWithLargestRemainder,
  allocateRevenue,
  calculateBalances,
  validateSplits,
} from '../allocation'
import { DEFAULT_MIN_PAYOUT_MINOR } from '../constants'
import type {
  Transaction,
  Release,
  Track,
  ReleaseSplit,
  TrackSplit,
  Holder,
  WorkspaceSettings,
} from '@/types'

describe('allocateWithLargestRemainder', () => {
  it('should allocate amounts with exact division', () => {
    const splits = [
      { holder_id: 'holder-1', percentage: 50 },
      { holder_id: 'holder-2', percentage: 50 },
    ]

    const result = allocateWithLargestRemainder(100, splits)

    expect(result).toEqual([
      { holder_id: 'holder-1', percentage: 50, amount: 50 },
      { holder_id: 'holder-2', percentage: 50, amount: 50 },
    ])
  })

  it('should distribute remainder using largest remainder method', () => {
    const splits = [
      { holder_id: 'holder-1', percentage: 33.33 },
      { holder_id: 'holder-2', percentage: 33.33 },
      { holder_id: 'holder-3', percentage: 33.34 },
    ]

    const result = allocateWithLargestRemainder(100, splits)

    const totalAllocated = result.reduce((sum, allocation) => sum + allocation.amount, 0)
    expect(totalAllocated).toBe(100)
    
    expect(result.find(r => r.holder_id === 'holder-1')?.amount).toBe(33)
    expect(result.find(r => r.holder_id === 'holder-2')?.amount).toBe(33)
    expect(result.find(r => r.holder_id === 'holder-3')?.amount).toBe(34)
  })

  it('should handle single penny amounts consistently', () => {
    const splits = [
      { holder_id: 'holder-1', percentage: 70 },
      { holder_id: 'holder-2', percentage: 30 },
    ]

    const result = allocateWithLargestRemainder(1, splits)

    expect(result).toEqual([
      { holder_id: 'holder-1', percentage: 70, amount: 1 },
      { holder_id: 'holder-2', percentage: 30, amount: 0 },
    ])
  })

  it('should sort results by holder_id for consistency', () => {
    const splits = [
      { holder_id: 'holder-z', percentage: 50 },
      { holder_id: 'holder-a', percentage: 50 },
    ]

    const result = allocateWithLargestRemainder(100, splits)

    expect(result[0].holder_id).toBe('holder-a')
    expect(result[1].holder_id).toBe('holder-z')
  })

  it('should handle deterministic rounding with identical remainders', () => {
    const splits = [
      { holder_id: 'holder-2', percentage: 33.33 },
      { holder_id: 'holder-1', percentage: 33.33 },
      { holder_id: 'holder-3', percentage: 33.34 },
    ]

    const result1 = allocateWithLargestRemainder(101, splits)
    const result2 = allocateWithLargestRemainder(101, splits)

    expect(result1).toEqual(result2)
    expect(result1.reduce((sum, a) => sum + a.amount, 0)).toBe(101)
  })
})

describe('validateSplits', () => {
  it('should validate correct splits', () => {
    const splits = [
      { holder_id: 'holder-1', percentage: 60 },
      { holder_id: 'holder-2', percentage: 40 },
    ]

    const result = validateSplits(splits)

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('should reject splits that dont sum to 100', () => {
    const splits = [
      { holder_id: 'holder-1', percentage: 60 },
      { holder_id: 'holder-2', percentage: 30 },
    ]

    const result = validateSplits(splits)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Splits must sum to 100% (currently 90.0%)')
  })

  it('should reject negative percentages', () => {
    const splits = [
      { holder_id: 'holder-1', percentage: 120 },
      { holder_id: 'holder-2', percentage: -20 },
    ]

    const result = validateSplits(splits)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('All splits must be greater than 0%')
    expect(result.errors).toContain('No split can be greater than 100%')
  })

  it('should reject duplicate holders', () => {
    const splits = [
      { holder_id: 'holder-1', percentage: 50 },
      { holder_id: 'holder-1', percentage: 50 },
    ]

    const result = validateSplits(splits)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Duplicate holder in splits')
  })

  it('should reject empty splits', () => {
    const result = validateSplits([])

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('At least one split is required')
  })
})

describe('allocateRevenue', () => {
  const releases: Release[] = [
    {
      id: 'release-1',
      title: 'Test Release',
      artist: 'Test Artist',
      release_type: 'single',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const tracks: Track[] = [
    {
      id: 'track-1',
      release_id: 'release-1',
      title: 'Test Track',
      track_number: 1,
      use_release_splits: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'track-2',
      release_id: 'release-1',
      title: 'Custom Track',
      track_number: 2,
      use_release_splits: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const releaseSplits: ReleaseSplit[] = [
    { id: 'rs-1', release_id: 'release-1', holder_id: 'holder-1', percentage: 70, created_at: '2024-01-01T00:00:00Z' },
    { id: 'rs-2', release_id: 'release-1', holder_id: 'holder-2', percentage: 30, created_at: '2024-01-01T00:00:00Z' },
  ]

  const trackSplits: TrackSplit[] = [
    { id: 'ts-1', track_id: 'track-2', holder_id: 'holder-1', percentage: 50, created_at: '2024-01-01T00:00:00Z' },
    { id: 'ts-2', track_id: 'track-2', holder_id: 'holder-2', percentage: 50, created_at: '2024-01-01T00:00:00Z' },
  ]

  it('should allocate revenue for release-level transaction', () => {
    const transaction: Transaction = {
      id: 'tx-1',
      type: 'revenue',
      amount: 1000,
      currency: 'GBP',
      description: 'Test revenue',
      release_id: 'release-1',
      created_at: '2024-01-01T00:00:00Z',
    }

    const result = allocateRevenue(transaction, releases, tracks, releaseSplits, trackSplits)

    expect(result).toEqual([
      { holder_id: 'holder-1', percentage: 70, amount: 700 },
      { holder_id: 'holder-2', percentage: 30, amount: 300 },
    ])
  })

  it('should use release splits for track with use_release_splits=true', () => {
    const transaction: Transaction = {
      id: 'tx-2',
      type: 'revenue',
      amount: 100,
      currency: 'GBP',
      description: 'Test revenue',
      track_id: 'track-1',
      created_at: '2024-01-01T00:00:00Z',
    }

    const result = allocateRevenue(transaction, releases, tracks, releaseSplits, trackSplits)

    expect(result).toEqual([
      { holder_id: 'holder-1', percentage: 70, amount: 70 },
      { holder_id: 'holder-2', percentage: 30, amount: 30 },
    ])
  })

  it('should use track splits for track with use_release_splits=false', () => {
    const transaction: Transaction = {
      id: 'tx-3',
      type: 'revenue',
      amount: 100,
      currency: 'GBP',
      description: 'Test revenue',
      track_id: 'track-2',
      created_at: '2024-01-01T00:00:00Z',
    }

    const result = allocateRevenue(transaction, releases, tracks, releaseSplits, trackSplits)

    expect(result).toEqual([
      { holder_id: 'holder-1', percentage: 50, amount: 50 },
      { holder_id: 'holder-2', percentage: 50, amount: 50 },
    ])
  })

  it('should return empty array for non-revenue transactions', () => {
    const transaction: Transaction = {
      id: 'tx-4',
      type: 'payout',
      amount: -100,
      currency: 'GBP',
      description: 'Test payout',
      holder_id: 'holder-1',
      created_at: '2024-01-01T00:00:00Z',
    }

    const result = allocateRevenue(transaction, releases, tracks, releaseSplits, trackSplits)

    expect(result).toEqual([])
  })

  it('should throw error for missing track', () => {
    const transaction: Transaction = {
      id: 'tx-5',
      type: 'revenue',
      amount: 100,
      currency: 'GBP',
      description: 'Test revenue',
      track_id: 'non-existent-track',
      created_at: '2024-01-01T00:00:00Z',
    }

    expect(() => {
      allocateRevenue(transaction, releases, tracks, releaseSplits, trackSplits)
    }).toThrow('Track not found: non-existent-track')
  })
})

describe('calculateBalances', () => {
  const holders: Holder[] = [
    {
      id: 'holder-1',
      name: 'Holder One',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'holder-2',
      name: 'Holder Two',
      min_payout_override: 5000, // £50 override
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const settings: WorkspaceSettings = {
    id: 'ws-1',
    base_currency: 'GBP',
    min_payout_minor: DEFAULT_MIN_PAYOUT_MINOR, // £20
    updated_at: '2024-01-01T00:00:00Z',
  }

  const releases: Release[] = [
    {
      id: 'release-1',
      title: 'Test Release',
      artist: 'Test Artist',
      release_type: 'single',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const tracks: Track[] = []

  const releaseSplits: ReleaseSplit[] = [
    { id: 'rs-1', release_id: 'release-1', holder_id: 'holder-1', percentage: 60, created_at: '2024-01-01T00:00:00Z' },
    { id: 'rs-2', release_id: 'release-1', holder_id: 'holder-2', percentage: 40, created_at: '2024-01-01T00:00:00Z' },
  ]

  const trackSplits: TrackSplit[] = []

  it('should calculate correct balances with revenue and payouts', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        type: 'revenue',
        amount: 10000, // £100
        currency: 'GBP',
        description: 'Revenue',
        release_id: 'release-1',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'tx-2',
        type: 'payout',
        amount: -3000, // -£30 payout to holder-1
        currency: 'GBP',
        description: 'Payout',
        holder_id: 'holder-1',
        created_at: '2024-01-02T00:00:00Z',
      },
    ]

    const result = calculateBalances(
      holders,
      transactions,
      releases,
      tracks,
      releaseSplits,
      trackSplits,
      settings
    )

    expect(result).toHaveLength(2)
    
    const holder1Balance = result.find(b => b.holder_id === 'holder-1')
    const holder2Balance = result.find(b => b.holder_id === 'holder-2')

    expect(holder1Balance).toEqual({
      holder_id: 'holder-1',
      owed: 3000, // £60 revenue - £30 payout = £30 owed
      threshold: DEFAULT_MIN_PAYOUT_MINOR, // £20 default
      status: 'payable', // £30 > £20
    })

    expect(holder2Balance).toEqual({
      holder_id: 'holder-2',
      owed: 4000, // £40 revenue
      threshold: 5000, // £50 override
      status: 'below_threshold', // £40 < £50
    })
  })

  it('should handle zero balances', () => {
    const transactions: Transaction[] = []

    const result = calculateBalances(
      holders,
      transactions,
      releases,
      tracks,
      releaseSplits,
      trackSplits,
      settings
    )

    expect(result).toHaveLength(2)
    expect(result.every(b => b.owed === 0 && b.status === 'below_threshold')).toBe(true)
  })

  it('should handle adjustments correctly', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        type: 'adjustment',
        amount: 1000, // £10 adjustment
        currency: 'GBP',
        description: 'Adjustment',
        holder_id: 'holder-1',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    const result = calculateBalances(
      holders,
      transactions,
      releases,
      tracks,
      releaseSplits,
      trackSplits,
      settings
    )

    const holder1Balance = result.find(b => b.holder_id === 'holder-1')
    expect(holder1Balance?.owed).toBe(1000) // £10
  })
})