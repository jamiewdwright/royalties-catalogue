import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Music2, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { dataService } from '@/lib/data-service'
import { formatPercentage } from '@/lib/constants'
import { Release, Track, Holder, ReleaseSplit } from '@/types'

export function ReleaseDetail() {
  const { id } = useParams<{ id: string }>()
  const [release, setRelease] = useState<Release | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [holders, setHolders] = useState<Holder[]>([])
  const [releaseSplits, setReleaseSplits] = useState<ReleaseSplit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!id) return

      try {
        const [releaseData, tracksData, holdersData, splitsData] = await Promise.all([
          dataService.releases.getById(id),
          dataService.tracks.getByReleaseId(id),
          dataService.holders.getAll(),
          dataService.releaseSplits.getByReleaseId(id),
        ])

        setRelease(releaseData)
        setTracks(tracksData)
        setHolders(holdersData)
        setReleaseSplits(splitsData)
      } catch (error) {
        console.error('Error loading release data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const splitsWithHolders = releaseSplits.map(split => ({
    ...split,
    holder: holders.find(h => h.id === split.holder_id),
  }))

  const totalPercentage = releaseSplits.reduce((sum, split) => sum + split.percentage, 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!release) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Release not found</h2>
        <Button className="mt-4" asChild>
          <Link to="/releases">Back to Releases</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/releases">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{release.title}</h1>
          <p className="text-muted-foreground">by {release.artist}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Release Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Title</label>
                  <p className="mt-1">{release.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Artist</label>
                  <p className="mt-1">{release.artist}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="mt-1 capitalize">{release.release_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Release Date</label>
                  <p className="mt-1">
                    {release.release_date 
                      ? new Date(release.release_date).toLocaleDateString()
                      : '—'
                    }
                  </p>
                </div>
              </div>
              {release.upc && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">UPC</label>
                  <p className="mt-1 font-mono">{release.upc}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracks</CardTitle>
              <CardDescription>
                {tracks.length} track{tracks.length !== 1 ? 's' : ''} in this release
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tracks.length === 0 ? (
                <div className="text-center py-8">
                  <Music2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium">No tracks yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add tracks to this release to get started.
                  </p>
                  <Button className="mt-4">Add First Track</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>ISRC</TableHead>
                      <TableHead className="text-center">Splits</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tracks
                      .sort((a, b) => a.track_number - b.track_number)
                      .map((track) => (
                        <TableRow key={track.id}>
                          <TableCell className="font-mono text-sm">
                            {track.track_number}
                          </TableCell>
                          <TableCell className="font-medium">{track.title}</TableCell>
                          <TableCell className="font-mono text-sm">
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
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Release Splits</CardTitle>
                  <CardDescription>Royalty distribution for this release</CardDescription>
                </div>
                <Button size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {releaseSplits.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No splits configured</p>
                  <Button size="sm">Add Splits</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {splitsWithHolders.map((split) => (
                    <div key={split.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{split.holder?.name || 'Unknown Holder'}</p>
                        <p className="text-sm text-muted-foreground">ID: {split.holder_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-medium">
                          {formatPercentage(split.percentage)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between font-medium">
                      <span>Total</span>
                      <span
                        className={`font-mono ${
                          Math.abs(totalPercentage - 100) < 0.01
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatPercentage(totalPercentage)}
                      </span>
                    </div>
                    {Math.abs(totalPercentage - 100) > 0.01 && (
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ Splits must sum to 100%
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                Add Track
              </Button>
              <Button className="w-full" variant="outline">
                Apply Splits to All Tracks
              </Button>
              <Button className="w-full" variant="outline">
                Edit Release Info
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}