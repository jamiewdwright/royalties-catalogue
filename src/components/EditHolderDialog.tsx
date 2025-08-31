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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { dataService } from '@/lib/data-service'
import { formatCurrency } from '@/lib/constants'
import { Holder } from '@/types'

/**
 * EDIT HOLDER DIALOG COMPONENT
 * 
 * This dialog allows editing an existing royalty holder's details.
 * Features:
 * - Form validation with Zod schema
 * - Pre-populated with current holder data
 * - Handles UK banking details (sort code + account number)
 * - VAT registration checkbox
 * - Custom minimum payout override
 * - Address field for payment details
 */

// Form validation schema - same as AddHolderDialog
const editHolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  address: z.string().max(500, 'Address must be 500 characters or less').optional(),
  sort_code: z.string().regex(/^\d{2}-\d{2}-\d{2}$/, 'Sort code must be in format xx-xx-xx').optional().or(z.literal('')),
  account_number: z.string().regex(/^\d{8}$/, 'Account number must be 8 digits').optional().or(z.literal('')),
  vat_registered: z.boolean().optional(),
  min_payout_override: z.string().optional(),
})

type EditHolderFormData = z.infer<typeof editHolderSchema>

interface EditHolderDialogProps {
  holder: Holder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onHolderUpdated: () => void
}

export function EditHolderDialog({ holder, open, onOpenChange, onHolderUpdated }: EditHolderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<EditHolderFormData>({
    resolver: zodResolver(editHolderSchema),
  })

  const watchVatRegistered = watch('vat_registered')

  // Pre-populate form when holder changes
  useEffect(() => {
    if (holder && open) {
      setValue('name', holder.name)
      setValue('email', holder.email || '')
      setValue('address', holder.address || '')
      setValue('sort_code', holder.sort_code || '')
      setValue('account_number', holder.account_number || '')
      setValue('vat_registered', holder.vat_registered || false)
      setValue('min_payout_override', holder.min_payout_override ? (holder.min_payout_override / 100).toFixed(2) : '')
    }
  }, [holder, open, setValue])

  const onSubmit = async (data: EditHolderFormData) => {
    if (!holder) return
    
    setIsSubmitting(true)
    try {
      // Convert payout override back to minor units (pence)
      const min_payout_override = data.min_payout_override 
        ? Math.round(parseFloat(data.min_payout_override) * 100)
        : undefined

      // Update the holder
      const updatedHolder = await dataService.holders.update(holder.id, {
        name: data.name,
        email: data.email || undefined,
        address: data.address || undefined,
        sort_code: data.sort_code || undefined,
        account_number: data.account_number || undefined,
        vat_registered: data.vat_registered,
        min_payout_override,
      })

      // Show success message
      toast.success(`${updatedHolder.name} has been updated successfully!`)

      // Reset form and close dialog
      reset()
      onOpenChange(false)
      onHolderUpdated()
    } catch (error) {
      console.error('Error updating holder:', error)
      
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast.error(`Failed to update holder: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        reset()
      }
    }
  }

  if (!holder) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Royalty Holder</DialogTitle>
          <DialogDescription>
            Update {holder.name}'s details and payment information.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* R Number Field - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="r_number">Reference Number</Label>
            <Input
              id="r_number"
              value={holder.r_number}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              This reference number is automatically assigned and cannot be changed
            </p>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Full name or company name"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="contact@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Address Field */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Full postal address for payments"
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          {/* Banking Details */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Banking Details</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_code">Sort Code</Label>
                <Input
                  id="sort_code"
                  {...register('sort_code')}
                  placeholder="12-34-56"
                  maxLength={8}
                />
                {errors.sort_code && (
                  <p className="text-sm text-red-600">{errors.sort_code.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  {...register('account_number')}
                  placeholder="12345678"
                  maxLength={8}
                />
                {errors.account_number && (
                  <p className="text-sm text-red-600">{errors.account_number.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* VAT Registration */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="vat_registered"
              checked={watchVatRegistered}
              onCheckedChange={(checked) => setValue('vat_registered', checked as boolean)}
            />
            <Label htmlFor="vat_registered" className="text-sm font-normal">
              VAT Registered
            </Label>
          </div>

          {/* Minimum Payout Override */}
          <div className="space-y-2">
            <Label htmlFor="min_payout_override">
              Custom Minimum Payout (£)
            </Label>
            <Input
              id="min_payout_override"
              type="number"
              step="0.01"
              min="0"
              {...register('min_payout_override')}
              placeholder="20.00"
            />
            <p className="text-xs text-muted-foreground">
              Override the workspace default minimum payout threshold for this holder.
              Leave blank to use the workspace default ({formatCurrency(2000)}).
            </p>
            {errors.min_payout_override && (
              <p className="text-sm text-red-600">{errors.min_payout_override.message}</p>
            )}
          </div>

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
              {isSubmitting ? 'Updating...' : 'Update Holder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}