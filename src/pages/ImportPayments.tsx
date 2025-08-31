import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/constants'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Info, DollarSign, Plus } from 'lucide-react'

/**
 * IMPORT PAYMENTS PAGE COMPONENT
 * 
 * This page handles importing revenue data from various sources.
 * Features:
 * - File upload for CSV/Excel imports
 * - Manual payment entry form
 * - Data validation and preview
 * - Integration with common distribution platforms
 * 
 * Note: This is a placeholder implementation that will be enhanced
 * when the full import system is implemented.
 */

export function ImportPayments() {
  const [importMethod, setImportMethod] = useState<'file' | 'manual'>('file')
  const [isUploading, setIsUploading] = useState(false)

  // Mock recent imports data
  const recentImports = [
    {
      id: 'import-1',
      source: 'Spotify for Artists',
      filename: 'spotify-october-2024.csv',
      amount: 125000, // £1,250.00 in pence
      transaction_count: 45,
      status: 'completed',
      imported_at: '2024-11-01T10:30:00Z'
    },
    {
      id: 'import-2',
      source: 'Apple Music',
      filename: 'apple-music-sep-2024.xlsx',
      amount: 89000, // £890.00 in pence
      transaction_count: 32,
      status: 'completed',
      imported_at: '2024-10-15T14:20:00Z'
    },
    {
      id: 'import-3',
      source: 'Manual Entry',
      filename: 'Live Performance - London',
      amount: 50000, // £500.00 in pence
      transaction_count: 1,
      status: 'completed',
      imported_at: '2024-10-10T16:45:00Z'
    }
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)
      // Simulate file upload processing
      setTimeout(() => {
        setIsUploading(false)
        // Here you would normally process the file
      }, 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Payments</h1>
          <p className="text-muted-foreground">
            Import revenue data from distribution platforms or add manual entries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </div>
      </div>

      {/* Import Method Selection */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card 
          className={`cursor-pointer transition-all ${importMethod === 'file' ? 'ring-2 ring-primary' : 'hover:bg-accent/50'}`}
          onClick={() => setImportMethod('file')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5" />
              File Upload
            </CardTitle>
            <CardDescription>
              Import CSV or Excel files from distribution platforms
            </CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${importMethod === 'manual' ? 'ring-2 ring-primary' : 'hover:bg-accent/50'}`}
          onClick={() => setImportMethod('manual')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Manual Entry
            </CardTitle>
            <CardDescription>
              Add individual payments manually (concerts, sync licenses, etc.)
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* File Upload Method */}
      {importMethod === 'file' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload Revenue File
            </CardTitle>
            <CardDescription>
              Upload CSV or Excel files from Spotify, Apple Music, and other platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="platform">Platform/Source</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select revenue source..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spotify">Spotify for Artists</SelectItem>
                    <SelectItem value="apple">Apple Music</SelectItem>
                    <SelectItem value="youtube">YouTube Music</SelectItem>
                    <SelectItem value="bandcamp">Bandcamp</SelectItem>
                    <SelectItem value="other">Other/Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="file-upload">Revenue File</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">CSV, XLSX files up to 10MB</p>
                      </div>
                      <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">File Requirements:</p>
                    <ul className="mt-1 text-blue-700 list-disc list-inside space-y-1">
                      <li>File must contain columns: Date, Amount, Release/Track, Description</li>
                      <li>Amounts should be in your base currency (GBP)</li>
                      <li>Dates in YYYY-MM-DD format preferred</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button disabled={isUploading} className="w-full">
                {isUploading ? (
                  <>Processing Upload...</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Revenue Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Entry Method */}
      {importMethod === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Manual Payment Entry
            </CardTitle>
            <CardDescription>
              Add individual payments for live performances, sync licenses, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="payment-date">Payment Date</Label>
                <Input id="payment-date" type="date" />
              </div>
              
              <div>
                <Label htmlFor="amount">Amount (£)</Label>
                <Input id="amount" type="number" step="0.01" placeholder="0.00" />
              </div>
            </div>

            <div>
              <Label htmlFor="source">Revenue Source</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select revenue type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concert">Live Performance</SelectItem>
                  <SelectItem value="sync">Sync License</SelectItem>
                  <SelectItem value="mechanical">Mechanical Royalties</SelectItem>
                  <SelectItem value="performance">Performance Royalties</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="release">Related Release (Optional)</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select release..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="release-1">Midnight Dreams</SelectItem>
                  <SelectItem value="release-2">Electric Horizons</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Concert at O2 Arena, London - November 2024"
                rows={3}
              />
            </div>

            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Imports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Imports</CardTitle>
          <CardDescription>
            History of imported revenue data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentImports.map((importItem) => (
              <div 
                key={importItem.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">{importItem.filename}</div>
                    <div className="text-sm text-muted-foreground">
                      {importItem.source} • {new Date(importItem.imported_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-mono font-medium">
                    {formatCurrency(importItem.amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {importItem.transaction_count} transactions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}