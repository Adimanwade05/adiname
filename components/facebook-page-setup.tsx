"use client"

import { useActionState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { setupFacebookPage } from "@/app/actions/facebook-leads"
import { Facebook, Settings, CheckCircle, AlertCircle, Zap } from "lucide-react"

export function FacebookPageSetup() {
  const [state, action, isPending] = useActionState(setupFacebookPage, {})

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Facebook className="w-5 h-5 text-blue-600" />
          <CardTitle>Facebook Page Setup</CardTitle>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            One-time Setup
          </Badge>
        </div>
        <CardDescription>
          Configure your Facebook page once and leads will be automatically fetched in the background
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pageAccessToken">Page Access Token *</Label>
              <Input
                id="pageAccessToken"
                name="pageAccessToken"
                type="password"
                placeholder="Enter your page access token"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageId">Page ID *</Label>
              <Input
                id="pageId"
                name="pageId"
                placeholder="Enter your Facebook Page ID"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageName">Page Name (Optional)</Label>
              <Input id="pageName" name="pageName" placeholder="Enter page name for reference" disabled={isPending} />
            </div>
          </div>

          <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-green-900">Auto-Sync Settings</h3>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoSyncEnabled">Enable Auto-Sync</Label>
                <p className="text-sm text-green-700">Automatically fetch new leads in the background</p>
              </div>
              <Switch id="autoSyncEnabled" name="autoSyncEnabled" defaultChecked disabled={isPending} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="syncInterval">Sync Interval</Label>
              <Select name="syncInterval" defaultValue="30" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes (Recommended)</SelectItem>
                  <SelectItem value="60">Every 1 hour</SelectItem>
                  <SelectItem value="120">Every 2 hours</SelectItem>
                  <SelectItem value="360">Every 6 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Success!</strong> {state.message}
                <br />
                <span className="text-sm">
                  Your leads will now be automatically fetched every {state.pageConfig?.sync_interval_minutes || 30}{" "}
                  minutes.
                </span>
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                Setting up Facebook Page...
              </>
            ) : (
              <>
                <Facebook className="w-4 h-4 mr-2" />
                Setup Facebook Page
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">✨ What happens after setup:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>Initial leads are fetched immediately</li>
            <li>Auto-sync runs in the background every 30 minutes</li>
            <li>New leads appear automatically in your leads table</li>
            <li>No need to manually fetch leads anymore!</li>
            <li>You can view sync status and history</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
