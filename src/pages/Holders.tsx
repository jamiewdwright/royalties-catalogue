import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { AddHolderDialog } from '@/components/AddHolderDialog'
import { dataService } from '@/lib/data-service'
import { formatCurrency } from '@/lib/constants'
import { Holder, HolderBalance } from '@/types'

export function Holders() {
  const [holders, setHolders] = useState<Holder[]>([])
  const [balances, setBalances] = useState<HolderBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [holdersData, balancesData] = await Promise.all([
        dataService.holders.getAll(),
        dataService.holders.getBalances(),
      ])
      setHolders(holdersData)
      setBalances(balancesData)
    } catch (error) {
      console.error('Error loading holders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleHolderAdded = () => {
    loadData()
  }

  const holdersWithBalances = holders.map(holder => {
    const balance = balances.find(b => b.holder_id === holder.id)
    return { ...holder, balance }
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Royalty Holders</h1>
          <p className="text-muted-foreground">
            Manage royalty recipients and their payment details
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Royalty Holder
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Holders</CardTitle>
          <CardDescription>
            List of all royalty holders with their current balances and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {holders.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.196-2.196M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-2.196M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No holders yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Get started by adding your first royalty holder.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Holder
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Banking Details</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdersWithBalances.map((holder) => (
                  <TableRow key={holder.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{holder.name}</div>
                        <div className="text-sm text-muted-foreground">ID: {holder.id}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {holder.email || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {holder.sort_code && holder.account_number ? (
                        <div className="font-mono text-sm">
                          <div>{holder.sort_code}</div>
                          <div>{holder.account_number}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {holder.vat_registered ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          VAT Reg
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {holder.balance ? (
                        <span className={holder.balance.owed >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(holder.balance.owed)}
                        </span>
                      ) : (
                        '£0.00'
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {holder.balance && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            holder.balance.status === 'payable'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {holder.balance.status === 'payable' ? 'Payable' : 'Below threshold'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {holder.balance ? formatCurrency(holder.balance.threshold) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/royalty-holders/${holder.id}`}>Details</Link>
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

      <AddHolderDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onHolderAdded={handleHolderAdded}
      />
    </div>
  )
}