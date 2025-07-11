"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Clock, RefreshCw, Bell, Calendar } from "lucide-react"

export function ManualSyncReminder() {
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [timeSinceLastFetch, setTimeSinceLastFetch] = useState<string>("")

  useEffect(() => {
    // Get last fetch time from localStorage
    const stored = localStorage.getItem("lastLeadsFetch")
    if (stored) {
      setLastFetch(new Date(stored))
    }

    // Update time since last fetch every minute
    const interval = setInterval(() => {
      if (lastFetch) {
        const now = new Date()
        const diff = now.getTime() - lastFetch.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

        if (hours > 0) {
          setTimeSinceLastFetch(`${hours}h ${minutes}m ago`)
        } else {
          setTimeSinceLastFetch(`${minutes}m ago`)
        }
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [lastFetch])

  const handleFetchReminder = () => {
    // Navigate to fetch tab
    const fetchTab = document.querySelector('[value="fetch"]') as HTMLElement
    fetchTab?.click()
  }

  const shouldShowReminder = lastFetch && Date.now() - lastFetch.getTime() > 2 * 60 * 60 * 1000 // 2 hours

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <CardTitle>Sync Status</CardTitle>
            </div>
            {lastFetch && (
              <Badge variant="outline" className="text-xs">
                Last fetch: {timeSinceLastFetch}
              </Badge>
            )}
          </div>
          <CardDescription>Keep track of when you last fetched leads from Facebook</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!lastFetch ? (
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                You haven't fetched any leads yet. Click "Fetch Leads" to get started.
              </AlertDescription>
            </Alert>
          ) : shouldShowReminder ? (
            <Alert className="border-orange-200 bg-orange-50">
              <RefreshCw className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Reminder:</strong> It's been {timeSinceLastFetch} since your last fetch. New leads might be
                waiting!
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-200 bg-green-50">
              <Clock className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Last fetch was {timeSinceLastFetch}. You're up to date!
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={handleFetchReminder} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Fetch New Leads
            </Button>
            <Button onClick={() => setLastFetch(new Date())} variant="ghost" size="sm" className="text-xs">
              Mark as Checked
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <CardTitle>Recommended Sync Schedule</CardTitle>
          </div>
          <CardDescription>How often you should check for new leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-1">High Volume</h4>
              <p className="text-sm text-blue-800">Every 30 minutes</p>
              <p className="text-xs text-blue-700 mt-1">For active campaigns</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-1">Medium Volume</h4>
              <p className="text-sm text-green-800">Every 2-4 hours</p>
              <p className="text-xs text-green-700 mt-1">For regular campaigns</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-1">Low Volume</h4>
              <p className="text-sm text-purple-800">Once daily</p>
              <p className="text-xs text-purple-700 mt-1">For occasional campaigns</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
