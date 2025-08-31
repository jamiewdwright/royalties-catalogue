import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Music, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { AddReleaseDialog } from '@/components/AddReleaseDialog'
import { EditReleaseDialog } from '@/components/EditReleaseDialog'
import { dataService } from '@/lib/data-service'
import { Release, Track } from '@/types'

export function Releases() {
  const [releases, setReleases] = useState<Release[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [releaseSplits, setReleaseSplits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingRelease, setEditingRelease] = useState<Release | null>(null)

  const loadData = async () => {
    try {
      const [releasesData, tracksData] = await Promise.all([
        dataService.releases.getAll(),
        dataService.tracks.getAll(),
      ])
      setReleases(releasesData)
      setTracks(tracksData)
      
      // Load splits for each release to show validation status
      const allSplits = []
      for (const release of releasesData) {
        try {
          const splits = await dataService.releaseSplits.getByReleaseId(release.id)
          allSplits.push(...splits.map(s => ({ ...s, release_id: release.id })))
        } catch (error) {
          console.error(`Error loading splits for release ${release.id}:`, error)
        }
      }
      setReleaseSplits(allSplits)
    } catch (error) {
      console.error('Error loading releases:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleReleaseAdded = (newRelease?: Release) => {
    if (newRelease) {
      // Optimistic update - add new release immediately
      setReleases(prev => [...prev, newRelease])
    } else {
      // Fallback to full reload if no release data provided
      loadData()
    }
  }

  const handleReleaseUpdated = (updatedRelease?: Release) => {
    if (updatedRelease) {
      // Optimistic update - update release immediately
      setReleases(prev => prev.map(r => r.id === updatedRelease.id ? updatedRelease : r))
    } else {
      // Fallback to full reload
      loadData()
    }
    setEditingRelease(null)
  }

  const handleDeleteRelease = async (release: Release) => {
    if (!confirm(`Are you sure you want to delete "${release.title}" by ${release.artist}? This action cannot be undone.`)) {
      return
    }

    try {
      // Optimistic update - remove from UI immediately
      setReleases(prev => prev.filter(r => r.id !== release.id))
      
      await dataService.releases.delete(release.id)
      toast.success(`"${release.title}" by ${release.artist} has been deleted successfully`)
    } catch (error) {
      console.error('Error deleting release:', error)
      // Rollback optimistic update on error
      loadData()
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast.error(`Failed to delete release: ${errorMessage}`)
    }
  }

  const releasesWithTrackCounts = releases.map(release => {
    const trackCount = tracks.filter(track => track.release_id === release.id).length
    const splits = releaseSplits.filter(split => split.release_id === release.id)
    const splitsTotal = splits.reduce((sum, split) => sum + split.percentage, 0)
    const splitsValid = Math.abs(splitsTotal - 100) < 0.01
    
    return {
      ...release,
      trackCount,
      splitsConfigured: splits.length > 0,
      splitsValid,
      splitsTotal,
    }
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Releases</h1>
          <p className="text-muted-foreground">
            Manage albums, EPs, and singles with their royalty splits
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Release
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Releases</CardTitle>
          <CardDescription>
            Your catalog of music releases and their track counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {releases.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-muted-foreground">
                <Music className="h-12 w-12" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">No releases yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get started by adding your first music release.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Release
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>UPC</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead className="text-center">Tracks</TableHead>
                  <TableHead className="text-center">Splits</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {releasesWithTrackCounts.map((release) => (
                  <TableRow key={release.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{release.title}</div>
                        <div className="text-sm text-muted-foreground">ID: {release.id}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{release.artist}</TableCell>
                    <TableCell>
                      <span className="capitalize">{release.release_type}</span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {release.upc || '—'}
                    </TableCell>
                    <TableCell>
                      {release.release_date 
                        ? new Date(release.release_date).toLocaleDateString()
                        : '—'
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {release.trackCount} track{release.trackCount !== 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {release.splitsConfigured ? (
                        release.splitsValid ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Valid (100%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ⚠ Invalid ({release.splitsTotal.toFixed(1)}%)
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Not configured
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/releases/${release.id}`}>View</Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingRelease(release)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteRelease(release)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <AddReleaseDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onReleaseAdded={handleReleaseAdded}
      />
      
      <EditReleaseDialog
        release={editingRelease}
        open={!!editingRelease}
        onOpenChange={(open) => !open && setEditingRelease(null)}
        onReleaseUpdated={handleReleaseUpdated}
      />
    </div>
  )
}