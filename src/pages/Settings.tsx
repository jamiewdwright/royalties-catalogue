import { Settings as SettingsIcon, Palette, Type } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useTheme } from '@/components/ThemeProvider'

export function Settings() {
  const { theme, setTheme, themes, font, setFont, fonts } = useTheme()

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
                    <SelectItem key={fontOption.name} value={fontOption.name} className="h-auto py-4">
                      <div className="flex items-start gap-3 w-full">
                        <span 
                          className="font-medium text-lg mt-1"
                          style={{ fontFamily: fontOption.fontFamily }}
                        >
                        </span>
                        <div className="flex flex-col flex-1 min-h-[60px] justify-center">
                          <span className="font-medium">{fontOption.displayName}</span>
                          <span className="text-xs text-muted-foreground leading-relaxed">{fontOption.description}</span>
                          <div 
                            className="text-xs text-muted-foreground mt-1.5 leading-relaxed"
                            style={{ fontFamily: fontOption.fontFamily }}
                          >
                          </div>
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
            <CardTitle>Workspace Configuration</CardTitle>
            <CardDescription>
              Manage workspace-specific settings and defaults
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <SettingsIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Configuration Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                Workspace configuration options will be available in a future update.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}