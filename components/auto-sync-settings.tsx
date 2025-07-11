"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Clock, Zap, RefreshCw, Bell, CheckCircle, AlertTriangle } from "lucide-react"

export function AutoSyncSettings() {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false)
  const [syncInterval, setSyncInterval] = useState("60")
  const [lastSync, setLastSync] = useState<Date | null>(null)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <CardTitle>Auto-Sync Settings</CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Coming Soon
            </Badge>
          </div>
          <CardDescription>Automatically fetch new leads from Facebook at regular intervals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-sync">Enable Auto-Sync</Label>
              <p className="text-sm text-muted-foreground">Automatically fetch new leads every few minutes</p>
            </div>
            <Switch
              id="auto-sync"
              checked={autoSyncEnabled}
              onCheckedChange={setAutoSyncEnabled}
              disabled={true} // Disabled for now
            />
          </div>

          {autoSyncEnabled && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <Label htmlFor="sync-interval">Sync Interval</Label>
                <Select value={syncInterval} onValueChange={setSyncInterval}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every 1 hour</SelectItem>
                    <SelectItem value="120">Every 2 hours</SelectItem>
                    <SelectItem value="360">Every 6 hours</SelectItem>
                    <SelectItem value="720">Every 12 hours</SelectItem>
                    <SelectItem value="1440">Every 24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Clock className="w-4 h-4" />
                <span>Next sync in: 45 minutes</span>
              </div>

              {lastSync && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span>Last sync: {lastSync.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Auto-sync requires a server-side cron job or webhook setup. This feature is not yet
              implemented but can be added.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <CardTitle>Real-time Webhooks</CardTitle>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Advanced
            </Badge>
          </div>
          <CardDescription>Get instant notifications when new leads are submitted</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-2">Facebook Webhooks Setup:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
              <li>Go to Facebook App Dashboard → Webhooks</li>
              <li>Subscribe to "leadgen" events</li>
              <li>
                Set webhook URL to:{" "}
                <code className="bg-white px-2 py-1 rounded">your-domain.com/api/webhooks/facebook</code>
              </li>
              <li>Verify webhook with challenge token</li>
              <li>Leads will be pushed instantly to your system</li>
            </ol>
          </div>

          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              Webhooks provide instant lead notifications but require additional setup and a public webhook endpoint.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
