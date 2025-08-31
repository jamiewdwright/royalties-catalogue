/**
 * Core entity types for the Royalties Catalogue application
 * All monetary amounts are stored as integers in minor units (pence) for precision
 */

/**
 * Represents a royalty recipient (person or entity that receives payments)
 */
export interface Holder {
  id: string                                                  // Unique identifier
  r_number: string                                           // Human-readable ID (R001, R002, etc.)
  name: string                                               // Full name or company name
  type: 'performer' | 'composer' | 'arranger' | 'partner' | 'guest' | 'other'  // Type of holder
  status: 'active' | 'inactive'                              // Current status of the holder
  email?: string                                             // Contact email (optional)
  address?: string                                           // Physical address for payments (optional)
  sort_code?: string                                         // UK bank sort code in format xx-xx-xx (optional)
  account_number?: string                                    // UK bank account number (optional)
  vat_registered?: boolean                                   // Whether the holder is VAT registered (optional)
  min_payout_override?: number                               // Custom minimum payout in minor units, overrides workspace default (optional)
  notes?: string                                             // Additional notes about the holder (optional)
  created_at: string                                         // ISO timestamp when record was created
  updated_at: string                                         // ISO timestamp when record was last modified
}

/**
 * Represents a music release (album, EP, or single)
 */
export interface Release {
  id: string                                                 // Unique identifier
  catalog_number: string                                     // Human-readable catalog number (SWG001, SWG002, etc.)
  title: string                                              // Release title
  artist: string                                             // Main artist name
  release_type: 'single' | 'ep' | 'album'                  // Type of release
  split_method: 'standard' | 'primary_first'               // Split calculation method
  primary_splits_total?: number                            // Cached total percentage of primary splits
  upc?: string                                              // Universal Product Code for physical/digital distribution (optional)
  release_date?: string                                     // ISO date string (optional)
  created_at: string                                        // ISO timestamp when record was created
  updated_at: string                                        // ISO timestamp when record was last modified
}

/**
 * Represents an individual track within a release
 */
export interface Track {
  id: string                                    // Unique identifier
  release_id?: string                           // Foreign key linking to parent release (optional for standalone tracks)
  title: string                                 // Track title
  track_number: number                          // Position on the release (1, 2, 3, etc.)
  isrc?: string                                // International Standard Recording Code (optional)
  use_release_splits: boolean                   // If true: inherit splits from release; if false: use custom track splits
  split_method: 'standard' | 'primary_first'  // Split calculation method (when using custom splits)
  created_at: string                           // ISO timestamp when record was created
  updated_at: string                           // ISO timestamp when record was last modified
}

/**
 * Defines how royalties are split at the release level
 * For standard method: all splits must sum to 100%
 * For primary_first method: primary splits taken from gross, secondary splits must sum to 100% of remainder
 */
export interface ReleaseSplit {
  id: string                                    // Unique identifier
  release_id: string                            // Foreign key linking to release
  holder_id: string                             // Foreign key linking to royalty holder
  percentage: number                            // Percentage of revenue (0-100, can have decimals)
  tier: 'primary' | 'secondary'                // Split tier for calculation order
  split_order: number                           // Order within tier (1, 2, 3...)
  description?: string                          // Human-readable description (e.g., "Management Commission")
  created_at: string                           // ISO timestamp when split was created
}

/**
 * Defines custom royalty splits for individual tracks
 * Only used when track.use_release_splits = false
 * For standard method: all splits must sum to 100%
 * For primary_first method: primary splits taken from gross, secondary splits must sum to 100% of remainder
 */
export interface TrackSplit {
  id: string                                    // Unique identifier
  track_id: string                              // Foreign key linking to track
  holder_id: string                             // Foreign key linking to royalty holder
  percentage: number                            // Percentage of revenue (0-100, can have decimals)
  tier: 'primary' | 'secondary'                // Split tier for calculation order
  split_order: number                           // Order within tier (1, 2, 3...)
  description?: string                          // Human-readable description (e.g., "Management Commission")
  created_at: string                           // ISO timestamp when split was created
}

/**
 * Represents all financial transactions in the system
 * Forms the core of the accounting/ledger system
 */
export interface Transaction {
  id: string                                       // Unique identifier
  type: 'revenue' | 'payout' | 'adjustment'      // Type of transaction
  amount: number                                   // Amount in minor units (pence). Negative for payouts.
  currency: string                                 // Currency code (e.g., 'GBP', 'USD')
  description: string                              // Human-readable description
  release_id?: string                             // Optional: link to release (for revenue)
  track_id?: string                               // Optional: link to specific track (for revenue)
  holder_id?: string                              // Optional: link to holder (for payouts/adjustments)
  reference?: string                              // Optional: external reference (invoice number, platform reference, etc.)
  created_at: string                              // ISO timestamp when transaction occurred
  created_by?: string                             // Optional: who created this transaction (user ID, 'system', etc.)
}

/**
 * Global settings for the workspace/application
 */
export interface WorkspaceSettings {
  id: string                // Unique identifier
  base_currency: string     // Default currency code for the workspace (e.g., 'GBP')
  min_payout_minor: number  // Default minimum payout threshold in minor units (e.g., 2000 = £20)
  updated_at: string        // ISO timestamp when settings were last modified
}

/**
 * Computed balance information for a holder
 * Generated by calculating all revenue allocations minus payouts
 */
export interface HolderBalance {
  holder_id: string                               // Foreign key to holder
  owed: number                                    // Current amount owed in minor units (can be negative for advances)
  status: 'payable' | 'below_threshold'          // Whether holder is eligible for payout
  threshold: number                               // Minimum payout threshold for this holder (in minor units)
}

/**
 * Detailed financial statement for a holder over a specific time period
 * Used for generating reports and CSV exports
 */
export interface Statement {
  holder_id: string           // Foreign key to holder
  holder_name: string         // Holder's name (denormalized for convenience)
  period_start: string        // ISO date string for statement period start
  period_end: string          // ISO date string for statement period end
  earnings: StatementEarning[] // Detailed breakdown of earnings in this period
  total_earned: number        // Sum of all earnings in minor units
  total_paid: number          // Sum of all payouts in minor units
  balance: number             // Current balance (earned - paid) in minor units
  status: 'payable' | 'below_threshold' // Current payout eligibility
}

/**
 * Individual earning entry within a statement
 * Represents revenue allocated to a holder from a specific transaction
 */
export interface StatementEarning {
  transaction_id: string    // Foreign key to source transaction
  date: string             // ISO date string when earning occurred
  description: string      // Description from the source transaction
  release_title?: string   // Title of release (if applicable)
  track_title?: string     // Title of track (if applicable) 
  amount: number           // Amount allocated to holder in minor units
}

/**
 * Configuration type for data source selection
 * 'mock' = use JSON files and localStorage
 * 'supabase' = use Supabase database
 */
export type DataSource = 'mock' | 'supabase'

/**
 * Split calculation result showing how revenue is allocated
 */
export interface SplitAllocation {
  split: ReleaseSplit | TrackSplit              // The split configuration
  amount: number                                // Calculated amount in minor units
  base_amount: number                           // The amount this percentage was calculated from
  calculation_order: number                     // Order in which this split was calculated
}

/**
 * Complete split calculation result
 */
export interface SplitCalculationResult {
  allocations: SplitAllocation[]                // Individual allocations
  total_revenue: number                         // Original revenue amount
  primary_deductions: number                    // Total amount taken by primary splits
  secondary_pool: number                        // Amount available for secondary splits
  method: 'standard' | 'primary_first'        // Calculation method used
}

/**
 * Split template for common split configurations
 */
export interface SplitTemplate {
  id: string                                    // Unique identifier
  name: string                                  // Template name (e.g., "Standard Management Deal")
  description: string                           // Description of when to use this template
  split_method: 'standard' | 'primary_first'  // Calculation method
  template_splits: TemplateSplit[]             // Template split definitions
  created_at: string                           // ISO timestamp when created
}

/**
 * Template split definition
 */
export interface TemplateSplit {
  tier: 'primary' | 'secondary'                // Split tier
  split_order: number                           // Order within tier
  percentage: number                            // Percentage allocation
  description: string                           // Description (e.g., "Management Commission")
  holder_type?: string                         // Optional holder type hint
}