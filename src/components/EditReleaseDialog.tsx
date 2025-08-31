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
import { Release } from '@/types'

/**
 * EDIT RELEASE DIALOG COMPONENT
 * 
 * This dialog allows editing existing music releases.
 * Features:
 * - Form validation with Zod schema
 * - Pre-populated with existing release data
 * - Release type selection (single, ep, album)
 * - UPC code validation (optional)
 * - Release date picker
 * - Success/error handling
 */

// Form validation schema - same as AddReleaseDialog
const editReleaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  artist: z.string().min(1, 'Artist is required').max(100, 'Artist must be 100 characters or less'),
  release_type: z.enum(['single', 'ep', 'album'], {
    required_error: 'Please select a release type',
  }),
  upc: z.string().regex(/^\d{12}$/, 'UPC must be 12 digits').optional().or(z.literal('')),
  release_date: z.string().optional(),
})

type EditReleaseFormData = z.infer<typeof editReleaseSchema>

interface EditReleaseDialogProps {
  release: Release | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onReleaseUpdated: () => void
}

export function EditReleaseDialog({ release, open, onOpenChange, onReleaseUpdated }: EditReleaseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<EditReleaseFormData>({
    resolver: zodResolver(editReleaseSchema),
  })

  const watchReleaseType = watch('release_type')

  // Pre-populate form when release changes
  useEffect(() => {
    if (release && open) {
      setValue('title', release.title)
      setValue('artist', release.artist)
      setValue('release_type', release.release_type)
      setValue('upc', release.upc || '')
      setValue('release_date', release.release_date || '')
    }
  }, [release, open, setValue])

  const onSubmit = async (data: EditReleaseFormData) => {
    if (!release) return
    
    setIsSubmitting(true)
    try {
      // Update the release
      const updatedRelease = await dataService.releases.update(release.id, {
        title: data.title,
        artist: data.artist,
        release_type: data.release_type,
        upc: data.upc || undefined,
        release_date: data.release_date || undefined,
      })

      // Show success message
      toast.success(`"${updatedRelease.title}" by ${updatedRelease.artist} has been updated successfully!`)

      // Reset form and close dialog
      reset()
      onOpenChange(false)
      onReleaseUpdated()
    } catch (error) {
      console.error('Error updating release:', error)
      
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast.error(`Failed to update release: ${errorMessage}`)
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

  if (!release) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Release</DialogTitle>
          <DialogDescription>
            Update {release.title}'s details and information.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          {/* UPC Field */}
          <div className="space-y-2">
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
              {isSubmitting ? 'Updating...' : 'Update Release'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}