import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Palette, Type, Cog } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'
import { WorkspaceSettingsDialog } from '@/components/WorkspaceSettingsDialog'
import { dataService } from '@/lib/data-service'
import { formatCurrency } from '@/lib/constants'
import { WorkspaceSettings } from '@/types'

export function Settings() {
  const { theme, setTheme, themes, font, setFont, fonts } = useTheme()
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings | null>(null)
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkspaceSettings()
  }, [])

  const loadWorkspaceSettings = async () => {
    try {
      const settings = await dataService.settings.get()
      setWorkspaceSettings(settings)
    } catch (error) {
      console.error('Error loading workspace settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWorkspaceSettingsUpdated = () => {
    loadWorkspaceSettings()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application preferences and configuration
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme Selection
            </CardTitle>
            <CardDescription>
              Choose your preferred color theme for the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="theme-select">Select Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((themeOption) => (
                    <SelectItem key={themeOption.name} value={themeOption.name} className="h-auto py-3">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex gap-1">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: `hsl(${themeOption.colors.primary})` }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: `hsl(${themeOption.colors.secondary})` }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: `hsl(${themeOption.colors.accent})` }}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{themeOption.displayName}</span>
                          <span className="text-xs text-muted-foreground">{themeOption.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Font Selection
            </CardTitle>
            <CardDescription>
              Choose your preferred font family for the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="font-select">Select Font</Label>
              <Select value={font} onValueChange={setFont}>
                <SelectTrigger id="font-select" className="w-full">
                  <div className="flex items-center gap-3">
                    <span 
                      className="font-medium text-lg"
                      style={{ fontFamily: fonts.find(f => f.name === font)?.fontFamily || 'Inter, sans-serif' }}
                    >
                      Aa
                    </span>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {fonts.map((fontOption) => (
                    <SelectItem key={fontOption.name} value={fontOption.name} className="h-auto py-3">
                      <div className="flex items-center gap-3 w-full">
                        <span 
                          className="font-medium text-lg"
                          style={{ fontFamily: fontOption.fontFamily }}
                        >
                          Aa
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium">{fontOption.displayName}</span>
                          <span className="text-xs text-muted-foreground">{fontOption.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Application Settings
            </CardTitle>
            <CardDescription>
              Additional application settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <SettingsIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">More Settings Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                Additional application settings will be available in a future update.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog className="h-5 w-5" />
              Workspace Configuration
            </CardTitle>
            <CardDescription>
              Manage workspace-specific settings and defaults
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading settings...</div>
              </div>
            ) : workspaceSettings ? (
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <h4 className="font-medium">Base Currency</h4>
                      <p className="text-sm text-muted-foreground">
                        Default currency for all transactions and payouts
                      </p>
                    </div>
                    <div className="font-mono text-lg">
                      {workspaceSettings.base_currency}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <h4 className="font-medium">Minimum Payout Threshold</h4>
                      <p className="text-sm text-muted-foreground">
                        Default minimum amount before holders become eligible for payout
                      </p>
                    </div>
                    <div className="font-mono text-lg">
                      {formatCurrency(workspaceSettings.min_payout_minor)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <h4 className="font-medium">Last Updated</h4>
                      <p className="text-sm text-muted-foreground">
                        When these settings were last modified
                      </p>
                    </div>
                    <div className="text-sm">
                      {new Date(workspaceSettings.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button onClick={() => setShowWorkspaceDialog(true)}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Edit Workspace Settings
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <SettingsIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Failed to Load Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Unable to load workspace configuration.
                </p>
                <Button onClick={loadWorkspaceSettings}>
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <WorkspaceSettingsDialog
        open={showWorkspaceDialog}
        onOpenChange={setShowWorkspaceDialog}
        onSettingsUpdated={handleWorkspaceSettingsUpdated}
      />
    </div>
  )
}