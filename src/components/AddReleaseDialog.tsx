import { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { dataService } from '@/lib/data-service'

/**
 * ADD RELEASE DIALOG COMPONENT
 * 
 * This dialog allows creating new music releases (albums, EPs, singles).
 * Features:
 * - Form validation with Zod schema
 * - Release type selection (single, ep, album)
 * - UPC code validation (optional)
 * - Release date picker
 * - Success/error handling
 */

// ISRC format validation (optional for Quick Single workflow)
const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{2}[0-9]{5}$/

// Form validation schema with Quick Single support
const addReleaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  artist: z.string().min(1, 'Artist is required').max(100, 'Artist must be 100 characters or less'),
  release_type: z.enum(['single', 'ep', 'album'], {
    required_error: 'Please select a release type',
  }),
  upc: z.string().regex(/^\d{12}$/, 'UPC must be 12 digits').optional().or(z.literal('')),
  release_date: z.string().optional(),
  // Quick Single fields
  create_first_track: z.boolean().optional(),
  track_title: z.string().max(200, 'Track title must be 200 characters or less').optional(),
  track_isrc: z.string()
    .regex(isrcRegex, 'ISRC must follow format: GBUM71234567')
    .optional()
    .or(z.literal('')),
})

type AddReleaseFormData = z.infer<typeof addReleaseSchema>

interface AddReleaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReleaseAdded: () => void
}

export function AddReleaseDialog({ open, onOpenChange, onReleaseAdded }: AddReleaseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AddReleaseFormData>({
    resolver: zodResolver(addReleaseSchema),
    defaultValues: {
      release_type: 'single',
      create_first_track: true,
      track_title: '',
      track_isrc: '',
    },
  })

  const watchReleaseType = watch('release_type')
  const watchCreateFirstTrack = watch('create_first_track')
  const watchTitle = watch('title')

  const onSubmit = async (data: AddReleaseFormData) => {
    setIsSubmitting(true)
    try {
      // Create the release
      const newRelease = await dataService.releases.create({
        title: data.title,
        artist: data.artist,
        release_type: data.release_type,
        split_method: 'standard', // Default to standard splits
        upc: data.upc || undefined,
        release_date: data.release_date || undefined,
      })

      // If Quick Single is enabled and it's a single, create the first track
      if (data.create_first_track && data.release_type === 'single') {
        const trackTitle = data.track_title || data.title // Default to release title
        
        await dataService.tracks.create({
          release_id: newRelease.id,
          title: trackTitle,
          track_number: 1,
          isrc: data.track_isrc || undefined,
          use_release_splits: true, // Default to using release splits
          split_method: 'standard',
        })

        // Show success message for Quick Single
        toast.success(`Single "${newRelease.title}" with first track "${trackTitle}" created successfully!`)
      } else {
        // Show regular success message
        toast.success(`"${newRelease.title}" by ${newRelease.artist} has been added successfully!`)
      }

      // Reset form and close dialog
      reset({
        release_type: 'single',
        create_first_track: true,
        track_title: '',
        track_isrc: '',
      })
      onOpenChange(false)
      onReleaseAdded()
    } catch (error) {
      console.error('Error creating release:', error)
      
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast.error(`Failed to create release: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        reset({
          release_type: 'single',
          create_first_track: true,
          track_title: '',
          track_isrc: '',
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Release</DialogTitle>
          <DialogDescription>
            Create a new music release (album, EP, or single) in your catalogue.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Release Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Enter release title"
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Artist Field */}
              <div className="space-y-2">
                <Label htmlFor="artist">Artist *</Label>
                <Input
                  id="artist"
                  {...register('artist')}
                  placeholder="Enter artist name"
                />
                {errors.artist && (
                  <p className="text-sm text-red-600">{errors.artist.message}</p>
                )}
              </div>

              {/* Release Type Field */}
              <div className="space-y-2">
                <Label htmlFor="release_type">Release Type *</Label>
                <Select 
                  value={watchReleaseType} 
                  onValueChange={(value) => setValue('release_type', value as 'single' | 'ep' | 'album')}
                >
                  <SelectTrigger id="release_type">
                    <SelectValue placeholder="Select release type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="ep">EP</SelectItem>
                    <SelectItem value="album">Album</SelectItem>
                  </SelectContent>
                </Select>
                {errors.release_type && (
                  <p className="text-sm text-red-600">{errors.release_type.message}</p>
                )}
              </div>

              {/* Release Date Field */}
              <div className="space-y-2">
                <Label htmlFor="release_date">Release Date</Label>
                <Input
                  id="release_date"
                  type="date"
                  {...register('release_date')}
                />
                <p className="text-xs text-muted-foreground">
                  The official release date of this music.
                </p>
                {errors.release_date && (
                  <p className="text-sm text-red-600">{errors.release_date.message}</p>
                )}
              </div>
            </div>
            
            {/* UPC Field - Full Width */}
            <div className="space-y-2 max-w-md">
              <Label htmlFor="upc">UPC Code</Label>
              <Input
                id="upc"
                {...register('upc')}
                placeholder="123456789012"
                maxLength={12}
              />
              <p className="text-xs text-muted-foreground">
                Universal Product Code (12 digits). Used for digital distribution.
              </p>
              {errors.upc && (
                <p className="text-sm text-red-600">{errors.upc.message}</p>
              )}
            </div>
          </div>


          {/* Quick Single Workflow */}
          {watchReleaseType === 'single' && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-3">
                <Label className="text-base font-medium">Quick Single Setup</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create_first_track"
                    checked={watchCreateFirstTrack}
                    onCheckedChange={(checked) => setValue('create_first_track', !!checked)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="create_first_track" className="text-sm">
                    Create first track automatically
                  </Label>
                </div>

                {watchCreateFirstTrack && (
                  <div className="ml-6 space-y-4">
                    {/* Track Title */}
                    <div className="space-y-2">
                      <Label htmlFor="track_title">Track Title</Label>
                      <Input
                        id="track_title"
                        {...register('track_title')}
                        placeholder={watchTitle || 'Same as release title'}
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank to use the release title as track title.
                      </p>
                      {errors.track_title && (
                        <p className="text-sm text-red-600">{errors.track_title.message}</p>
                      )}
                    </div>

                    {/* Track ISRC */}
                    <div className="space-y-2">
                      <Label htmlFor="track_isrc">Track ISRC Code (Optional)</Label>
                      <Input
                        id="track_isrc"
                        {...register('track_isrc')}
                        placeholder="e.g., GBUM71234567"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        International Standard Recording Code for the track.
                      </p>
                      {errors.track_isrc && (
                        <p className="text-sm text-red-600">{errors.track_isrc.message}</p>
                      )}
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Quick Single:</strong> Creates both the release and first track in one step. 
                        The track will automatically use the release's royalty splits.
                      </p>
                    </div>
                  </div>
                )}
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
              {isSubmitting ? 'Creating...' : 'Create Release'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}