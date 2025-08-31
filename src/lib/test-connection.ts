import { testConnection } from './supabase'
import { supabaseAdapter } from './supabase-adapter'

/**
 * DATABASE CONNECTION TEST UTILITY
 * 
 * This utility helps verify that the Supabase connection is working correctly.
 * Run this to test your database connection before switching from mock data.
 */

/**
 * Test basic database connectivity
 */
export async function testDatabaseConnection(): Promise<void> {
  console.log('🔄 Testing Supabase connection...')
  
  try {
    const isConnected = await testConnection()
    
    if (isConnected) {
      console.log('✅ Database connection successful!')
    } else {
      console.log('❌ Database connection failed')
      return
    }
    
    // Test basic operations
    console.log('🔄 Testing basic operations...')
    
    // Test fetching holders (should work even if table is empty)
    try {
      const holders = await supabaseAdapter.holders.getAll()
      console.log(`✅ Successfully fetched ${holders.length} holders`)
    } catch (error) {
      console.log('❌ Failed to fetch holders:', error)
    }
    
    // Test fetching releases
    try {
      const releases = await supabaseAdapter.releases.getAll()
      console.log(`✅ Successfully fetched ${releases.length} releases`)
    } catch (error) {
      console.log('❌ Failed to fetch releases:', error)
    }
    
    console.log('🎉 Database connection test completed!')
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error)
    throw error
  }
}

// Export for use in dev tools or scripts
if (import.meta.env.DEV) {
  // Make test function available globally in development
  ;(window as any).testDatabaseConnection = testDatabaseConnection
}