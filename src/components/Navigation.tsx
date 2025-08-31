import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BarChart3, Users, Music, Home, Menu, X, Settings, Disc3, CreditCard, Upload } from 'lucide-react'

/**
 * Main navigation component that provides left sidebar navigation for the app
 * Features:
 * - Desktop: Fixed left sidebar (always visible)
 * - Mobile: Collapsible hamburger menu with slide-out sidebar
 * - Active state highlighting for current page
 * - Responsive design with proper breakpoints
 */
export function Navigation() {
  // Get current route to highlight active navigation item
  const location = useLocation()
  
  // State to control mobile sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Navigation items configuration - easily extendable for new pages
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, isSubItem: false },
    { name: 'Royalty Holders', href: '/royalty-holders', icon: Users, isSubItem: false },
    { name: 'Releases', href: '/releases', icon: Music, isSubItem: false },
    { name: 'Tracks', href: '/tracks', icon: Disc3, isSubItem: true },
    { name: 'Payouts', href: '/payouts', icon: CreditCard, isSubItem: false },
    { name: 'Import Payments', href: '/import-payments', icon: Upload, isSubItem: false },
  ]

  /**
   * Reusable sidebar content component used for both desktop and mobile
   * This avoids code duplication between the two layouts
   */
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* App logo and branding section */}
      <div className="flex items-center px-6 py-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
          <BarChart3 className="h-10 w-10 text-primary mr-4" />
          <h1 className="text-2xl font-bold text-foreground">Royalties Catalogue</h1>
        </Link>
      </div>

      {/* Main navigation links */}
      <div className="flex-1 px-4 py-6">
        <nav className="space-y-1">
          {navigation.map((item) => {
            // Get the icon component for this navigation item
            const Icon = item.icon
            // Check if this is the currently active page
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.name}
                to={item.href}
                // Close mobile sidebar when navigation item is clicked
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  // Base styles for all navigation links
                  'group flex items-center py-3 text-base font-medium rounded-md transition-colors',
                  // Conditional padding and indentation based on sub-item status
                  item.isSubItem
                    ? 'px-4 ml-8' // Sub-items: indented with margin-left
                    : 'px-4', // Main items: normal padding
                  // Conditional styles based on active state
                  isActive
                    ? 'bg-primary text-primary-foreground' // Active: blue background
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent' // Inactive: hover effects
                )}
              >
                <Icon
                  className={cn(
                    'mr-4 flex-shrink-0',
                    // Icon size based on sub-item status
                    item.isSubItem
                      ? 'h-5 w-5' // Sub-items: smaller icons
                      : 'h-6 w-6', // Main items: regular size icons
                    // Icon color changes based on active state
                    isActive
                      ? 'text-primary-foreground' // Active: white icon
                      : 'text-muted-foreground group-hover:text-foreground' // Inactive: muted with hover
                  )}
                />
                <span className={cn(
                  // Text size based on sub-item status
                  item.isSubItem
                    ? 'text-sm' // Sub-items: smaller text
                    : 'text-base' // Main items: regular text
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Settings section */}
      <div className="px-4 py-4 border-t border-border">
        <Link
          to="/settings"
          onClick={() => setSidebarOpen(false)}
          className={cn(
            // Base styles for settings link
            'group flex items-center px-4 py-3 text-base font-medium rounded-md transition-colors',
            // Conditional styles based on active state
            location.pathname === '/settings'
              ? 'bg-primary text-primary-foreground' // Active: blue background
              : 'text-muted-foreground hover:text-foreground hover:bg-accent' // Inactive: hover effects
          )}
        >
          <Settings
            className={cn(
              'mr-4 h-6 w-6 flex-shrink-0',
              // Icon color changes based on active state
              location.pathname === '/settings'
                ? 'text-primary-foreground' // Active: white icon
                : 'text-muted-foreground group-hover:text-foreground' // Inactive: muted with hover
            )}
          />
          Settings
        </Link>
      </div>

      {/* Footer section with app info */}
      <div className="px-4 py-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p>Royalties Catalogue</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar - only visible on screens smaller than lg (< 1024px) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          {/* App branding for mobile */}
          <Link to="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
            <BarChart3 className="h-7 w-7 text-primary mr-3" />
            <h1 className="text-xl font-bold text-foreground">Royalties Catalogue</h1>
          </Link>
          {/* Hamburger menu toggle button */}
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {/* Show X when sidebar is open, hamburger menu when closed */}
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Desktop sidebar - always visible on large screens (>= 1024px) */}
      <nav className="hidden lg:block fixed inset-y-0 left-0 z-50 w-80 bg-background border-r border-border">
        <SidebarContent />
      </nav>

      {/* Mobile sidebar - only shown when sidebarOpen is true on small screens */}
      {sidebarOpen && (
        <>
          {/* Dark overlay behind sidebar to dim the main content */}
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)} // Close sidebar when overlay is clicked
          />
          
          {/* Actual mobile sidebar */}
          <nav className="lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-background border-r border-border">
            <SidebarContent />
          </nav>
        </>
      )}
    </>
  )
}