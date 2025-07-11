"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getStoredLeads } from "@/app/actions/facebook-leads"
import { Facebook, RefreshCw } from "lucide-react"
import type { FacebookLead } from "@/lib/types"
import { FacebookPageSetup } from "@/components/facebook-page-setup"
import { AutoSyncStatus } from "@/components/auto-sync-status"
import { ManualLeadForm } from "@/components/manual-lead-form"
import { ExcelImport } from "@/components/excel-import"

export default function FacebookLeadsPage() {
  const [storedLeads, setStoredLeads] = useState<FacebookLead[]>([])
  const [isLoadingStored, setIsLoadingStored] = useState(true)

  // Load stored leads on component mount and refresh every 30 seconds
  const loadStoredLeads = async () => {
    try {
      const leads = await getStoredLeads()
      setStoredLeads(leads)
    } catch (error) {
      console.error("Error loading stored leads:", error)
    } finally {
      setIsLoadingStored(false)
    }
  }

  useEffect(() => {
    loadStoredLeads()
    // Auto-refresh leads every 30 seconds to show new leads from auto-sync
    const interval = setInterval(loadStoredLeads, 30000)
    return () => clearInterval(interval)
  }, [])

  // Handle new lead addition (from manual form or Excel import)
  const handleLeadAdded = (newLead: FacebookLead | FacebookLead[]) => {
    if (Array.isArray(newLead)) {
      // Multiple leads from Excel import
      setStoredLeads((prev) => [...newLead, ...prev])
    } else {
      // Single lead from manual form
      setStoredLeads((prev) => [newLead, ...prev])
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "contacted":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "qualified":
        return "bg-green-50 text-green-700 border-green-200"
      case "converted":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "lost":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader title="Facebook Leads" breadcrumbs={[{ label: "Facebook Leads" }]} />

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup">Page Setup</TabsTrigger>
          <TabsTrigger value="leads">All Leads</TabsTrigger>
          <TabsTrigger value="sync">Auto-Sync Status</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <FacebookPageSetup />
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Leads</CardTitle>
                  <CardDescription>
                    All leads from Facebook API (auto-synced), manual entries, and Excel imports
                    <br />
                    <span className="text-green-600 text-sm">✨ Auto-refreshes every 30 seconds to show new leads</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{storedLeads.length} Total Leads</Badge>
                  <Button variant="outline" size="sm" onClick={loadStoredLeads} disabled={isLoadingStored}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingStored ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mb-6">
                <ManualLeadForm onLeadAdded={handleLeadAdded} />
                <ExcelImport onImportComplete={handleLeadAdded} />
              </div>

              {isLoadingStored ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading leads...</span>
                </div>
              ) : storedLeads.length === 0 ? (
                <div className="text-center py-8">
                  <Facebook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
                  <p className="text-gray-600 mb-4">
                    Set up your Facebook page to start automatically collecting leads, or add leads manually
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => document.querySelector('[value="setup"]')?.click()}>
                      <Facebook className="w-4 h-4 mr-2" />
                      Setup Facebook Page
                    </Button>
                    <ManualLeadForm onLeadAdded={handleLeadAdded} />
                    <ExcelImport onImportComplete={handleLeadAdded} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Live Lead Management</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Auto-sync active • Manual entry enabled • Excel import available
                    </p>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lead ID</TableHead>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone Number</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted At</TableHead>
                          <TableHead>Source</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {storedLeads.map((lead) => (
                          <TableRow key={`${lead.lead_id}-${lead.page_id}`} className="hover:bg-gray-50">
                            <TableCell className="font-mono text-xs">
                              {lead.lead_id.startsWith("manual_") ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  Manual
                                </Badge>
                              ) : (
                                lead.lead_id.substring(0, 8) + "..."
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{lead.full_name || "N/A"}</TableCell>
                            <TableCell>
                              <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                                {lead.email || "N/A"}
                              </a>
                            </TableCell>
                            <TableCell>
                              {lead.phone_number ? (
                                <a href={`tel:${lead.phone_number}`} className="text-blue-600 hover:underline">
                                  {lead.phone_number}
                                </a>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell>{lead.company || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(lead.lead_status || "new")}>
                                {(lead.lead_status || "new").charAt(0).toUpperCase() +
                                  (lead.lead_status || "new").slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(lead.submitted_at)}</TableCell>
                            <TableCell>
                              {lead.lead_source === "manual" ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  Manual Entry
                                </Badge>
                              ) : lead.lead_source === "facebook" ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  Facebook Auto-Sync
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                  Excel Import
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">
                        {storedLeads.filter((l) => l.lead_source === "facebook").length}
                      </div>
                      <div className="text-sm text-blue-600">Facebook Leads</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        {storedLeads.filter((l) => l.lead_source === "manual").length}
                      </div>
                      <div className="text-sm text-green-600">Manual Entries</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-700">
                        {storedLeads.filter((l) => l.lead_status === "new").length}
                      </div>
                      <div className="text-sm text-yellow-600">New Leads</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <div className="text-2xl font-bold text-purple-700">
                        {storedLeads.filter((l) => l.lead_status === "converted").length}
                      </div>
                      <div className="text-sm text-purple-600">Converted</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <AutoSyncStatus />
        </TabsContent>
      </Tabs>
    </div>
  )
}
