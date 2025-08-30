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
 * DATA ADAPTER INTERFACE
 * 
 * This interface defines the contract for all data access in the application.
 * It uses the Adapter pattern to allow switching between different data sources
 * (mock JSON files, Supabase, etc.) without changing the application code.
 * 
 * Key benefits:
 * - Easy testing with mock data
 * - Can switch from mock to production database seamlessly
 * - Consistent API regardless of underlying storage
 * - All data access is centralized and typed
 */
export interface DataAdapter {
  /**
   * Royalty holders management
   * Holders are the people/entities who receive royalty payments
   */
  holders: {
    getAll(): Promise<Holder[]>                                                                    // Get all holders
    getById(id: string): Promise<Holder | null>                                                   // Get specific holder
    create(data: Omit<Holder, 'id' | 'created_at' | 'updated_at'>): Promise<Holder>             // Create new holder (ID and timestamps auto-generated)
    update(id: string, data: Partial<Holder>): Promise<Holder>                                   // Update existing holder
    delete(id: string): Promise<void>                                                            // Delete holder
    getBalances(): Promise<HolderBalance[]>                                                      // Get computed balances for all holders
    getStatement(holderId: string, startDate: string, endDate: string): Promise<Statement>      // Generate statement for time period
  }
  
  /**
   * Music releases management (albums, EPs, singles)
   */
  releases: {
    getAll(): Promise<Release[]>                                                                  // Get all releases
    getById(id: string): Promise<Release | null>                                                 // Get specific release
    create(data: Omit<Release, 'id' | 'created_at' | 'updated_at'>): Promise<Release>           // Create new release
    update(id: string, data: Partial<Release>): Promise<Release>                                // Update existing release
    delete(id: string): Promise<void>                                                           // Delete release
  }
  
  /**
   * Individual tracks management
   */
  tracks: {
    getAll(): Promise<Track[]>                                                                   // Get all tracks
    getById(id: string): Promise<Track | null>                                                  // Get specific track
    getByReleaseId(releaseId: string): Promise<Track[]>                                         // Get all tracks for a release
    create(data: Omit<Track, 'id' | 'created_at' | 'updated_at'>): Promise<Track>              // Create new track
    update(id: string, data: Partial<Track>): Promise<Track>                                   // Update existing track
    delete(id: string): Promise<void>                                                          // Delete track
  }
  
  /**
   * Release-level royalty splits management
   */
  releaseSplits: {
    getByReleaseId(releaseId: string): Promise<ReleaseSplit[]>                                                                          // Get splits for a release
    upsertSplits(releaseId: string, splits: Array<{ holder_id: string; percentage: number }>): Promise<ReleaseSplit[]>               // Replace all splits for a release
    deleteByReleaseId(releaseId: string): Promise<void>                                                                              // Delete all splits for a release
  }
  
  /**
   * Track-level royalty splits management (for overrides)
   */
  trackSplits: {
    getByTrackId(trackId: string): Promise<TrackSplit[]>                                                                            // Get splits for a track
    upsertSplits(trackId: string, splits: Array<{ holder_id: string; percentage: number }>): Promise<TrackSplit[]>                // Replace all splits for a track
    deleteByTrackId(trackId: string): Promise<void>                                                                                // Delete all splits for a track
  }
  
  /**
   * Financial transactions management
   */
  transactions: {
    getAll(): Promise<Transaction[]>                                                            // Get all transactions
    getById(id: string): Promise<Transaction | null>                                           // Get specific transaction
    getByHolderId(holderId: string): Promise<Transaction[]>                                    // Get transactions for a holder (payouts/adjustments)
    getByDateRange(startDate: string, endDate: string): Promise<Transaction[]>                // Get transactions in date range (for analytics)
    create(data: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction>                // Create new transaction
    update(id: string, data: Partial<Transaction>): Promise<Transaction>                      // Update existing transaction
    delete(id: string): Promise<void>                                                         // Delete transaction
  }
  
  /**
   * Workspace configuration management
   */
  settings: {
    get(): Promise<WorkspaceSettings>                                                         // Get current workspace settings
    update(data: Partial<WorkspaceSettings>): Promise<WorkspaceSettings>                     // Update workspace settings
  }
}