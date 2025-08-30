import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { Holders } from './pages/Holders'
import { HolderDetail } from './pages/HolderDetail'
import { Releases } from './pages/Releases'
import { ReleaseDetail } from './pages/ReleaseDetail'
import { Navigation } from './components/Navigation'

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
        <div className="lg:pl-64 pt-16 lg:pt-0">  {/* Padding for sidebar (desktop) and mobile header */}
          <main className="container mx-auto px-4 lg:px-6 py-6 max-w-none">
            <Routes>
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Main application routes */}
              <Route path="/dashboard" element={<Dashboard />} />                    {/* Release performance analytics */}
              <Route path="/holders" element={<Holders />} />                       {/* List all royalty holders */}
              <Route path="/holders/:id" element={<HolderDetail />} />              {/* Individual holder details and payouts */}
              <Route path="/releases" element={<Releases />} />                     {/* List all music releases */}
              <Route path="/releases/:id" element={<ReleaseDetail />} />            {/* Individual release details and splits */}
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App