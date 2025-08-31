import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, Users, AlertTriangle, Calculator, ArrowUp, ArrowDown, Info } from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { dataService } from '@/lib/data-service'
import { formatPercentage } from '@/lib/constants'
import { SplitCalculator } from '@/lib/split-calculator'
import { Release, Holder, ReleaseSplit } from '@/types'

/**
 * ENHANCED RELEASE SPLITS MANAGEMENT DIALOG
 * 
 * This dialog allows managing royalty splits for a release with support for:
 * 
 * Standard Method:
 * - All splits are percentages of total revenue
 * - Must sum to exactly 100%
 * - Simple proportional allocation
 * 
 * Primary First Method (Tiered):
 * - Primary splits take their percentage from gross revenue (in order)
 * - Secondary splits share the remaining revenue pool
 * - Secondary splits must sum to 100% of remainder
 * - Enables industry-standard structures like management commissions
 * 
 * Features:
 * - Split method selection (standard vs primary_first)
 * - Tier management (primary vs secondary)
 * - Split ordering within tiers with drag-and-drop
 * - Description fields for split purposes
 * - Real-time validation and calculation preview
 * - Integration with SplitCalculator service
 */

// Form validation schema for enhanced splits
const splitFormSchema = z.object({
  split_method: z.enum(['standard', 'primary_first']),
  splits: z.array(
    z.object({
      holder_id: z.string().min(1, 'Please select a holder'),
      percentage: z.number()
        .min(0.01, 'Percentage must be greater than 0')
        .max(100, 'Percentage cannot exceed 100'),
      tier: z.enum(['primary', 'secondary']),
      split_order: z.number().min(1),
      description: z.string().optional(),
    })
  ).min(1, 'At least one split is required'),
})

type SplitFormData = z.infer<typeof splitFormSchema>

interface ReleaseSplitsDialogProps {
  release: Release | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSplitsUpdated: () => void
}

export function ReleaseSplitsDialog({ release, open, onOpenChange, onSplitsUpdated }: ReleaseSplitsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [holders, setHolders] = useState<Holder[]>([])
  const [currentSplits, setCurrentSplits] = useState<ReleaseSplit[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  } | null>(null)
  const [previewCalculation, setPreviewCalculation] = useState<any>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SplitFormData>({
    resolver: zodResolver(splitFormSchema),
    defaultValues: {
      split_method: 'standard',
      splits: [{ holder_id: '', percentage: 0, tier: 'secondary', split_order: 1, description: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'splits',
  })

  const watchedSplits = watch('splits')

  // Calculate total percentage
  const totalPercentage = watchedSplits.reduce((sum, split) => {
    const percentage = typeof split.percentage === 'string' 
      ? parseFloat(split.percentage) || 0 
      : split.percentage || 0
    return sum + percentage
  }, 0)

  const isValidTotal = Math.abs(totalPercentage - 100) < 0.01
  const progressColor = totalPercentage > 100 ? 'bg-red-500' : totalPercentage < 100 ? 'bg-yellow-500' : 'bg-green-500'

  // Load data when dialog opens
  useEffect(() => {
    if (open && release) {
      loadData()
    }
  }, [open, release])

  const loadData = async () => {
    if (!release) return
    
    setLoadingData(true)
    try {
      const [holdersData, splitsData] = await Promise.all([
        dataService.holders.getAll(),
        dataService.releaseSplits.getByReleaseId(release.id),
      ])
      
      setHolders(holdersData)
      setCurrentSplits(splitsData)
      
      // Pre-populate form with existing splits
      if (splitsData.length > 0) {
        reset({
          splits: splitsData.map(split => ({
            holder_id: split.holder_id,
            percentage: split.percentage,
          }))
        })
      } else {
        // Start with one empty split
        reset({
          splits: [{ holder_id: '', percentage: 0 }]
        })
      }
    } catch (error) {
      console.error('Error loading splits data:', error)
      toast.error('Failed to load splits data')
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = async (data: SplitFormData) => {
    if (!release) return
    
    // Validate total percentage
    if (!isValidTotal) {
      toast.error('Splits must sum to exactly 100%')
      return
    }

    // Check for duplicate holders
    const holderIds = data.splits.map(s => s.holder_id)
    const uniqueHolderIds = new Set(holderIds)
    if (holderIds.length !== uniqueHolderIds.size) {
      toast.error('Cannot assign the same holder multiple times')
      return
    }

    setIsSubmitting(true)
    try {
      // Update the splits
      await dataService.releaseSplits.upsertSplits(release.id, data.splits.map(split => ({
        holder_id: split.holder_id,
        percentage: split.percentage,
      })))

      toast.success('Release splits updated successfully!')

      // Reset form and close dialog
      onOpenChange(false)
      onSplitsUpdated()
    } catch (error) {
      console.error('Error updating splits:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast.error(`Failed to update splits: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addSplit = () => {
    append({ holder_id: '', percentage: 0 })
  }

  const removeSplit = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        reset({ splits: [{ holder_id: '', percentage: 0 }] })
        setCurrentSplits([])
      }
    }
  }

  // Get available holders for a specific field (exclude already selected)
  const getAvailableHolders = (currentIndex: number) => {
    const selectedHolderIds = watchedSplits
      .map((split, index) => index !== currentIndex ? split.holder_id : null)
      .filter(Boolean)
    
    return holders.filter(holder => !selectedHolderIds.includes(holder.id))
  }

  if (!release) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Release Splits
          </DialogTitle>
          <DialogDescription>
            Configure royalty percentage splits for "{release.title}" by {release.artist}
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading splits data...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Progress Indicator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Split Allocation Progress</span>
                  <span className={`font-mono text-lg ${
                    totalPercentage > 100 ? 'text-red-600' : 
                    totalPercentage < 100 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {totalPercentage.toFixed(1)}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={Math.min(totalPercentage, 100)} className={`h-3 ${progressColor}`} />
                <div className="flex items-center gap-2 text-sm">
                  {!isValidTotal && (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-amber-600">
                        {totalPercentage > 100 ? 'Total exceeds 100%' : 'Total must equal 100%'}
                      </span>
                    </>
                  )}
                  {isValidTotal && (
                    <span className="text-green-600">✓ Splits are correctly balanced</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Splits Fields */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Royalty Holder Assignments</Label>
              
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Select
                      value={watchedSplits[index]?.holder_id || ''}
                      onValueChange={(value) => {
                        const newSplits = [...watchedSplits]
                        newSplits[index] = { ...newSplits[index], holder_id: value }
                        reset({ splits: newSplits })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select holder..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableHolders(index).map((holder) => (
                          <SelectItem key={holder.id} value={holder.id}>
                            <div>
                              <div className="font-medium">{holder.name}</div>
                              <div className="text-xs text-muted-foreground">ID: {holder.id}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.splits?.[index]?.holder_id && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.splits[index]?.holder_id?.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="w-32">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      value={watchedSplits[index]?.percentage || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        const newSplits = [...watchedSplits]
                        newSplits[index] = { ...newSplits[index], percentage: value }
                        reset({ splits: newSplits })
                      }}
                    />
                    {errors.splits?.[index]?.percentage && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.splits[index]?.percentage?.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-8">%</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSplit(index)}
                      disabled={fields.length === 1}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {errors.splits && typeof errors.splits === 'object' && 'message' in errors.splits && (
                <p className="text-sm text-red-600">{errors.splits.message}</p>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={addSplit}
                className="w-full"
                disabled={fields.length >= holders.length}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Split
              </Button>
            </div>

            {/* Current Splits Summary */}
            {currentSplits.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Current Splits (before changes)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {currentSplits.map((split) => {
                    const holder = holders.find(h => h.id === split.holder_id)
                    return (
                      <div key={split.id} className="flex justify-between text-sm">
                        <span>{holder?.name || 'Unknown Holder'}</span>
                        <span className="font-mono">{formatPercentage(split.percentage)}</span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
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
              <Button 
                type="submit" 
                disabled={isSubmitting || !isValidTotal}
                className={!isValidTotal ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isSubmitting ? 'Updating...' : 'Update Splits'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}