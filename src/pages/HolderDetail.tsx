import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { dataService } from '@/lib/data-service'
import { formatCurrency } from '@/lib/constants'
import { Holder, HolderBalance, Transaction } from '@/types'

export function HolderDetail() {
  const { id } = useParams<{ id: string }>()
  const [holder, setHolder] = useState<Holder | null>(null)
  const [balance, setBalance] = useState<HolderBalance | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutDescription, setPayoutDescription] = useState('')
  const [submittingPayout, setSubmittingPayout] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!id) return

      try {
        const [holderData, balancesData, transactionsData] = await Promise.all([
          dataService.holders.getById(id),
          dataService.holders.getBalances(),
          dataService.transactions.getByHolderId(id),
        ])

        setHolder(holderData)
        setBalance(balancesData.find(b => b.holder_id === id) || null)
        setTransactions(transactionsData.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ))
      } catch (error) {
        console.error('Error loading holder data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!holder || !balance || submittingPayout) return

    const amount = parseFloat(payoutAmount)
    if (isNaN(amount) || amount <= 0) return

    const amountInMinor = Math.round(amount * 100)
    const canPayoutBelowThreshold = balance.status === 'below_threshold' && amountInMinor <= balance.owed

    setSubmittingPayout(true)

    try {
      await dataService.transactions.create({
        type: 'payout',
        amount: -amountInMinor,
        currency: 'GBP',
        description: payoutDescription || `Payout to ${holder.name}`,
        holder_id: holder.id,
        reference: `PAY-${Date.now()}`,
        created_by: 'admin',
      })

      setPayoutAmount('')
      setPayoutDescription('')

      const [updatedBalance, updatedTransactions] = await Promise.all([
        dataService.holders.getBalances(),
        dataService.transactions.getByHolderId(holder.id),
      ])

      setBalance(updatedBalance.find(b => b.holder_id === holder.id) || null)
      setTransactions(updatedTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ))
    } catch (error) {
      console.error('Error creating payout:', error)
    } finally {
      setSubmittingPayout(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!holder) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Holder not found</h2>
        <Button className="mt-4" asChild>
          <Link to="/holders">Back to Holders</Link>
        </Button>
      </div>
    )
  }

  const canMakePayout = balance && (
    balance.status === 'payable' || 
    (balance.owed > 0 && balance.status === 'below_threshold')
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/holders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{holder.name}</h1>
          <p className="text-muted-foreground">Holder details and transaction history</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="mt-1">{holder.name}</p>
              </div>
              {holder.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="mt-1">{holder.email}</p>
                </div>
              )}
              {holder.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="mt-1 whitespace-pre-line">{holder.address}</p>
                </div>
              )}
              {holder.payment_details && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Details</label>
                  <p className="mt-1">{holder.payment_details}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                All payouts made to this holder
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No transactions recorded for this holder
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {transaction.reference || '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <span className={transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                            {formatCurrency(transaction.amount)}
                          </span>
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
              <CardTitle>Current Balance</CardTitle>
              <CardDescription>Amount owed to this holder</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {balance ? formatCurrency(balance.owed) : '£0.00'}
              </div>
              {balance && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        balance.status === 'payable'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {balance.status === 'payable' ? 'Payable' : 'Below threshold'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Threshold: {formatCurrency(balance.threshold)}</p>
                    {holder.min_payout_override && (
                      <p className="text-xs mt-1">Custom threshold set for this holder</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Record Payout</CardTitle>
              <CardDescription>
                Record a payout made to this holder
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!canMakePayout ? (
                <div className="text-center py-4">
                  {balance?.owed === 0 ? (
                    <p className="text-muted-foreground">No balance to pay out</p>
                  ) : (
                    <p className="text-muted-foreground">
                      Balance below threshold. Use override to pay anyway.
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handlePayout} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Amount (£)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={balance ? Math.abs(balance.owed) / 100 : undefined}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description (optional)</label>
                    <Input
                      value={payoutDescription}
                      onChange={(e) => setPayoutDescription(e.target.value)}
                      placeholder={`Payout to ${holder.name}`}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submittingPayout}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    {submittingPayout ? 'Recording...' : 'Record Payout'}
                  </Button>
                  {balance?.status === 'below_threshold' && (
                    <p className="text-xs text-amber-600">
                      ⚠️ This payout is below the threshold and will create an advance
                    </p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}