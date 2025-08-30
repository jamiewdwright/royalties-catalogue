import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Music } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { dataService } from '@/lib/data-service'
import { Release, Track } from '@/types'

export function Releases() {
  const [releases, setReleases] = useState<Release[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [releasesData, tracksData] = await Promise.all([
          dataService.releases.getAll(),
          dataService.tracks.getAll(),
        ])
        setReleases(releasesData)
        setTracks(tracksData)
      } catch (error) {
        console.error('Error loading releases:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const releasesWithTrackCounts = releases.map(release => ({
    ...release,
    trackCount: tracks.filter(track => track.release_id === release.id).length,
  }))

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
        <Button>
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
                <Button>
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
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/releases/${release.id}`}>View</Link>
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
    </div>
  )
}