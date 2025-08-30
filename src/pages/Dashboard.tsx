import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { dataService } from '@/lib/data-service'
import { formatCurrency, formatPercentage } from '@/lib/constants'
import { 
  TimePeriod, 
  ReleasePerformance, 
  getDateRange, 
  getTimePeriodLabel, 
  calculateReleasePerformance, 
  getOverallStats 
} from '@/lib/analytics'
import { Release, Track, Transaction } from '@/types'
import { Music, TrendingUp, DollarSign, BarChart3 } from 'lucide-react'

/**
 * DASHBOARD PAGE COMPONENT
 * 
 * The main dashboard shows release performance analytics with time filtering.
 * Features:
 * - Time period selector (This Week, This Month, 3/6/12 months, All Time)
 * - Key metrics cards (Total Revenue, Transactions, Average Revenue, Total Releases)
 * - Top performing releases table with revenue share analysis
 * - Quick actions for navigation to other sections
 * - Period summary with revenue/payout breakdown
 * 
 * Data Flow:
 * 1. Load releases, tracks, and transactions for selected time period
 * 2. Calculate performance metrics using analytics utilities
 * 3. Display sorted list of releases by revenue performance
 */
export function Dashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d')
  const [releases, setReleases] = useState<Release[]>([])
  const [tracks, setTracks] = useState<Track[]>([])  // @ts-ignore - Used by calculateReleasePerformance
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [releasePerformance, setReleasePerformance] = useState<ReleasePerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const { startDate, endDate } = getDateRange(timePeriod)
        
        const [releasesData, tracksData, transactionsData] = await Promise.all([
          dataService.releases.getAll(),
          dataService.tracks.getAll(),
          dataService.transactions.getByDateRange(startDate, endDate),
        ])
        
        setReleases(releasesData)
        setTracks(tracksData)
        setTransactions(transactionsData)
        
        const performance = calculateReleasePerformance(releasesData, tracksData, transactionsData)
        setReleasePerformance(performance)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [timePeriod])

  const stats = getOverallStats(transactions, releases)

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Release performance and revenue insights
          </p>
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{getTimePeriodLabel(timePeriod)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Revenue transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.averageRevenue)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Releases</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReleases}</div>
            <p className="text-xs text-muted-foreground">In catalog</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Releases</CardTitle>
          <CardDescription>
            Highest earning releases in {getTimePeriodLabel(timePeriod).toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {releasePerformance.length === 0 ? (
            <div className="text-center py-12">
              <Music className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-foreground">No revenue data</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No revenue transactions found for the selected time period.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link to="/releases">View Releases</Link>
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Release</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Tracks</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {releasePerformance.slice(0, 10).map((performance) => (
                  <TableRow key={performance.release.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{performance.release.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {performance.release.release_date 
                            ? new Date(performance.release.release_date).getFullYear()
                            : '—'
                          }
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{performance.release.artist}</TableCell>
                    <TableCell>
                      <span className="capitalize">{performance.release.release_type}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {performance.trackCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(performance.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${
                        performance.revenueShare > 50 ? 'text-green-600' : 
                        performance.revenueShare > 20 ? 'text-blue-600' : 
                        'text-gray-600'
                      }`}>
                        {formatPercentage(performance.revenueShare)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {performance.transactionCount}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/releases/${performance.release.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {releasePerformance.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild className="justify-start">
                <Link to="/royalty-holders">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Manage Royalty Holders
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/releases">
                  <Music className="mr-2 h-4 w-4" />
                  View All Releases
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Period Summary</CardTitle>
              <CardDescription>{getTimePeriodLabel(timePeriod)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Revenue:</span>
                <span className="font-mono font-medium">{formatCurrency(stats.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Payouts:</span>
                <span className="font-mono font-medium">{formatCurrency(stats.totalPayouts)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Net Balance:</span>
                <span className={`font-mono font-medium ${
                  stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(stats.netBalance)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}