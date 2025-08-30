import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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

// Form validation schema
const addHolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  address: z.string().max(500, 'Address must be 500 characters or less').optional(),
  sort_code: z.string().regex(/^\d{2}-\d{2}-\d{2}$/, 'Sort code must be in format xx-xx-xx').optional().or(z.literal('')),
  account_number: z.string().regex(/^\d{8}$/, 'Account number must be 8 digits').optional().or(z.literal('')),
  vat_registered: z.boolean().optional(),
  min_payout_override: z.string().optional(),
})

type AddHolderFormData = z.infer<typeof addHolderSchema>

interface AddHolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onHolderAdded: () => void
}

export function AddHolderDialog({ open, onOpenChange, onHolderAdded }: AddHolderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AddHolderFormData>({
    resolver: zodResolver(addHolderSchema),
    defaultValues: {
      name: '',
      email: '',
      address: '',
      sort_code: '',
      account_number: '',
      vat_registered: false,
      min_payout_override: '',
    },
  })

  const minPayoutValue = watch('min_payout_override')
  const vatRegistered = watch('vat_registered')

  // Helper function to format sort code input
  const formatSortCode = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    // Add hyphens after every 2 digits, max 6 digits
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`
  }

  const onSubmit = async (data: AddHolderFormData) => {
    setIsSubmitting(true)
    
    try {
      // Convert min payout override from pounds to pence if provided
      const minPayoutOverride = data.min_payout_override && data.min_payout_override.trim()
        ? Math.round(parseFloat(data.min_payout_override) * 100)
        : undefined

      await dataService.holders.create({
        name: data.name.trim(),
        email: data.email?.trim() || undefined,
        address: data.address?.trim() || undefined,
        sort_code: data.sort_code?.trim() || undefined,
        account_number: data.account_number?.trim() || undefined,
        vat_registered: data.vat_registered || false,
        min_payout_override: minPayoutOverride,
      })

      // Reset form and close dialog
      reset()
      onOpenChange(false)
      onHolderAdded()
    } catch (error) {
      console.error('Error creating holder:', error)
      // TODO: Add toast notification for error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Royalty Holder</DialogTitle>
          <DialogDescription>
            Create a new royalty holder to manage their payments and splits.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Name Field - Required */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Full name or company name"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email Field - Optional */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="contact@example.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Address Field - Optional */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="Physical address for payments and legal notices"
                rows={3}
                disabled={isSubmitting}
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            {/* Banking Details Section */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium text-foreground">Banking Details</h4>
              
              {/* Sort Code Field - Optional */}
              <div className="space-y-2">
                <Label htmlFor="sort_code">Sort Code</Label>
                <Input
                  id="sort_code"
                  {...register('sort_code')}
                  placeholder="xx-xx-xx"
                  maxLength={8}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    const formatted = formatSortCode(e.target.value)
                    setValue('sort_code', formatted)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  UK bank sort code in format xx-xx-xx
                </p>
                {errors.sort_code && (
                  <p className="text-sm text-red-600">{errors.sort_code.message}</p>
                )}
              </div>

              {/* Account Number Field - Optional */}
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  {...register('account_number')}
                  placeholder="12345678"
                  maxLength={8}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    // Only allow digits
                    const digits = e.target.value.replace(/\D/g, '')
                    setValue('account_number', digits)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  8-digit UK bank account number
                </p>
                {errors.account_number && (
                  <p className="text-sm text-red-600">{errors.account_number.message}</p>
                )}
              </div>

              {/* VAT Registered Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vat_registered"
                  checked={vatRegistered}
                  onCheckedChange={(checked) => setValue('vat_registered', !!checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="vat_registered" className="text-sm font-normal">
                  VAT Registered
                </Label>
              </div>
            </div>

            {/* Minimum Payout Override Field - Optional */}
            <div className="space-y-2">
              <Label htmlFor="min_payout_override">Custom Minimum Payout (£)</Label>
              <Input
                id="min_payout_override"
                type="number"
                step="0.01"
                min="0"
                {...register('min_payout_override')}
                placeholder="20.00"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Override the default minimum payout threshold for this holder
                {minPayoutValue && minPayoutValue.trim() && !isNaN(parseFloat(minPayoutValue)) && (
                  <span className="block font-medium text-foreground">
                    Custom threshold: {formatCurrency(Math.round(parseFloat(minPayoutValue) * 100))}
                  </span>
                )}
              </p>
              {errors.min_payout_override && (
                <p className="text-sm text-red-600">{errors.min_payout_override.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Holder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}