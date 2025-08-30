/**
 * Font Configuration
 * 
 * This file contains all available font configurations for the application.
 * Fonts are loaded from Google Fonts and applied via CSS custom properties.
 */

export interface FontOption {
  name: string
  displayName: string
  description: string
  fontFamily: string
  googleFontUrl: string
  weights: number[]
}

export const fonts: FontOption[] = [
  {
    name: 'inter',
    displayName: 'Inter',
    description: 'Modern and clean sans-serif font',
    fontFamily: 'Inter, sans-serif',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: 'roboto',
    displayName: 'Roboto',
    description: 'Google\'s signature font family',
    fontFamily: 'Roboto, sans-serif',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
    weights: [300, 400, 500, 700],
  },
  {
    name: 'open-sans',
    displayName: 'Open Sans',
    description: 'Friendly and readable humanist font',
    fontFamily: '"Open Sans", sans-serif',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap',
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: 'poppins',
    displayName: 'Poppins',
    description: 'Geometric sans-serif with rounded edges',
    fontFamily: 'Poppins, sans-serif',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: 'source-sans',
    displayName: 'Source Sans Pro',
    description: 'Adobe\'s professional sans-serif font',
    fontFamily: '"Source Sans Pro", sans-serif',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap',
    weights: [300, 400, 600, 700],
  },
  {
    name: 'lato',
    displayName: 'Lato',
    description: 'Elegant and approachable humanist font',
    fontFamily: 'Lato, sans-serif',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
    weights: [300, 400, 700],
  },
  {
    name: 'nunito',
    displayName: 'Nunito',
    description: 'Rounded and friendly sans-serif font',
    fontFamily: 'Nunito, sans-serif',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap',
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: 'work-sans',
    displayName: 'Work Sans',
    description: 'Optimized for on-screen text display',
    fontFamily: '"Work Sans", sans-serif',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap',
    weights: [300, 400, 500, 600, 700],
  },
]

/**
 * Get font by name
 */
export function getFont(name: string): FontOption | undefined {
  return fonts.find(font => font.name === name)
}

/**
 * Default font name
 */
export const DEFAULT_FONT = 'inter'

/**
 * Load a Google Font dynamically
 */
export function loadFont(font: FontOption): void {
  // Check if font is already loaded
  const existingLink = document.querySelector(`link[href="${font.googleFontUrl}"]`)
  if (existingLink) {
    return
  }

  // Create and append font link
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = font.googleFontUrl
  document.head.appendChild(link)
}

/**
 * Apply font to document root
 */
export function applyFont(font: FontOption): void {
  const root = document.documentElement
  root.style.setProperty('--font-family', font.fontFamily)
}