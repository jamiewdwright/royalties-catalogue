import { createClient } from '@supabase/supabase-js'

/**
 * SUPABASE CLIENT CONFIGURATION
 * 
 * This module creates and configures the Supabase client for database access.
 * It uses environment variables to connect to your Supabase project.
 * 
 * Environment Variables Required:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous/public key
 * 
 * The client is configured to:
 * - Connect to the 'app' schema (where all tables live)
 * - Use RLS (Row Level Security) policies
 * - Handle authentication if needed in the future
 */

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

/**
 * Supabase client instance configured for the royalties database
 * All database operations should use this client
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'app' // Use the app schema where your tables live
  },
  auth: {
    persistSession: true, // Keep user logged in across browser sessions
    autoRefreshToken: true, // Automatically refresh auth tokens
  }
})

/**
 * Helper function to check database connection
 * @returns Promise that resolves if connection is successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    // Test connection with a simple query that should work on any Supabase instance
    const { error } = await supabase
      .from('royalty_holders')  // This table might not exist yet
      .select('count')
      .limit(1)
    
    // If the table doesn't exist, that's still a successful connection
    if (error?.message?.includes('does not exist')) {
      return true  // Connected but schema not set up
    }
    
    return !error
  } catch {
    return false
  }
}