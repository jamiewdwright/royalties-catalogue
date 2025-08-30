import { Transaction, Release, Track } from '@/types'

export type TimePeriod = '7d' | '30d' | '3m' | '6m' | '12m' | 'all'

export interface ReleasePerformance {
  release: Release
  totalRevenue: number
  transactionCount: number
  averageTransaction: number
  trackCount: number
  revenueShare: number
}

export function getDateRange(period: TimePeriod): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = now.toISOString()
  
  let startDate: string
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      break
    case '3m':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
      break
    case '6m':
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString()
      break
    case '12m':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
      break
    case 'all':
    default:
      startDate = '2000-01-01T00:00:00Z'
      break
  }
  
  return { startDate, endDate }
}

export function getTimePeriodLabel(period: TimePeriod): string {
  switch (period) {
    case '7d':
      return 'This Week'
    case '30d':
      return 'This Month'
    case '3m':
      return '3 Months'
    case '6m':
      return '6 Months'
    case '12m':
      return '12 Months'
    case 'all':
      return 'All Time'
    default:
      return 'Unknown'
  }
}

export function calculateReleasePerformance(
  releases: Release[],
  tracks: Track[],
  transactions: Transaction[]
): ReleasePerformance[] {
  const revenueTransactions = transactions.filter(t => t.type === 'revenue')
  const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0)
  
  const releasePerformance = releases.map(release => {
    const releaseTracks = tracks.filter(t => t.release_id === release.id)
    const trackIds = releaseTracks.map(t => t.id)
    
    const releaseTransactions = revenueTransactions.filter(t => 
      t.release_id === release.id || (t.track_id && trackIds.includes(t.track_id))
    )
    
    const releaseRevenue = releaseTransactions.reduce((sum, t) => sum + t.amount, 0)
    const transactionCount = releaseTransactions.length
    const averageTransaction = transactionCount > 0 ? releaseRevenue / transactionCount : 0
    const revenueShare = totalRevenue > 0 ? (releaseRevenue / totalRevenue) * 100 : 0
    
    return {
      release,
      totalRevenue: releaseRevenue,
      transactionCount,
      averageTransaction,
      trackCount: releaseTracks.length,
      revenueShare,
    }
  })
  
  return releasePerformance.sort((a, b) => b.totalRevenue - a.totalRevenue)
}

export function getOverallStats(transactions: Transaction[], releases: Release[]) {
  const revenueTransactions = transactions.filter(t => t.type === 'revenue')
  const payoutTransactions = transactions.filter(t => t.type === 'payout')
  
  const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0)
  const totalPayouts = Math.abs(payoutTransactions.reduce((sum, t) => sum + t.amount, 0))
  const totalTransactions = revenueTransactions.length
  const averageRevenue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
  
  return {
    totalRevenue,
    totalPayouts,
    totalTransactions,
    averageRevenue,
    totalReleases: releases.length,
    netBalance: totalRevenue - totalPayouts,
  }
}