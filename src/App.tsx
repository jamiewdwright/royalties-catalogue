import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { Holders } from './pages/Holders'
import { HolderDetail } from './pages/HolderDetail'
import { Releases } from './pages/Releases'
import { ReleaseDetail } from './pages/ReleaseDetail'
import { Tracks } from './pages/Tracks'
import { Payouts } from './pages/Payouts'
import { ImportPayments } from './pages/ImportPayments'
import { Settings } from './pages/Settings'
import { Navigation } from './components/Navigation'

// Legacy redirect component for old holder detail URLs
function HolderDetailRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/royalty-holders/${id}`} replace />
}

/**
 * ROOT APPLICATION COMPONENT
 * 
 * This is the main entry point for the Royalties Catalogue application.
 * It sets up:
 * - React Router for client-side routing
 * - Main layout with responsive sidebar navigation
 * - All page routes and navigation
 * 
 * Layout Structure:
 * - Left sidebar navigation (fixed on desktop, overlay on mobile)
 * - Main content area with responsive padding
 * - Container with proper spacing and max-width handling
 */
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        {/* Left sidebar navigation component */}
        <Navigation />
        
        {/* Main content area with responsive layout */}
        <div className="lg:pl-80 pt-16 lg:pt-0">  {/* Padding for sidebar (desktop) and mobile header */}
          <main className="container mx-auto px-4 lg:px-6 py-6 max-w-none">
            <Routes>
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Main application routes */}
              <Route path="/dashboard" element={<Dashboard />} />                           {/* Release performance analytics */}
              <Route path="/royalty-holders" element={<Holders />} />                      {/* List all royalty holders */}
              <Route path="/royalty-holders/:id" element={<HolderDetail />} />             {/* Individual holder details and payouts */}
              <Route path="/releases" element={<Releases />} />                            {/* List all music releases */}
              <Route path="/releases/:id" element={<ReleaseDetail />} />                   {/* Individual release details and splits */}
              <Route path="/tracks" element={<Tracks />} />                                {/* All tracks across releases */}
              <Route path="/payouts" element={<Payouts />} />                              {/* Payout batch management */}
              <Route path="/import-payments" element={<ImportPayments />} />               {/* Revenue import system */}
              <Route path="/settings" element={<Settings />} />                           {/* Application settings and configuration */}
              
              {/* Legacy redirects for old URLs */}
              <Route path="/holders" element={<Navigate to="/royalty-holders" replace />} />
              <Route path="/holders/:id" element={<HolderDetailRedirect />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App