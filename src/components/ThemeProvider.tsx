import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { themes, getTheme, DEFAULT_THEME, Theme } from '@/lib/themes'
import { fonts, getFont, DEFAULT_FONT, FontOption, loadFont, applyFont } from '@/lib/fonts'

interface ThemeContextType {
  theme: string
  setTheme: (theme: string) => void
  themes: Theme[]
  currentTheme: Theme
  font: string
  setFont: (font: string) => void
  fonts: FontOption[]
  currentFont: FontOption
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<string>(() => {
    // Get theme from localStorage or use default
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || DEFAULT_THEME
    }
    return DEFAULT_THEME
  })

  const [font, setFontState] = useState<string>(() => {
    // Get font from localStorage or use default
    if (typeof window !== 'undefined') {
      return localStorage.getItem('font') || DEFAULT_FONT
    }
    return DEFAULT_FONT
  })

  const currentTheme = getTheme(theme) || getTheme(DEFAULT_THEME)!
  const currentFont = getFont(font) || getFont(DEFAULT_FONT)!

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
  }

  const setFont = (newFont: string) => {
    setFontState(newFont)
    if (typeof window !== 'undefined') {
      localStorage.setItem('font', newFont)
    }
  }

  useEffect(() => {
    const root = window.document.documentElement

    // Apply theme colors to CSS custom properties
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })

    // Handle dark class for backward compatibility
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme, currentTheme])

  useEffect(() => {
    // Load and apply font
    loadFont(currentFont)
    applyFont(currentFont)
  }, [font, currentFont])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themes,
        currentTheme,
        font,
        setFont,
        fonts,
        currentFont,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}