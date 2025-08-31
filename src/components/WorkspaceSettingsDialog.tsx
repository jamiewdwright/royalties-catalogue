import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { dataService } from '@/lib/data-service'
import { formatCurrency } from '@/lib/constants'
import { WorkspaceSettings } from '@/types'

/**
 * WORKSPACE SETTINGS DIALOG COMPONENT
 * 
 * This dialog allows editing global workspace configuration settings.
 * Features:
 * - Base currency selection (GBP, USD, EUR)
 * - Minimum payout threshold configuration
 * - Form validation with Zod schema
 * - Real-time currency formatting preview
 * - Success/error handling with toast notifications
 */

// Form validation schema
const workspaceSettingsSchema = z.object({
  base_currency: z.enum(['GBP', 'USD', 'EUR'], {
    required_error: 'Please select a base currency',
  }),
  min_payout_amount: z.string()
    .min(1, 'Minimum payout amount is required')
    .refine(
      (val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0.01 && num <= 10000
      },
      'Amount must be between 0.01 and 10,000'
    ),
})

type WorkspaceSettingsFormData = z.infer<typeof workspaceSettingsSchema>

interface WorkspaceSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSettingsUpdated?: () => void
}

export function WorkspaceSettingsDialog({ open, onOpenChange, onSettingsUpdated }: WorkspaceSettingsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentSettings, setCurrentSettings] = useState<WorkspaceSettings | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<WorkspaceSettingsFormData>({
    resolver: zodResolver(workspaceSettingsSchema),
    defaultValues: {
      base_currency: 'GBP',
      min_payout_amount: '20.00',
    },
  })

  const watchBaseCurrency = watch('base_currency')
  const watchMinPayoutAmount = watch('min_payout_amount')

  // Load current settings when dialog opens
  useEffect(() => {
    if (open) {
      loadCurrentSettings()
    }
  }, [open])

  const loadCurrentSettings = async () => {
    try {
      const settings = await dataService.settings.get()
      setCurrentSettings(settings)
      
      // Pre-populate form
      setValue('base_currency', settings.base_currency as 'GBP' | 'USD' | 'EUR')
      setValue('min_payout_amount', (settings.min_payout_minor / 100).toFixed(2))
    } catch (error) {
      console.error('Error loading workspace settings:', error)
      toast.error('Failed to load current settings')
    }
  }

  const onSubmit = async (data: WorkspaceSettingsFormData) => {
    setIsSubmitting(true)
    try {
      // Convert amount back to minor units
      const min_payout_minor = Math.round(parseFloat(data.min_payout_amount) * 100)

      // Update the settings
      await dataService.settings.update({
        base_currency: data.base_currency,
        min_payout_minor,
      })

      // Show success message
      toast.success('Workspace settings updated successfully!')

      // Reset form and close dialog
      reset()
      onOpenChange(false)
      onSettingsUpdated?.()
    } catch (error) {
      console.error('Error updating workspace settings:', error)
      
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast.error(`Failed to update settings: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        reset()
        setCurrentSettings(null)
      }
    }
  }

  // Helper to format currency symbol
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'GBP': '£',
      'USD': '$',
      'EUR': '€',
    }
    return symbols[currency] || currency
  }

  // Preview formatted amount
  const previewAmount = () => {
    if (!watchMinPayoutAmount || !watchBaseCurrency) return ''
    try {
      const amount = parseFloat(watchMinPayoutAmount)
      if (isNaN(amount)) return ''
      const symbol = getCurrencySymbol(watchBaseCurrency)
      return `${symbol}${amount.toFixed(2)}`
    } catch {
      return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Workspace Settings</DialogTitle>
          <DialogDescription>
            Configure global settings for your royalties workspace.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Base Currency Field */}
          <div className="space-y-2">
            <Label htmlFor="base_currency">Base Currency *</Label>
            <Select 
              value={watchBaseCurrency} 
              onValueChange={(value) => setValue('base_currency', value as 'GBP' | 'USD' | 'EUR')}
            >
              <SelectTrigger id="base_currency">
                <SelectValue placeholder="Select base currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GBP">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg">£</span>
                    <span>British Pound (GBP)</span>
                  </div>
                </SelectItem>
                <SelectItem value="USD">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg">$</span>
                    <span>US Dollar (USD)</span>
                  </div>
                </SelectItem>
                <SelectItem value="EUR">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg">€</span>
                    <span>Euro (EUR)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The default currency for all transactions and payouts in this workspace.
            </p>
            {errors.base_currency && (
              <p className="text-sm text-red-600">{errors.base_currency.message}</p>
            )}
          </div>

          {/* Minimum Payout Threshold Field */}
          <div className="space-y-2">
            <Label htmlFor="min_payout_amount">
              Minimum Payout Threshold ({getCurrencySymbol(watchBaseCurrency || 'GBP')}) *
            </Label>
            <Input
              id="min_payout_amount"
              type="number"
              step="0.01"
              min="0.01"
              max="10000"
              {...register('min_payout_amount')}
              placeholder="20.00"
            />
            {previewAmount() && (
              <p className="text-sm text-muted-foreground font-mono">
                Preview: {previewAmount()}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Holders must have at least this amount owed before they become eligible for payout. 
              Individual holders can override this with their own custom threshold.
            </p>
            {errors.min_payout_amount && (
              <p className="text-sm text-red-600">{errors.min_payout_amount.message}</p>
            )}
          </div>

          {/* Current Settings Summary */}
          {currentSettings && (
            <div className="p-4 bg-muted rounded-md">
              <h4 className="text-sm font-medium mb-2">Current Settings</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Base Currency: {currentSettings.base_currency}</div>
                <div>Min Payout: {formatCurrency(currentSettings.min_payout_minor)}</div>
                <div>Last Updated: {new Date(currentSettings.updated_at).toLocaleDateString()}</div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Settings'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}