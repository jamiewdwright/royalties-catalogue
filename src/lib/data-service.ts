import { DataAdapter } from './data-adapter'
import { mockAdapter } from './mock-adapter'

/**
 * DATA SERVICE FACTORY
 * 
 * This module creates and exports the data adapter based on environment configuration.
 * It implements the Factory pattern to provide a single point of configuration
 * for switching between different data sources.
 * 
 * Environment Variables:
 * - VITE_DATA_SOURCE=mock (default) -> Use JSON files and localStorage
 * - VITE_DATA_SOURCE=supabase -> Use Supabase database (future implementation)
 * 
 * Usage throughout the app:
 * import { dataService } from '@/lib/data-service'
 * const holders = await dataService.holders.getAll()
 */

/**
 * Determines which data source to use based on environment variable
 * @returns The configured data source type
 */
function getDataSource(): 'mock' | 'supabase' {
  const source = import.meta.env.VITE_DATA_SOURCE
  return source === 'supabase' ? 'supabase' : 'mock'
}

/**
 * Factory function that creates the appropriate data adapter
 * @returns Configured data adapter instance
 */
export function createDataAdapter(): DataAdapter {
  const source = getDataSource()
  
  switch (source) {
    case 'supabase':
      // Future: import and return Supabase adapter
      throw new Error('Supabase adapter not yet implemented')
    case 'mock':
    default:
      return mockAdapter
  }
}

// Export the configured data service instance for use throughout the app
export const dataService = createDataAdapter()