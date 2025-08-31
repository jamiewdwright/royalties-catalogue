import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { dataService } from '@/lib/data-service'
import { Release, Track } from '@/types'
import { Disc3, Search, Music, ExternalLink, Plus, AlertTriangle } from 'lucide-react'
import { AddTrackDialog } from '@/components/AddTrackDialog'

/**
 * TRACKS PAGE COMPONENT
 * 
 * This page displays all tracks across all releases in a unified table view.
 * Features:
 * - Search and filter tracks by title, release, or artist
 * - Filter by release type (single, ep, album)
 * - Shows track details with parent release information
 * - Links to track splits management and release detail pages
 * - Displays split inheritance information
 */

export function Tracks() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [releaseTypeFilter, setReleaseTypeFilter] = useState<string>('all')
  const [addTrackDialogOpen, setAddTrackDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [tracksData, releasesData] = await Promise.all([
        dataService.tracks.getAll(),
        dataService.releases.getAll(),
      ])
      
      setTracks(tracksData)
      setReleases(releasesData)
    } catch (error) {
      console.error('Error loading tracks data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTrackAdded = (newTrack?: Track) => {
    if (newTrack) {
      // Optimistic update - add new track immediately without full reload
      setTracks(prev => [...prev, newTrack])
    } else {
      // Fallback to full reload if no track data provided
      loadData()
    }
  }

  // Combine tracks with release information
  const tracksWithReleases = tracks.map(track => ({
    ...track,
    release: releases.find(r => r.id === track.release_id)
  }))

  // Filter tracks based on search and release type
  const filteredTracks = tracksWithReleases.filter(track => {
    const matchesSearch = searchTerm === '' || 
      track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.release?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.release?.artist.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesReleaseType = releaseTypeFilter === 'all' || 
      track.release?.release_type === releaseTypeFilter
    
    return matchesSearch && matchesReleaseType
  })

  // Sort tracks by release date (newest first) and then by track number
  const sortedTracks = filteredTracks.sort((a, b) => {
    // First sort by release date (newest first)
    const dateA = new Date(a.release?.release_date || a.release?.created_at || 0)
    const dateB = new Date(b.release?.release_date || b.release?.created_at || 0)
    if (dateB.getTime() !== dateA.getTime()) {
      return dateB.getTime() - dateA.getTime()
    }
    
    // Then by track number within the same release
    return a.track_number - b.track_number
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tracks</h1>
          <p className="text-muted-foreground">
            All tracks across your music catalogue
          </p>
        </div>
        <Button onClick={() => setAddTrackDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Track
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tracks, releases, or artists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={releaseTypeFilter} onValueChange={setReleaseTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Release Types</SelectItem>
                <SelectItem value="single">Singles</SelectItem>
                <SelectItem value="ep">EPs</SelectItem>
                <SelectItem value="album">Albums</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tracks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Disc3 className="h-5 w-5" />
            All Tracks ({sortedTracks.length})
          </CardTitle>
          <CardDescription>
            Complete list of tracks in your catalogue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedTracks.length === 0 ? (
            <div className="text-center py-12">
              <Music className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-foreground">No tracks found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchTerm || releaseTypeFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Start by creating your first release with tracks.'
                }
              </p>
              {!searchTerm && releaseTypeFilter === 'all' && (
                <div className="mt-6">
                  <Button asChild>
                    <Link to="/releases">Go to Releases</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Track</TableHead>
                  <TableHead>Release</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">ISRC</TableHead>
                  <TableHead className="text-center">Splits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTracks.map((track) => (
                  <TableRow key={track.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{track.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Track #{track.track_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {track.release ? (
                        <div>
                          <div className="font-medium">{track.release.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {track.release.release_date 
                              ? new Date(track.release.release_date).getFullYear()
                              : '—'
                            }
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Standalone
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {track.release?.artist || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                        {track.release?.release_type || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {track.isrc || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          track.use_release_splits
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {track.use_release_splits ? 'Release splits' : 'Custom splits'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {track.release ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/releases/${track.release_id}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Release
                            </Link>
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            No release assigned
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddTrackDialog
        open={addTrackDialogOpen}
        onOpenChange={setAddTrackDialogOpen}
        onTrackAdded={handleTrackAdded}
        availableReleases={releases}
        existingTracks={tracks}
      />
    </div>
  )
}