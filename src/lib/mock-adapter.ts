import { DataAdapter } from './data-adapter'
import {
  Holder,
  Release,
  Track,
  ReleaseSplit,
  TrackSplit,
  Transaction,
  WorkspaceSettings,
  HolderBalance,
  Statement,
  StatementEarning,
} from '@/types'
// import { DEFAULT_MIN_PAYOUT_MINOR } from './constants'  // Commented out as it's not currently used
import { allocateRevenue, calculateBalances } from './allocation'

import holdersData from '@/data/holders.json'
import releasesData from '@/data/releases.json'
import tracksData from '@/data/tracks.json'
import releaseSplitsData from '@/data/release-splits.json'
import trackSplitsData from '@/data/track-splits.json'
import transactionsData from '@/data/transactions.json'
import workspaceSettingsData from '@/data/workspace-settings.json'

class MockAdapter implements DataAdapter {
  private data = {
    holders: [...holdersData] as Holder[],
    releases: [...releasesData] as Release[],
    tracks: [...tracksData] as Track[],
    releaseSplits: [...releaseSplitsData] as ReleaseSplit[],
    trackSplits: [...trackSplitsData] as TrackSplit[],
    transactions: [...transactionsData.map(t => ({
      ...t,
      release_id: t.release_id || undefined,
      track_id: t.track_id || undefined,
      holder_id: t.holder_id || undefined,
      reference: t.reference || undefined,
      created_by: t.created_by || undefined,
    }))] as Transaction[],
    workspaceSettings: { ...workspaceSettingsData } as WorkspaceSettings,
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  holders = {
    getAll: async (): Promise<Holder[]> => {
      return [...this.data.holders]
    },

    getById: async (id: string): Promise<Holder | null> => {
      return this.data.holders.find(h => h.id === id) || null
    },

    create: async (data: Omit<Holder, 'id' | 'created_at' | 'updated_at'>): Promise<Holder> => {
      const now = new Date().toISOString()
      const holder: Holder = {
        ...data,
        id: this.generateId(),
        created_at: now,
        updated_at: now,
      }
      this.data.holders.push(holder)
      return holder
    },

    update: async (id: string, data: Partial<Holder>): Promise<Holder> => {
      const index = this.data.holders.findIndex(h => h.id === id)
      if (index === -1) throw new Error('Holder not found')
      
      const updated = {
        ...this.data.holders[index],
        ...data,
        updated_at: new Date().toISOString(),
      }
      this.data.holders[index] = updated
      return updated
    },

    delete: async (id: string): Promise<void> => {
      const index = this.data.holders.findIndex(h => h.id === id)
      if (index === -1) throw new Error('Holder not found')
      this.data.holders.splice(index, 1)
    },

    getBalances: async (): Promise<HolderBalance[]> => {
      const holders = await this.holders.getAll()
      const transactions = await this.transactions.getAll()
      const releases = await this.releases.getAll()
      const tracks = await this.tracks.getAll()
      const releaseSplits = this.data.releaseSplits
      const trackSplits = this.data.trackSplits
      const settings = await this.settings.get()

      return calculateBalances(
        holders,
        transactions,
        releases,
        tracks,
        releaseSplits,
        trackSplits,
        settings
      )
    },

    getStatement: async (holderId: string, startDate: string, endDate: string): Promise<Statement> => {
      const holder = await this.holders.getById(holderId)
      if (!holder) throw new Error('Holder not found')

      const transactions = this.data.transactions.filter(t => 
        t.created_at >= startDate && 
        t.created_at <= endDate &&
        (t.type === 'revenue' || (t.type === 'payout' && t.holder_id === holderId))
      )

      const releases = this.data.releases
      const tracks = this.data.tracks
      const releaseSplits = this.data.releaseSplits
      const trackSplits = this.data.trackSplits

      const earnings: StatementEarning[] = []
      let totalEarned = 0
      let totalPaid = 0

      for (const transaction of transactions) {
        if (transaction.type === 'revenue') {
          const allocations = allocateRevenue(
            transaction,
            releases,
            tracks,
            releaseSplits,
            trackSplits
          )
          
          const holderAllocation = allocations.find(a => a.holder_id === holderId)
          if (holderAllocation) {
            const release = releases.find(r => r.id === transaction.release_id)
            const track = tracks.find(t => t.id === transaction.track_id)
            
            earnings.push({
              transaction_id: transaction.id,
              date: transaction.created_at,
              description: transaction.description,
              release_title: release?.title,
              track_title: track?.title,
              amount: holderAllocation.amount,
            })
            
            totalEarned += holderAllocation.amount
          }
        } else if (transaction.type === 'payout' && transaction.holder_id === holderId) {
          totalPaid += Math.abs(transaction.amount)
        }
      }

      const balance = totalEarned - totalPaid
      const settings = await this.settings.get()
      const threshold = holder.min_payout_override ?? settings.min_payout_minor
      
      return {
        holder_id: holderId,
        holder_name: holder.name,
        period_start: startDate,
        period_end: endDate,
        earnings,
        total_earned: totalEarned,
        total_paid: totalPaid,
        balance,
        status: balance >= threshold ? 'payable' : 'below_threshold',
      }
    },
  }

  releases = {
    getAll: async (): Promise<Release[]> => {
      return [...this.data.releases]
    },

    getById: async (id: string): Promise<Release | null> => {
      return this.data.releases.find(r => r.id === id) || null
    },

    create: async (data: Omit<Release, 'id' | 'created_at' | 'updated_at'>): Promise<Release> => {
      const now = new Date().toISOString()
      const release: Release = {
        ...data,
        id: this.generateId(),
        created_at: now,
        updated_at: now,
      }
      this.data.releases.push(release)
      return release
    },

    update: async (id: string, data: Partial<Release>): Promise<Release> => {
      const index = this.data.releases.findIndex(r => r.id === id)
      if (index === -1) throw new Error('Release not found')
      
      const updated = {
        ...this.data.releases[index],
        ...data,
        updated_at: new Date().toISOString(),
      }
      this.data.releases[index] = updated
      return updated
    },

    delete: async (id: string): Promise<void> => {
      const index = this.data.releases.findIndex(r => r.id === id)
      if (index === -1) throw new Error('Release not found')
      this.data.releases.splice(index, 1)
    },
  }

  tracks = {
    getAll: async (): Promise<Track[]> => {
      return [...this.data.tracks]
    },

    getById: async (id: string): Promise<Track | null> => {
      return this.data.tracks.find(t => t.id === id) || null
    },

    getByReleaseId: async (releaseId: string): Promise<Track[]> => {
      return this.data.tracks.filter(t => t.release_id === releaseId)
    },

    create: async (data: Omit<Track, 'id' | 'created_at' | 'updated_at'>): Promise<Track> => {
      const now = new Date().toISOString()
      const track: Track = {
        ...data,
        id: this.generateId(),
        created_at: now,
        updated_at: now,
      }
      this.data.tracks.push(track)
      return track
    },

    update: async (id: string, data: Partial<Track>): Promise<Track> => {
      const index = this.data.tracks.findIndex(t => t.id === id)
      if (index === -1) throw new Error('Track not found')
      
      const updated = {
        ...this.data.tracks[index],
        ...data,
        updated_at: new Date().toISOString(),
      }
      this.data.tracks[index] = updated
      return updated
    },

    delete: async (id: string): Promise<void> => {
      const index = this.data.tracks.findIndex(t => t.id === id)
      if (index === -1) throw new Error('Track not found')
      this.data.tracks.splice(index, 1)
    },
  }

  releaseSplits = {
    getByReleaseId: async (releaseId: string): Promise<ReleaseSplit[]> => {
      return this.data.releaseSplits.filter(s => s.release_id === releaseId)
    },

    upsertSplits: async (
      releaseId: string,
      splits: Array<{ holder_id: string; percentage: number }>
    ): Promise<ReleaseSplit[]> => {
      this.data.releaseSplits = this.data.releaseSplits.filter(s => s.release_id !== releaseId)
      
      const now = new Date().toISOString()
      const newSplits = splits.map(split => ({
        id: this.generateId(),
        release_id: releaseId,
        holder_id: split.holder_id,
        percentage: split.percentage,
        created_at: now,
      }))
      
      this.data.releaseSplits.push(...newSplits)
      return newSplits
    },

    deleteByReleaseId: async (releaseId: string): Promise<void> => {
      this.data.releaseSplits = this.data.releaseSplits.filter(s => s.release_id !== releaseId)
    },
  }

  trackSplits = {
    getByTrackId: async (trackId: string): Promise<TrackSplit[]> => {
      return this.data.trackSplits.filter(s => s.track_id === trackId)
    },

    upsertSplits: async (
      trackId: string,
      splits: Array<{ holder_id: string; percentage: number }>
    ): Promise<TrackSplit[]> => {
      this.data.trackSplits = this.data.trackSplits.filter(s => s.track_id !== trackId)
      
      const now = new Date().toISOString()
      const newSplits = splits.map(split => ({
        id: this.generateId(),
        track_id: trackId,
        holder_id: split.holder_id,
        percentage: split.percentage,
        created_at: now,
      }))
      
      this.data.trackSplits.push(...newSplits)
      return newSplits
    },

    deleteByTrackId: async (trackId: string): Promise<void> => {
      this.data.trackSplits = this.data.trackSplits.filter(s => s.track_id !== trackId)
    },
  }

  transactions = {
    getAll: async (): Promise<Transaction[]> => {
      return [...this.data.transactions]
    },

    getById: async (id: string): Promise<Transaction | null> => {
      return this.data.transactions.find(t => t.id === id) || null
    },

    getByHolderId: async (holderId: string): Promise<Transaction[]> => {
      return this.data.transactions.filter(t => t.holder_id === holderId)
    },

    getByDateRange: async (startDate: string, endDate: string): Promise<Transaction[]> => {
      return this.data.transactions.filter(t => 
        t.created_at >= startDate && t.created_at <= endDate
      )
    },

    create: async (data: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> => {
      const transaction: Transaction = {
        ...data,
        id: this.generateId(),
        created_at: new Date().toISOString(),
      }
      this.data.transactions.push(transaction)
      return transaction
    },

    update: async (id: string, data: Partial<Transaction>): Promise<Transaction> => {
      const index = this.data.transactions.findIndex(t => t.id === id)
      if (index === -1) throw new Error('Transaction not found')
      
      const updated = {
        ...this.data.transactions[index],
        ...data,
      }
      this.data.transactions[index] = updated
      return updated
    },

    delete: async (id: string): Promise<void> => {
      const index = this.data.transactions.findIndex(t => t.id === id)
      if (index === -1) throw new Error('Transaction not found')
      this.data.transactions.splice(index, 1)
    },
  }

  settings = {
    get: async (): Promise<WorkspaceSettings> => {
      return { ...this.data.workspaceSettings }
    },

    update: async (data: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> => {
      const updated = {
        ...this.data.workspaceSettings,
        ...data,
        updated_at: new Date().toISOString(),
      }
      this.data.workspaceSettings = updated
      return updated
    },
  }
}

export const mockAdapter = new MockAdapter()