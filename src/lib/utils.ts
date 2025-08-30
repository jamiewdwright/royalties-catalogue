import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * UTILITY FUNCTIONS
 */

/**
 * Combines and merges Tailwind CSS class names intelligently
 * 
 * This utility function is essential for shadcn/ui components and conditional styling.
 * It combines clsx for conditional classes with tailwind-merge for proper Tailwind conflicts.
 * 
 * Example:
 * cn("px-2 py-1", condition && "bg-red-500", "px-4") 
 * => "py-1 bg-red-500 px-4" (px-4 overrides px-2)
 * 
 * @param inputs Array of class values (strings, conditionals, objects, arrays)
 * @returns Merged class name string with Tailwind conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}