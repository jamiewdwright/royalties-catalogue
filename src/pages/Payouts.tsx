import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/constants'
import { CreditCard, Plus, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react'

/**
 * PAYOUTS PAGE COMPONENT
 * 
 * This page manages payout batches and payment processing.
 * Features:
 * - View payout batch history
 * - Create new payout runs
 * - Track payment status and processing
 * - Export payment reports
 * 
 * Note: This is a placeholder implementation that will be enhanced
 * when the full payout system is implemented.
 */

export function Payouts() {
  // Mock payout data - this will be replaced with real data service calls
  const mockPayouts = [
    {
      id: 'batch-1',
      description: 'Q4 2024 Royalty Payments',
      batch_date: '2024-12-15',
      total_amount: 125000, // £1,250.00 in pence
      status: 'paid',
      recipient_count: 12,
      created_at: '2024-12-10T10:00:00Z'
    },
    {
      id: 'batch-2', 
      description: 'November 2024 Streaming Revenue',
      batch_date: '2024-11-30',
      total_amount: 85000, // £850.00 in pence
      status: 'processing',
      recipient_count: 8,
      created_at: '2024-11-25T14:30:00Z'
    },
    {
      id: 'batch-3',
      description: 'October 2024 Performance Royalties',
      batch_date: '2024-10-31',
      total_amount: 67500, // £675.00 in pence
      status: 'draft',
      recipient_count: 15,
      created_at: '2024-10-28T09:15:00Z'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-gray-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
          <p className="text-muted-foreground">
            Manage royalty payment batches and track payment status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Payout Run
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(125000)}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(85000)}
            </div>
            <p className="text-xs text-muted-foreground">8 recipients</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {formatCurrency(67500)}
            </div>
            <p className="text-xs text-muted-foreground">15 recipients</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Batches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payout Batches
          </CardTitle>
          <CardDescription>
            History of royalty payment runs and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPayouts.map((payout) => (
              <div 
                key={payout.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(payout.status)}
                  <div>
                    <div className="font-medium">{payout.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(payout.batch_date).toLocaleDateString()} • {payout.recipient_count} recipients
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono font-medium">
                      {formatCurrency(payout.total_amount)}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(payout.status)}`}>
                      {payout.status}
                    </span>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started with Payouts</CardTitle>
          <CardDescription>
            Learn how to process royalty payments efficiently
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">1. Review Outstanding Balances</h4>
              <p className="text-sm text-muted-foreground">
                Check which holders have earned amounts above their payout thresholds.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Create Payout Batch</h4>
              <p className="text-sm text-muted-foreground">
                Group payments together for efficient processing and record keeping.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">3. Export Payment Data</h4>
              <p className="text-sm text-muted-foreground">
                Generate CSV files for your banking system or accounting software.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">4. Process & Track</h4>
              <p className="text-sm text-muted-foreground">
                Mark payments as sent and track their status until completion.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}