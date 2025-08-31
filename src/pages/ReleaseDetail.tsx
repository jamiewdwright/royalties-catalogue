import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Music2, Settings, Users, TrendingUp, DollarSign, BarChart3, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ReleaseSplitsDialog } from '@/components/ReleaseSplitsDialog'
import { TrackSplitsDialog } from '@/components/TrackSplitsDialog'
import { AddTrackDialog } from '@/components/AddTrackDialog'
import { dataService } from '@/lib/data-service'
import { formatPercentage, formatCurrency } from '@/lib/constants'
import { 
  TimePeriod, 
  getDateRange, 
  getTimePeriodLabel, 
  calculateReleasePerformance 
} from '@/lib/analytics'
import { Release, Track, Holder, ReleaseSplit, Transaction } from '@/types'

export function ReleaseDetail() {
  const { id } = useParams<{ id: string }>()
  const [release, setRelease] = useState<Release | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [holders, setHolders] = useState<Holder[]>([])
  const [releaseSplits, setReleaseSplits] = useState<ReleaseSplit[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d')
  const [loading, setLoading] = useState(true)
  const [showSplitsDialog, setShowSplitsDialog] = useState(false)
  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false)
  const [editingTrack, setEditingTrack] = useState<Track | null>(null)

  useEffect(() => {
    loadData()
  }, [id, timePeriod])

  const loadData = async () => {
    if (!id) return

    try {
      const { startDate, endDate } = getDateRange(timePeriod)
      
      const [releaseData, tracksData, holdersData, splitsData, allTransactions] = await Promise.all([
        dataService.releases.getById(id),
        dataService.tracks.getByReleaseId(id),
        dataService.holders.getAll(),
        dataService.releaseSplits.getByReleaseId(id),
        dataService.transactions.getByDateRange(startDate, endDate),
      ])

      // Filter transactions that belong to this release or its tracks
      const trackIds = tracksData.map(track => track.id)
      const releaseTransactions = allTransactions.filter(transaction => 
        transaction.release_id === id || (transaction.track_id && trackIds.includes(transaction.track_id))
      )

      setRelease(releaseData)
      setTracks(tracksData)
      setHolders(holdersData)
      setReleaseSplits(splitsData)
      setTransactions(releaseTransactions)
    } catch (error) {
      console.error('Error loading release data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSplitsUpdated = () => {
    // Reload only the splits data when updated
    if (id) {
      dataService.releaseSplits.getByReleaseId(id)
        .then(setReleaseSplits)
        .catch(error => console.error('Error reloading splits:', error))
    }
  }

  const handleTrackUpdated = () => {
    // Reload tracks data when track splits are updated
    if (id) {
      dataService.tracks.getByReleaseId(id)
        .then(setTracks)
        .catch(error => console.error('Error reloading tracks:', error))
    }
  }

  const handleTrackAdded = () => {
    // Reload tracks data when a new track is added
    if (id) {
      dataService.tracks.getByReleaseId(id)
        .then(setTracks)
        .catch(error => console.error('Error reloading tracks:', error))
    }
  }

  const splitsWithHolders = releaseSplits.map(split => ({
    ...split,
    holder: holders.find(h => h.id === split.holder_id),
  }))

  const totalPercentage = releaseSplits.reduce((sum, split) => sum + split.percentage, 0)

  // Calculate performance metrics for this release
  const revenueTransactions = transactions.filter(t => t.type === 'revenue')
  const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0)
  const transactionCount = revenueTransactions.length
  const averageRevenue = transactionCount > 0 ? totalRevenue / transactionCount : 0

  // Find the track associated with each transaction for display
  const transactionsWithDetails = transactions.map(transaction => ({
    ...transaction,
    track: transaction.track_id ? tracks.find(t => t.id === transaction.track_id) : null
  }))

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
      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-4">
          <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">This Week</SelectItem>
              <SelectItem value="30d">This Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="12m">12 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{getTimePeriodLabel(timePeriod)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactionCount}</div>
            <p className="text-xs text-muted-foreground">Revenue transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageRevenue)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
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
                  <Button 
                    className="mt-4" 
                    onClick={() => setShowAddTrackDialog(true)}
                  >
                    Add First Track
                  </Button>
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingTrack(track)}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Edit Splits
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                Revenue transactions for {getTimePeriodLabel(timePeriod).toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsWithDetails.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No transactions</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No revenue transactions found for this time period.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsWithDetails
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-sm">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              {transaction.track && (
                                <div className="text-sm text-muted-foreground">
                                  Track: {transaction.track.title}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'revenue' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type === 'revenue' ? 'Revenue' : 'Payout'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(transaction.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {transaction.reference || '—'}
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
                <Button size="sm" onClick={() => setShowSplitsDialog(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Edit Splits
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {releaseSplits.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No splits configured</p>
                  <Button size="sm" onClick={() => setShowSplitsDialog(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    Add Splits
                  </Button>
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
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono ${
                            Math.abs(totalPercentage - 100) < 0.01
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatPercentage(totalPercentage)}
                        </span>
                        {Math.abs(totalPercentage - 100) < 0.01 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ⚠ Invalid
                          </span>
                        )}
                      </div>
                    </div>
                    {Math.abs(totalPercentage - 100) > 0.01 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-full bg-red-100 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-red-600 whitespace-nowrap">
                          {totalPercentage > 100 ? `+${(totalPercentage - 100).toFixed(1)}%` : `${(100 - totalPercentage).toFixed(1)}% missing`}
                        </span>
                      </div>
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
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setShowAddTrackDialog(true)}
              >
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
      
      <ReleaseSplitsDialog
        release={release}
        open={showSplitsDialog}
        onOpenChange={setShowSplitsDialog}
        onSplitsUpdated={handleSplitsUpdated}
      />
      
      <TrackSplitsDialog
        track={editingTrack}
        open={!!editingTrack}
        onOpenChange={(open) => !open && setEditingTrack(null)}
        onTrackUpdated={handleTrackUpdated}
      />
      
      <AddTrackDialog
        release={release}
        open={showAddTrackDialog}
        onOpenChange={setShowAddTrackDialog}
        onTrackAdded={handleTrackAdded}
      />
    </div>
  )
}