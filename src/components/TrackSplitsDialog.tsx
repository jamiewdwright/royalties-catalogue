import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, Music, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { dataService } from '@/lib/data-service'
import { formatPercentage } from '@/lib/constants'
import { Track, Holder, TrackSplit, ReleaseSplit } from '@/types'

/**
 * TRACK SPLITS MANAGEMENT DIALOG
 * 
 * This dialog allows managing royalty splits for individual tracks.
 * Features:
 * - Toggle between using release splits or custom track splits
 * - Add/remove holder assignments with percentages (when using custom)
 * - Real-time validation that splits sum to 100%
 * - Visual progress indicator for completion
 * - Shows comparison with release-level splits
 * - Form validation with proper error handling
 */

// Form validation schema
const trackSplitFormSchema = z.object({
  use_release_splits: z.boolean(),
  splits: z.array(
    z.object({
      holder_id: z.string().min(1, 'Please select a holder'),
      percentage: z.number()
        .min(0.01, 'Percentage must be greater than 0')
        .max(100, 'Percentage cannot exceed 100'),
    })
  ).optional(),
})

type TrackSplitFormData = z.infer<typeof trackSplitFormSchema>

interface TrackSplitsDialogProps {
  track: Track | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTrackUpdated: () => void
}

export function TrackSplitsDialog({ track, open, onOpenChange, onTrackUpdated }: TrackSplitsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [holders, setHolders] = useState<Holder[]>([])
  const [currentTrackSplits, setCurrentTrackSplits] = useState<TrackSplit[]>([])
  const [releaseSplits, setReleaseSplits] = useState<ReleaseSplit[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<TrackSplitFormData>({
    resolver: zodResolver(trackSplitFormSchema),
    defaultValues: {
      use_release_splits: true,
      splits: [{ holder_id: '', percentage: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'splits',
  })

  const watchedUseReleaseSplits = watch('use_release_splits')
  const watchedSplits = watch('splits') || []

  // Calculate total percentage for custom splits
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
    if (open && track) {
      loadData()
    }
  }, [open, track])

  const loadData = async () => {
    if (!track) return
    
    setLoadingData(true)
    try {
      const [holdersData, trackSplitsData, releaseSplitsData] = await Promise.all([
        dataService.holders.getAll(),
        dataService.trackSplits.getByTrackId(track.id),
        track.release_id ? dataService.releaseSplits.getByReleaseId(track.release_id) : Promise.resolve([]),
      ])
      
      setHolders(holdersData)
      setCurrentTrackSplits(trackSplitsData)
      setReleaseSplits(releaseSplitsData)
      
      // Pre-populate form with existing data
      setValue('use_release_splits', track.use_release_splits)
      
      if (!track.use_release_splits && trackSplitsData.length > 0) {
        reset({
          use_release_splits: false,
          splits: trackSplitsData.map(split => ({
            holder_id: split.holder_id,
            percentage: split.percentage,
          }))
        })
      } else {
        reset({
          use_release_splits: track.use_release_splits,
          splits: [{ holder_id: '', percentage: 0 }]
        })
      }
    } catch (error) {
      console.error('Error loading track splits data:', error)
      toast.error('Failed to load track splits data')
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = async (data: TrackSplitFormData) => {
    if (!track) return
    
    setIsSubmitting(true)
    try {
      // Update track's use_release_splits setting
      await dataService.tracks.update(track.id, {
        use_release_splits: data.use_release_splits,
      })

      // If using custom splits, update them
      if (!data.use_release_splits && data.splits) {
        // Validate total percentage for custom splits
        if (!isValidTotal) {
          toast.error('Custom splits must sum to exactly 100%')
          setIsSubmitting(false)
          return
        }

        // Check for duplicate holders
        const holderIds = data.splits.map(s => s.holder_id)
        const uniqueHolderIds = new Set(holderIds)
        if (holderIds.length !== uniqueHolderIds.size) {
          toast.error('Cannot assign the same holder multiple times')
          setIsSubmitting(false)
          return
        }

        await dataService.trackSplits.upsertSplits(track.id, data.splits.map(split => ({
          holder_id: split.holder_id,
          percentage: split.percentage,
        })))
      } else {
        // Clear any existing custom splits when switching to release splits
        await dataService.trackSplits.deleteByTrackId(track.id)
      }

      toast.success(`Track splits updated successfully!`)

      // Reset form and close dialog
      onOpenChange(false)
      onTrackUpdated()
    } catch (error) {
      console.error('Error updating track splits:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast.error(`Failed to update track splits: ${errorMessage}`)
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
        reset({ use_release_splits: true, splits: [{ holder_id: '', percentage: 0 }] })
        setCurrentTrackSplits([])
        setReleaseSplits([])
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

  if (!track) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Track Splits: {track.title}
          </DialogTitle>
          <DialogDescription>
            Configure royalty splits for track #{track.track_number} on this release
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading track splits data...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Split Type Toggle */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Split Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use_release_splits"
                    checked={watchedUseReleaseSplits}
                    onCheckedChange={(checked) => setValue('use_release_splits', checked as boolean)}
                  />
                  <Label htmlFor="use_release_splits" className="text-sm">
                    Use release-level splits (recommended)
                  </Label>
                </div>
                
                <div className="text-sm text-muted-foreground pl-6">
                  {watchedUseReleaseSplits ? (
                    <div className="flex items-center gap-2">
                      <ToggleRight className="h-4 w-4 text-green-600" />
                      <span>This track will inherit royalty splits from the release</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ToggleLeft className="h-4 w-4 text-blue-600" />
                      <span>This track will use custom splits defined below</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Release Splits Reference (when using release splits) */}
            {watchedUseReleaseSplits && releaseSplits.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Release Splits (will be applied)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {releaseSplits.map((split) => {
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

            {/* Custom Splits Configuration */}
            {!watchedUseReleaseSplits && (
              <>
                {/* Progress Indicator */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Custom Split Allocation</span>
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

                {/* Custom Splits Fields */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Custom Royalty Holder Assignments</Label>
                  
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <Select
                          value={watchedSplits[index]?.holder_id || ''}
                          onValueChange={(value) => {
                            const newSplits = [...watchedSplits]
                            newSplits[index] = { ...newSplits[index], holder_id: value }
                            reset({ 
                              use_release_splits: watchedUseReleaseSplits,
                              splits: newSplits 
                            })
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
                            reset({ 
                              use_release_splits: watchedUseReleaseSplits,
                              splits: newSplits 
                            })
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
              </>
            )}

            {/* Current Track Splits Summary (if exists) */}
            {currentTrackSplits.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    Current Custom Splits (before changes)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {currentTrackSplits.map((split) => {
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
                disabled={isSubmitting || (!watchedUseReleaseSplits && !isValidTotal)}
                className={(!watchedUseReleaseSplits && !isValidTotal) ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isSubmitting ? 'Updating...' : 'Update Track Splits'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}