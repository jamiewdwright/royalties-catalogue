/**
 * Theme Configuration
 * 
 * This file contains all available theme configurations for the application.
 * Each theme defines CSS custom properties for colors that are used throughout
 * the application via Tailwind CSS classes.
 */

export interface Theme {
  name: string
  displayName: string
  description: string
  colors: {
    background: string
    foreground: string
    card: string
    'card-foreground': string
    popover: string
    'popover-foreground': string
    primary: string
    'primary-foreground': string
    secondary: string
    'secondary-foreground': string
    muted: string
    'muted-foreground': string
    accent: string
    'accent-foreground': string
    destructive: string
    'destructive-foreground': string
    border: string
    input: string
    ring: string
  }
}

export const themes: Theme[] = [
  {
    name: 'light',
    displayName: 'Light',
    description: 'Clean and bright theme for daytime use',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      'card-foreground': '222.2 84% 4.9%',
      popover: '0 0% 100%',
      'popover-foreground': '222.2 84% 4.9%',
      primary: '221.2 83.2% 53.3%',
      'primary-foreground': '210 40% 98%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '221.2 83.2% 53.3%',
    },
  },
  {
    name: 'dark',
    displayName: 'Dark',
    description: 'Easy on the eyes for low-light environments',
    colors: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '217.2 91.2% 59.8%',
      'primary-foreground': '222.2 84% 4.9%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '217.2 91.2% 59.8%',
    },
  },
  {
    name: 'slate',
    displayName: 'Slate',
    description: 'Professional slate gray theme',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      'card-foreground': '222.2 84% 4.9%',
      popover: '0 0% 100%',
      'popover-foreground': '222.2 84% 4.9%',
      primary: '215.4 16.3% 46.9%',
      'primary-foreground': '210 20% 98%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '215.4 16.3% 46.9%',
    },
  },
  {
    name: 'green',
    displayName: 'Green',
    description: 'Nature-inspired green theme',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      'card-foreground': '222.2 84% 4.9%',
      popover: '0 0% 100%',
      'popover-foreground': '222.2 84% 4.9%',
      primary: '142.1 76.2% 36.3%',
      'primary-foreground': '355.7 100% 97.3%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '142.1 76.2% 36.3%',
    },
  },
  {
    name: 'purple',
    displayName: 'Purple',
    description: 'Creative purple theme for a vibrant look',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      'card-foreground': '222.2 84% 4.9%',
      popover: '0 0% 100%',
      'popover-foreground': '222.2 84% 4.9%',
      primary: '262.1 83.3% 57.8%',
      'primary-foreground': '210 20% 98%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '262.1 83.3% 57.8%',
    },
  },
  {
    name: 'orange',
    displayName: 'Orange',
    description: 'Warm and energetic orange theme',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      'card-foreground': '222.2 84% 4.9%',
      popover: '0 0% 100%',
      'popover-foreground': '222.2 84% 4.9%',
      primary: '20.5 90.2% 48.2%',
      'primary-foreground': '60 9.1% 97.8%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '20.5 90.2% 48.2%',
    },
  },
]

/**
 * Get theme by name
 */
export function getTheme(name: string): Theme | undefined {
  return themes.find(theme => theme.name === name)
}

/**
 * Default theme name
 */
export const DEFAULT_THEME = 'light'