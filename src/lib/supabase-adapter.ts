import { DataAdapter } from './data-adapter'
import { supabase } from './supabase'
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
} from '@/types'

/**
 * SUPABASE DATA ADAPTER
 * 
 * This adapter implements the DataAdapter interface using Supabase as the backend.
 * It provides CRUD operations for all entities in the royalties system,
 * connecting to the database schema defined in CLAUDE.md.
 * 
 * Database Schema (app schema):
 * - royalty_holders: People/entities who receive royalties
 * - releases: Albums/singles/EPs
 * - payments: Incoming revenue from distributors
 * - payment_allocations: How payments split across holders
 * - payout_batches: Payout runs (e.g., quarterly payments)
 * - payouts: Individual payments to holders
 * - payout_allocation_links: Audit trail linking allocations to payouts
 */

export const supabaseAdapter: DataAdapter = {
  /**
   * ROYALTY HOLDERS MANAGEMENT
   * Handles CRUD operations for people/entities who receive royalty payments
   */
  holders: {
    /**
     * Get all royalty holders from the database
     */
    async getAll(): Promise<Holder[]> {
      const { data, error } = await supabase
        .from('royalty_holders')
        .select('*')
        .order('name')
      
      if (error) throw new Error(`Failed to fetch holders: ${error.message}`)
      
      return data.map(mapDatabaseHolderToHolder)
    },

    /**
     * Get a specific royalty holder by ID
     */
    async getById(id: string): Promise<Holder | null> {
      const { data, error } = await supabase
        .from('royalty_holders')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw new Error(`Failed to fetch holder: ${error.message}`)
      }
      
      return mapDatabaseHolderToHolder(data)
    },

    /**
     * Create a new royalty holder
     */
    async create(data: Omit<Holder, 'id' | 'created_at' | 'updated_at'>): Promise<Holder> {
      const { data: newHolder, error } = await supabase
        .from('royalty_holders')
        .insert({
          name: data.name,
          email: data.email,
          address: data.address,
          sort_code: data.sort_code,
          account_number: data.account_number,
          vat_registered: data.vat_registered,
          min_payout_override: data.min_payout_override,
        })
        .select()
        .single()
      
      if (error) throw new Error(`Failed to create holder: ${error.message}`)
      
      return mapDatabaseHolderToHolder(newHolder)
    },

    /**
     * Update an existing royalty holder
     */
    async update(id: string, data: Partial<Holder>): Promise<Holder> {
      const updateData: any = {}
      
      // Map frontend fields to database fields
      if (data.name !== undefined) updateData.name = data.name
      if (data.email !== undefined) updateData.email = data.email
      if (data.address !== undefined) updateData.address = data.address
      if (data.sort_code !== undefined) updateData.sort_code = data.sort_code
      if (data.account_number !== undefined) updateData.account_number = data.account_number
      if (data.vat_registered !== undefined) updateData.vat_registered = data.vat_registered
      if (data.min_payout_override !== undefined) updateData.min_payout_override = data.min_payout_override
      
      const { data: updatedHolder, error } = await supabase
        .from('royalty_holders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(`Failed to update holder: ${error.message}`)
      
      return mapDatabaseHolderToHolder(updatedHolder)
    },

    /**
     * Delete a royalty holder (soft delete by setting status to inactive)
     */
    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('royalty_holders')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(`Failed to delete holder: ${error.message}`)
    },

    /**
     * Get computed balances for all holders using the view
     */
    async getBalances(): Promise<HolderBalance[]> {
      const { data, error } = await supabase
        .from('v_holder_balances')
        .select('*')
      
      if (error) throw new Error(`Failed to fetch holder balances: ${error.message}`)
      
      return data.map(row => ({
        holder_id: row.holder_id,
        owed: row.owed || 0,
        status: row.status as 'payable' | 'below_threshold',
        threshold: row.threshold || 2000
      }))
    },

    /**
     * Generate a statement for a holder within a date range
     */
    async getStatement(holderId: string, startDate: string, endDate: string): Promise<Statement> {
      // Get transactions for this holder within date range
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select(`
          *,
          releases:release_id(title),
          tracks:track_id(title)
        `)
        .eq('holder_id', holderId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at')
      
      if (transError) throw new Error(`Failed to fetch transactions: ${transError.message}`)
      
      // Get holder details
      const holder = await this.getById(holderId)
      if (!holder) throw new Error('Holder not found')
      
      // Filter revenue transactions for earnings
      const revenueTransactions = transactions?.filter(t => t.type === 'revenue') || []
      const payoutTransactions = transactions?.filter(t => t.type === 'payout') || []
      
      const totalEarned = revenueTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      const totalPaid = payoutTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
      
      return {
        holder_id: holderId,
        holder_name: holder.name,
        period_start: startDate,
        period_end: endDate,
        earnings: revenueTransactions.map(t => ({
          transaction_id: t.id,
          date: t.created_at,
          description: t.description,
          release_title: t.releases?.title,
          track_title: t.tracks?.title,
          amount: t.amount || 0
        })),
        total_earned: totalEarned,
        total_paid: totalPaid,
        balance: totalEarned - totalPaid,
        status: (totalEarned - totalPaid) >= 2000 ? 'payable' : 'below_threshold'
      }
    }
  },

  /**
   * RELEASES MANAGEMENT
   * Handles music releases (albums, EPs, singles)
   */
  releases: {
    async getAll(): Promise<Release[]> {
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .order('release_date', { ascending: false })
      
      if (error) throw new Error(`Failed to fetch releases: ${error.message}`)
      
      return data.map(mapDatabaseReleaseToRelease)
    },

    async getById(id: string): Promise<Release | null> {
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(`Failed to fetch release: ${error.message}`)
      }
      
      return mapDatabaseReleaseToRelease(data)
    },

    async create(data: Omit<Release, 'id' | 'created_at' | 'updated_at'>): Promise<Release> {
      const { data: newRelease, error } = await supabase
        .from('releases')
        .insert({
          title: data.title,
          artist: data.artist,
          release_type: data.release_type,
          split_method: data.split_method || 'standard',
          primary_splits_total: data.primary_splits_total || 0,
          upc: data.upc,
          release_date: data.release_date,
        })
        .select()
        .single()
      
      if (error) throw new Error(`Failed to create release: ${error.message}`)
      
      return mapDatabaseReleaseToRelease(newRelease)
    },

    async update(id: string, data: Partial<Release>): Promise<Release> {
      const updateData: any = {}
      
      if (data.title !== undefined) updateData.title = data.title
      if (data.artist !== undefined) updateData.artist = data.artist
      if (data.release_type !== undefined) updateData.release_type = data.release_type
      if (data.split_method !== undefined) updateData.split_method = data.split_method
      if (data.primary_splits_total !== undefined) updateData.primary_splits_total = data.primary_splits_total
      if (data.upc !== undefined) updateData.upc = data.upc
      if (data.release_date !== undefined) updateData.release_date = data.release_date
      
      const { data: updatedRelease, error } = await supabase
        .from('releases')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(`Failed to update release: ${error.message}`)
      
      return mapDatabaseReleaseToRelease(updatedRelease)
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('releases')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(`Failed to delete release: ${error.message}`)
    }
  },

  /**
   * TRACKS MANAGEMENT
   * Individual tracks within releases
   */
  tracks: {
    async getAll(): Promise<Track[]> {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('release_id', { ascending: true })
        .order('track_number', { ascending: true })
      
      if (error) throw new Error(`Failed to fetch tracks: ${error.message}`)
      
      return data.map(mapDatabaseTrackToTrack)
    },

    async getById(id: string): Promise<Track | null> {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(`Failed to fetch track: ${error.message}`)
      }
      
      return mapDatabaseTrackToTrack(data)
    },

    async getByReleaseId(releaseId: string): Promise<Track[]> {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('release_id', releaseId)
        .order('track_number', { ascending: true })
      
      if (error) throw new Error(`Failed to fetch tracks for release: ${error.message}`)
      
      return data.map(mapDatabaseTrackToTrack)
    },

    async create(data: Omit<Track, 'id' | 'created_at' | 'updated_at'>): Promise<Track> {
      const { data: newTrack, error } = await supabase
        .from('tracks')
        .insert({
          release_id: data.release_id,
          title: data.title,
          track_number: data.track_number,
          isrc: data.isrc,
          use_release_splits: data.use_release_splits,
          split_method: data.split_method || 'standard',
        })
        .select()
        .single()
      
      if (error) throw new Error(`Failed to create track: ${error.message}`)
      
      return mapDatabaseTrackToTrack(newTrack)
    },

    async update(id: string, data: Partial<Track>): Promise<Track> {
      const updateData: any = {}
      
      if (data.title !== undefined) updateData.title = data.title
      if (data.track_number !== undefined) updateData.track_number = data.track_number
      if (data.isrc !== undefined) updateData.isrc = data.isrc
      if (data.use_release_splits !== undefined) updateData.use_release_splits = data.use_release_splits
      if (data.split_method !== undefined) updateData.split_method = data.split_method
      
      const { data: updatedTrack, error } = await supabase
        .from('tracks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(`Failed to update track: ${error.message}`)
      
      return mapDatabaseTrackToTrack(updatedTrack)
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(`Failed to delete track: ${error.message}`)
    }
  },

  /**
   * RELEASE SPLITS MANAGEMENT
   * How royalties are split at the release level
   */
  releaseSplits: {
    async getByReleaseId(releaseId: string): Promise<ReleaseSplit[]> {
      const { data, error } = await supabase
        .from('release_splits')
        .select('*')
        .eq('release_id', releaseId)
        .order('tier', { ascending: false }) // primary first, then secondary
        .order('split_order', { ascending: true })
      
      if (error) throw new Error(`Failed to fetch release splits: ${error.message}`)
      
      return data.map(mapDatabaseReleaseSplitToReleaseSplit)
    },

    async upsertSplits(
      releaseId: string, 
      splits: Array<{ 
        holder_id: string; 
        percentage: number;
        tier?: 'primary' | 'secondary';
        split_order?: number;
        description?: string;
      }>
    ): Promise<ReleaseSplit[]> {
      // First, delete all existing splits for this release
      const { error: deleteError } = await supabase
        .from('release_splits')
        .delete()
        .eq('release_id', releaseId)
      
      if (deleteError) throw new Error(`Failed to delete existing release splits: ${deleteError.message}`)
      
      // Then insert new splits
      const splitsToInsert = splits.map((split, index) => ({
        release_id: releaseId,
        holder_id: split.holder_id,
        percentage: split.percentage,
        tier: split.tier || 'secondary',
        split_order: split.split_order || (index + 1),
        description: split.description || null,
      }))
      
      const { data: newSplits, error: insertError } = await supabase
        .from('release_splits')
        .insert(splitsToInsert)
        .select()
      
      if (insertError) throw new Error(`Failed to create release splits: ${insertError.message}`)
      
      return newSplits.map(mapDatabaseReleaseSplitToReleaseSplit)
    },

    async deleteByReleaseId(releaseId: string): Promise<void> {
      const { error } = await supabase
        .from('release_splits')
        .delete()
        .eq('release_id', releaseId)
      
      if (error) throw new Error(`Failed to delete release splits: ${error.message}`)
    }
  },

  /**
   * TRACK SPLITS MANAGEMENT
   * Track-level split overrides
   */
  trackSplits: {
    async getByTrackId(trackId: string): Promise<TrackSplit[]> {
      const { data, error } = await supabase
        .from('track_splits')
        .select('*')
        .eq('track_id', trackId)
        .order('tier', { ascending: false }) // primary first, then secondary
        .order('split_order', { ascending: true })
      
      if (error) throw new Error(`Failed to fetch track splits: ${error.message}`)
      
      return data.map(mapDatabaseTrackSplitToTrackSplit)
    },

    async upsertSplits(
      trackId: string, 
      splits: Array<{ 
        holder_id: string; 
        percentage: number;
        tier?: 'primary' | 'secondary';
        split_order?: number;
        description?: string;
      }>
    ): Promise<TrackSplit[]> {
      // First, delete all existing splits for this track
      const { error: deleteError } = await supabase
        .from('track_splits')
        .delete()
        .eq('track_id', trackId)
      
      if (deleteError) throw new Error(`Failed to delete existing track splits: ${deleteError.message}`)
      
      // Then insert new splits
      const splitsToInsert = splits.map((split, index) => ({
        track_id: trackId,
        holder_id: split.holder_id,
        percentage: split.percentage,
        tier: split.tier || 'secondary',
        split_order: split.split_order || (index + 1),
        description: split.description || null,
      }))
      
      const { data: newSplits, error: insertError } = await supabase
        .from('track_splits')
        .insert(splitsToInsert)
        .select()
      
      if (insertError) throw new Error(`Failed to create track splits: ${insertError.message}`)
      
      return newSplits.map(mapDatabaseTrackSplitToTrackSplit)
    },

    async deleteByTrackId(trackId: string): Promise<void> {
      const { error } = await supabase
        .from('track_splits')
        .delete()
        .eq('track_id', trackId)
      
      if (error) throw new Error(`Failed to delete track splits: ${error.message}`)
    }
  },

  /**
   * TRANSACTIONS MANAGEMENT
   * Financial transactions (revenue, payouts, adjustments)
   */
  transactions: {
    async getAll(): Promise<Transaction[]> {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(`Failed to fetch transactions: ${error.message}`)
      
      return data.map(mapDatabaseTransactionToTransaction)
    },

    async getById(id: string): Promise<Transaction | null> {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(`Failed to fetch transaction: ${error.message}`)
      }
      
      return mapDatabaseTransactionToTransaction(data)
    },

    async getByHolderId(holderId: string): Promise<Transaction[]> {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('holder_id', holderId)
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(`Failed to fetch holder transactions: ${error.message}`)
      
      return data.map(mapDatabaseTransactionToTransaction)
    },

    async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(`Failed to fetch transactions: ${error.message}`)
      
      return data.map(mapDatabaseTransactionToTransaction)
    },

    async create(data: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
      const { data: newTransaction, error } = await supabase
        .from('transactions')
        .insert({
          type: data.type,
          amount: data.amount,
          currency: data.currency,
          description: data.description,
          release_id: data.release_id,
          track_id: data.track_id,
          holder_id: data.holder_id,
          reference: data.reference,
          created_by: data.created_by
        })
        .select()
        .single()
      
      if (error) throw new Error(`Failed to create transaction: ${error.message}`)
      
      return mapDatabaseTransactionToTransaction(newTransaction)
    },

    async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
      const updateData: any = {}
      
      if (data.type !== undefined) updateData.type = data.type
      if (data.amount !== undefined) updateData.amount = data.amount
      if (data.currency !== undefined) updateData.currency = data.currency
      if (data.description !== undefined) updateData.description = data.description
      if (data.release_id !== undefined) updateData.release_id = data.release_id
      if (data.track_id !== undefined) updateData.track_id = data.track_id
      if (data.holder_id !== undefined) updateData.holder_id = data.holder_id
      if (data.reference !== undefined) updateData.reference = data.reference
      if (data.created_by !== undefined) updateData.created_by = data.created_by
      
      const { data: updatedTransaction, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(`Failed to update transaction: ${error.message}`)
      
      return mapDatabaseTransactionToTransaction(updatedTransaction)
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(`Failed to delete transaction: ${error.message}`)
    }
  },

  /**
   * WORKSPACE SETTINGS MANAGEMENT
   */
  settings: {
    async get(): Promise<WorkspaceSettings> {
      const { data, error } = await supabase
        .from('workspace_settings')
        .select('*')
        .single()
      
      if (error) throw new Error(`Failed to fetch settings: ${error.message}`)
      
      return {
        id: data.id,
        base_currency: data.base_currency,
        min_payout_minor: data.min_payout_minor,
        updated_at: data.updated_at
      }
    },

    async update(data: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
      const updateData: any = {}
      
      if (data.base_currency !== undefined) updateData.base_currency = data.base_currency
      if (data.min_payout_minor !== undefined) updateData.min_payout_minor = data.min_payout_minor
      
      const { data: updatedSettings, error } = await supabase
        .from('workspace_settings')
        .update(updateData)
        .select()
        .single()
      
      if (error) throw new Error(`Failed to update settings: ${error.message}`)
      
      return {
        id: updatedSettings.id,
        base_currency: updatedSettings.base_currency,
        min_payout_minor: updatedSettings.min_payout_minor,
        updated_at: updatedSettings.updated_at
      }
    }
  }
}

/**
 * HELPER FUNCTIONS
 * Map between database schema and frontend types
 */

/**
 * Maps database holder row to frontend Holder type
 */
function mapDatabaseHolderToHolder(dbHolder: any): Holder {
  return {
    id: dbHolder.id,
    r_number: dbHolder.r_number,
    name: dbHolder.name,
    type: dbHolder.type,
    status: dbHolder.status,
    email: dbHolder.email,
    address: dbHolder.address,
    sort_code: dbHolder.sort_code,
    account_number: dbHolder.account_number,
    vat_registered: dbHolder.vat_registered,
    min_payout_override: dbHolder.min_payout_override,
    notes: dbHolder.notes,
    created_at: dbHolder.created_at,
    updated_at: dbHolder.updated_at
  }
}

/**
 * Maps database release row to frontend Release type
 */
function mapDatabaseReleaseToRelease(dbRelease: any): Release {
  return {
    id: dbRelease.id,
    catalog_number: dbRelease.catalog_number,
    title: dbRelease.title,
    artist: dbRelease.artist,
    release_type: dbRelease.release_type,
    split_method: dbRelease.split_method || 'standard',
    primary_splits_total: dbRelease.primary_splits_total || 0,
    upc: dbRelease.upc,
    release_date: dbRelease.release_date,
    created_at: dbRelease.created_at,
    updated_at: dbRelease.updated_at
  }
}

/**
 * Maps database track row to frontend Track type
 */
function mapDatabaseTrackToTrack(dbTrack: any): Track {
  return {
    id: dbTrack.id,
    release_id: dbTrack.release_id,
    title: dbTrack.title,
    track_number: dbTrack.track_number,
    isrc: dbTrack.isrc,
    use_release_splits: dbTrack.use_release_splits,
    split_method: dbTrack.split_method || 'standard',
    created_at: dbTrack.created_at,
    updated_at: dbTrack.updated_at
  }
}

/**
 * Maps database release split row to frontend ReleaseSplit type
 */
function mapDatabaseReleaseSplitToReleaseSplit(dbSplit: any): ReleaseSplit {
  return {
    id: dbSplit.id,
    release_id: dbSplit.release_id,
    holder_id: dbSplit.holder_id,
    percentage: dbSplit.percentage,
    tier: dbSplit.tier || 'secondary',
    split_order: dbSplit.split_order || 1,
    description: dbSplit.description,
    created_at: dbSplit.created_at
  }
}

/**
 * Maps database track split row to frontend TrackSplit type
 */
function mapDatabaseTrackSplitToTrackSplit(dbSplit: any): TrackSplit {
  return {
    id: dbSplit.id,
    track_id: dbSplit.track_id,
    holder_id: dbSplit.holder_id,
    percentage: dbSplit.percentage,
    tier: dbSplit.tier || 'secondary',
    split_order: dbSplit.split_order || 1,
    description: dbSplit.description,
    created_at: dbSplit.created_at
  }
}

/**
 * Maps database transaction row to frontend Transaction type
 */
function mapDatabaseTransactionToTransaction(dbTransaction: any): Transaction {
  return {
    id: dbTransaction.id,
    type: dbTransaction.type,
    amount: dbTransaction.amount,
    currency: dbTransaction.currency,
    description: dbTransaction.description,
    release_id: dbTransaction.release_id,
    track_id: dbTransaction.track_id,
    holder_id: dbTransaction.holder_id,
    reference: dbTransaction.reference,
    created_at: dbTransaction.created_at,
    created_by: dbTransaction.created_by
  }
}