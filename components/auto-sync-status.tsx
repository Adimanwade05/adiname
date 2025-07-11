"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getPageConfigs, getSyncJobs } from "@/app/actions/facebook-leads"
import { runAutoSync, toggleAutoSync } from "@/app/actions/auto-sync"
import { RefreshCw, CheckCircle, AlertCircle, Clock, Zap, Play, Pause } from "lucide-react"

interface PageConfig {
  id: number
  page_id: string
  page_name: string | null
  auto_sync_enabled: boolean
  sync_interval_minutes: number
  last_sync_at: string | null
  next_sync_at: string | null
  sync_status: string
  last_error: string | null
}

interface SyncJob {
  id: number
  job_status: string
  leads_fetched: number
  error_message: string | null
  started_at: string
  completed_at: string | null
  facebook_page_configs: {
    page_name: string | null
    page_id: string
  }
}

export function AutoSyncStatus() {
  const [pageConfigs, setPageConfigs] = useState<PageConfig[]>([])
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunningSync, setIsRunningSync] = useState(false)

  const loadData = async () => {
    try {
      const [configs, jobs] = await Promise.all([getPageConfigs(), getSyncJobs()])
      setPageConfigs(configs)
      setSyncJobs(jobs)
    } catch (error) {
      console.error("Error loading sync data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRunSync = async () => {
    setIsRunningSync(true)
    try {
      await runAutoSync()
      await loadData() // Refresh data after sync
    } catch (error) {
      console.error("Error running sync:", error)
    } finally {
      setIsRunningSync(false)
    }
  }

  const handleToggleAutoSync = async (configId: number, enabled: boolean) => {
    try {
      await toggleAutoSync(configId, enabled)
      await loadData() // Refresh data
    } catch (error) {
      console.error("Error toggling auto-sync:", error)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        )
      case "syncing":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Syncing
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading sync status...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Configurations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              <CardTitle>Auto-Sync Status</CardTitle>
            </div>
            <Button onClick={handleRunSync} disabled={isRunningSync} size="sm">
              {isRunningSync ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Sync Now
                </>
              )}
            </Button>
          </div>
          <CardDescription>Monitor your Facebook page auto-sync configurations</CardDescription>
        </CardHeader>
        <CardContent>
          {pageConfigs.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No Facebook pages configured yet. Set up a page to enable auto-sync.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {pageConfigs.map((config) => (
                <div key={config.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{config.page_name || `Page ${config.page_id}`}</h3>
                      <p className="text-sm text-gray-600">ID: {config.page_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(config.sync_status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAutoSync(config.id, !config.auto_sync_enabled)}
                      >
                        {config.auto_sync_enabled ? (
                          <>
                            <Pause className="w-4 h-4 mr-1" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            Enable
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Auto-Sync:</span>
                      <p className="font-medium">
                        {config.auto_sync_enabled ? (
                          <span className="text-green-600">Enabled</span>
                        ) : (
                          <span className="text-red-600">Disabled</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Interval:</span>
                      <p className="font-medium">{config.sync_interval_minutes} minutes</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Sync:</span>
                      <p className="font-medium">{formatDate(config.last_sync_at)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Next Sync:</span>
                      <p className="font-medium">{formatDate(config.next_sync_at)}</p>
                    </div>
                  </div>

                  {config.last_error && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{config.last_error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Jobs</CardTitle>
          <CardDescription>History of automatic sync operations</CardDescription>
        </CardHeader>
        <CardContent>
          {syncJobs.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No sync jobs yet</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Leads Fetched</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>{job.facebook_page_configs.page_name || job.facebook_page_configs.page_id}</TableCell>
                      <TableCell>{getStatusBadge(job.job_status)}</TableCell>
                      <TableCell>{job.leads_fetched}</TableCell>
                      <TableCell>{formatDate(job.started_at)}</TableCell>
                      <TableCell>{formatDate(job.completed_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
