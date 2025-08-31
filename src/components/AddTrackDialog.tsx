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
import { Checkbox } from '@/components/ui/checkbox'
import { dataService } from '@/lib/data-service'
import { Release, Track } from '@/types'
import { Music2 } from 'lucide-react'

/**
 * ADD TRACK DIALOG COMPONENT
 * 
 * This dialog allows adding new tracks either to existing releases or as standalone tracks.
 * Features:
 * - Support for both release-assigned and standalone tracks
 * - Automatic track numbering based on existing tracks (for release tracks)
 * - ISRC code validation (optional)
 * - Split inheritance options (release splits vs custom)
 * - Form validation with Zod schema
 * - Success/error handling with toast notifications
 */

// ISRC format: Country(2) + Registrant(3) + Year(2) + Designation(5)
// Example: GBUM71234567
const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{2}[0-9]{5}$/

// Form validation schema
const addTrackSchema = z.object({
  title: z.string().min(1, 'Track title is required').max(200, 'Title must be 200 characters or less'),
  release_id: z.string().optional(),
  track_number: z.number().min(1, 'Track number must be 1 or greater').optional(),
  isrc: z.string()
    .regex(isrcRegex, 'ISRC must follow format: GBUM71234567 (2 country + 3 registrant + 2 year + 5 designation)')
    .optional()
    .or(z.literal('')),
  use_release_splits: z.boolean(),
  split_method: z.enum(['standard', 'primary_first']),
})

type AddTrackFormData = z.infer<typeof addTrackSchema>

interface AddTrackDialogProps {
  release?: Release | null // Optional: if provided, track will be added to this release
  open: boolean
  onOpenChange: (open: boolean) => void
  onTrackAdded: (newTrack?: Track) => void
  availableReleases?: Release[] // Optional: pre-loaded releases data to avoid fetching
  existingTracks?: Track[] // Optional: pre-loaded tracks data to avoid fetching
}

export function AddTrackDialog({ 
  release, 
  open, 
  onOpenChange, 
  onTrackAdded, 
  availableReleases,
  existingTracks: preloadedTracks 
}: AddTrackDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingTracks, setExistingTracks] = useState<Track[]>([])
  const [loadingTracks] = useState(false)
  const [releases, setReleases] = useState<Release[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AddTrackFormData>({
    resolver: zodResolver(addTrackSchema),
    defaultValues: {
      title: '',
      release_id: release?.id || '',
      track_number: 1,
      isrc: '',
      use_release_splits: true,
      split_method: 'standard',
    },
  })

  const watchUseReleaseSplits = watch('use_release_splits')
  const watchReleaseId = watch('release_id')

  // Load or use pre-loaded data when dialog opens
  useEffect(() => {
    if (open) {
      // Use pre-loaded releases data if available, otherwise fetch
      if (availableReleases && !release) {
        setReleases(availableReleases.sort((a, b) => a.title.localeCompare(b.title)))
      } else if (!release) {
        loadReleases()
      }
      
      // Load existing tracks for release if needed
      if (release) {
        loadExistingTracks()
      }
    }
  }, [open, release, availableReleases])

  // Load existing tracks when release selection changes
  useEffect(() => {
    if (watchReleaseId && releases.length > 0) {
      const selectedRelease = releases.find(r => r.id === watchReleaseId)
      if (selectedRelease) {
        // Use pre-loaded tracks if available, otherwise fetch
        if (preloadedTracks) {
          calculateTrackInfoFromPreloaded(watchReleaseId, preloadedTracks, selectedRelease)
        } else {
          loadExistingTracksForRelease(watchReleaseId)
        }
      }
    }
  }, [watchReleaseId, releases, preloadedTracks])

  const calculateTrackInfoFromPreloaded = (releaseId: string, tracks: Track[], selectedRelease: Release) => {
    // Use pre-loaded data to instantly calculate track info
    const releaseTracks = tracks.filter(track => track.release_id === releaseId)
    setExistingTracks(releaseTracks)
    
    // Calculate next track number
    const maxTrackNumber = releaseTracks.reduce((max, track) => 
      Math.max(max, track.track_number), 0
    )
    const nextTrackNumber = maxTrackNumber + 1
    setValue('track_number', nextTrackNumber)

    // For singles, automatically use the release title as track title
    if (selectedRelease.release_type === 'single' && releaseTracks.length === 0) {
      setValue('title', selectedRelease.title)
    }
  }

  const loadReleases = async () => {
    // For mock data, no need to show loading state - data loads instantly
    try {
      const releasesData = await dataService.releases.getAll()
      setReleases(releasesData.sort((a, b) => a.title.localeCompare(b.title)))
    } catch (error) {
      console.error('Error loading releases:', error)
      toast.error('Failed to load releases')
    }
  }

  const loadExistingTracks = async () => {
    if (!release) return
    
    // Use pre-loaded tracks if available, otherwise fetch
    if (preloadedTracks) {
      calculateTrackInfoFromPreloaded(release.id, preloadedTracks, release)
    } else {
      await loadExistingTracksForRelease(release.id)
    }
  }

  const loadExistingTracksForRelease = async (releaseId: string) => {
    // For mock data, this loads instantly - only show loading for longer operations
    try {
      const tracks = await dataService.tracks.getAll()
      const releaseTracks = tracks.filter(track => track.release_id === releaseId)
      setExistingTracks(releaseTracks)
      
      // Calculate next track number
      const maxTrackNumber = releaseTracks.reduce((max, track) => 
        Math.max(max, track.track_number), 0
      )
      const nextTrackNumber = maxTrackNumber + 1
      setValue('track_number', nextTrackNumber)

      // Find the selected release for title logic
      const selectedRelease = release || releases.find(r => r.id === releaseId)
      
      // For singles, automatically use the release title as track title
      if (selectedRelease?.release_type === 'single' && releaseTracks.length === 0) {
        setValue('title', selectedRelease.title)
      }
    } catch (error) {
      console.error('Error loading existing tracks:', error)
      toast.error('Failed to load existing tracks')
    }
  }

  const onSubmit = async (data: AddTrackFormData) => {
    const selectedRelease = release || releases.find(r => r.id === data.release_id)
    
    // For release tracks, check for duplicate track numbers
    if (data.release_id && data.track_number) {
      const trackNumberExists = existingTracks.some(track => 
        track.track_number === data.track_number
      )
      
      if (trackNumberExists) {
        toast.error(`Track number ${data.track_number} already exists. Please choose a different number.`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      // Create the track
      const newTrack = await dataService.tracks.create({
        release_id: data.release_id || undefined,
        title: data.title,
        track_number: data.track_number || 1,
        isrc: data.isrc || undefined,
        use_release_splits: data.use_release_splits,
        split_method: (data.use_release_splits && selectedRelease) 
          ? selectedRelease.split_method 
          : data.split_method,
      })

      // Show appropriate success message
      const successMessage = selectedRelease
        ? `Track "${newTrack.title}" has been added to "${selectedRelease.title}"!`
        : `Standalone track "${newTrack.title}" has been created!`
      
      toast.success(successMessage)

      // Reset form and close dialog
      reset({
        title: '',
        release_id: release?.id || '',
        track_number: 1,
        isrc: '',
        use_release_splits: true,
        split_method: 'standard',
      })
      onOpenChange(false)
      onTrackAdded(newTrack) // Pass the new track for optimistic updates
    } catch (error) {
      console.error('Error creating track:', error)
      
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast.error(`Failed to create track: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        reset({
          title: '',
          release_id: release?.id || '',
          track_number: 1,
          isrc: '',
          use_release_splits: true,
          split_method: 'standard',
        })
        setExistingTracks([])
        setReleases([])
      }
    }
  }

  const selectedRelease = release || releases.find(r => r.id === watchReleaseId)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music2 className="h-5 w-5" />
            {release ? `Add Track to "${release.title}"` : 'Add New Track'}
          </DialogTitle>
          <DialogDescription>
            {release 
              ? `Add a new track to this ${release.release_type}. ${release.release_type === 'single' ? ' Track title will match the release title.' : ''}`
              : 'Create a new track. You can assign it to a release or leave it standalone.'
            }
          </DialogDescription>
        </DialogHeader>

        {loadingTracks ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">
              Loading track information...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Release Selection - only show if not pre-selected */}
            {!release && (
              <div className="space-y-2">
                <Label htmlFor="release_id">Release (Optional)</Label>
                <Select 
                  value={watchReleaseId || 'none'} 
                  onValueChange={(value) => setValue('release_id', value === 'none' ? '' : value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="release_id">
                    <SelectValue placeholder="Select a release or leave standalone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No release (standalone track)</SelectItem>
                    {releases.map((rel) => (
                      <SelectItem key={rel.id} value={rel.id}>
                        {rel.title} - {rel.artist} ({rel.release_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {watchReleaseId 
                    ? "Track will be added to the selected release" 
                    : "Track will be created as standalone and can be assigned to a release later"
                  }
                </p>
              </div>
            )}

            {/* Track Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Track Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Track Title */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">
                    Track Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder={(selectedRelease?.release_type === 'single') 
                      ? 'Will use release title automatically' 
                      : 'Enter track title...'
                    }
                    {...register('title')}
                    disabled={isSubmitting || (selectedRelease?.release_type === 'single' && existingTracks.length === 0)}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title.message}</p>
                  )}
                  {(selectedRelease?.release_type === 'single' && existingTracks.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      For singles with no existing tracks, the track title automatically matches the release title.
                    </p>
                  )}
                </div>

                {/* Track Number - only show if release is selected */}
                {(selectedRelease || watchReleaseId) && (
                  <div className="space-y-2">
                    <Label htmlFor="track_number">
                      Track Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="track_number"
                      type="number"
                      min="1"
                      {...register('track_number', { valueAsNumber: true })}
                      disabled={isSubmitting}
                    />
                    {errors.track_number && (
                      <p className="text-sm text-red-600">{errors.track_number.message}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Current tracks: {existingTracks.length}. Suggested: {existingTracks.length + 1}
                    </p>
                  </div>
                )}

                {/* ISRC Code */}
                <div className="space-y-2">
                  <Label htmlFor="isrc">ISRC Code (Optional)</Label>
                  <Input
                    id="isrc"
                    placeholder="e.g., GBUM71234567"
                    {...register('isrc')}
                    disabled={isSubmitting}
                  />
                  {errors.isrc && (
                    <p className="text-sm text-red-600">{errors.isrc.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    International Standard Recording Code. Leave blank if not assigned yet.
                  </p>
                </div>
              </div>
            </div>

            {/* Split Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Royalty Split Settings</h3>
              <div className="space-y-3">
                
                {/* Use Release Splits - only show if release is selected */}
                {selectedRelease && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use_release_splits"
                      checked={watchUseReleaseSplits}
                      onCheckedChange={(checked) => setValue('use_release_splits', !!checked)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="use_release_splits" className="text-sm">
                      Use release splits (inherit from "{selectedRelease.title}")
                    </Label>
                  </div>
                )}

                {/* Split Method - show if no release selected or not using release splits */}
                {(!selectedRelease || !watchUseReleaseSplits) && (
                  <div className={selectedRelease ? "ml-6 space-y-2" : "space-y-2"}>
                    <Label htmlFor="split_method">Split Method</Label>
                    <Select
                      value={watch('split_method')}
                      onValueChange={(value) => setValue('split_method', value as 'standard' | 'primary_first')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (all splits sum to 100%)</SelectItem>
                        <SelectItem value="primary_first">Primary First (tiered splits)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      You'll need to configure {selectedRelease ? 'track-specific' : 'custom'} splits after creation.
                    </p>
                  </div>
                )}

                {/* Info box */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {selectedRelease && watchUseReleaseSplits
                      ? <><strong>Release Splits:</strong> This track will inherit the royalty splits from "{selectedRelease.title}".</>
                      : <><strong>Custom Splits:</strong> You'll be able to configure {selectedRelease ? 'track-specific' : 'custom'} royalty splits after creation.</>
                    }
                  </p>
                </div>
              </div>
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
              <Button 
                type="submit" 
                disabled={isSubmitting || loadingTracks}
              >
                {isSubmitting ? 'Creating Track...' : 'Create Track'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}