"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileSpreadsheet, Upload, CheckCircle, Download } from "lucide-react"
import * as XLSX from "xlsx"

interface ExcelLead {
  fullName: string
  email: string
  phoneNumber?: string
  company?: string
  notes?: string
  pageId: string
  formId: string
}

interface ExcelImportProps {
  onImportComplete: (leads: any[]) => void
}

export function ExcelImport({ onImportComplete }: ExcelImportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ExcelLead[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{
    success: number
    errors: number
    total: number
    errorDetails: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      processExcelFile(file)
    }
  }

  const processExcelFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        // Process the data
        const headers = jsonData[0] as string[]
        const rows = jsonData.slice(1) as any[]

        const processedData: ExcelLead[] = rows
          .filter((row) => row.length > 0 && row[0]) // Filter out empty rows
          .map((row, index) => {
            const lead: any = {}
            headers.forEach((header, headerIndex) => {
              const normalizedHeader = header.toLowerCase().trim()
              const value = row[headerIndex]?.toString().trim() || ""

              // Map common column names to our fields
              if (normalizedHeader.includes("name") || normalizedHeader.includes("full")) {
                lead.fullName = value
              } else if (normalizedHeader.includes("email")) {
                lead.email = value
              } else if (normalizedHeader.includes("phone") || normalizedHeader.includes("mobile")) {
                lead.phoneNumber = value
              } else if (normalizedHeader.includes("company") || normalizedHeader.includes("business")) {
                lead.company = value
              } else if (normalizedHeader.includes("note") || normalizedHeader.includes("comment")) {
                lead.notes = value
              } else if (normalizedHeader.includes("page") && normalizedHeader.includes("id")) {
                lead.pageId = value
              } else if (normalizedHeader.includes("form") && normalizedHeader.includes("id")) {
                lead.formId = value
              }
            })

            // Set default values if not provided
            lead.pageId = lead.pageId || "default_page"
            lead.formId = lead.formId || "excel_import"

            return lead
          })
          .filter((lead) => lead.fullName && lead.email) // Only include leads with name and email

        setPreviewData(processedData)
      } catch (error) {
        console.error("Error processing Excel file:", error)
        alert("Error processing Excel file. Please check the format.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = async () => {
    if (previewData.length === 0) return

    setIsProcessing(true)
    setImportProgress(0)
    setImportResults(null)

    const results = {
      success: 0,
      errors: 0,
      total: previewData.length,
      errorDetails: [] as string[],
    }

    const importedLeads = []

    for (let i = 0; i < previewData.length; i++) {
      const lead = previewData[i]
      setImportProgress(((i + 1) / previewData.length) * 100)

      try {
        // Create FormData for the server action
        const formData = new FormData()
        formData.append("fullName", lead.fullName)
        formData.append("email", lead.email)
        formData.append("phoneNumber", lead.phoneNumber || "")
        formData.append("pageId", lead.pageId)
        formData.append("formId", lead.formId)
        formData.append("notes", `Excel Import: ${lead.notes || ""}`)

        // Import the lead using the existing server action
        const response = await fetch("/api/import-lead", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            results.success++
            importedLeads.push(result.lead)
          } else {
            results.errors++
            results.errorDetails.push(`Row ${i + 1}: ${result.error}`)
          }
        } else {
          results.errors++
          results.errorDetails.push(`Row ${i + 1}: Server error`)
        }
      } catch (error) {
        results.errors++
        results.errorDetails.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }

      // Small delay to prevent overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    setImportResults(results)
    setIsProcessing(false)

    // Notify parent component of successful imports
    if (importedLeads.length > 0) {
      onImportComplete(importedLeads)
    }
  }

  const downloadTemplate = () => {
    const templateData = [
      ["Full Name", "Email", "Phone Number", "Company", "Notes", "Page ID", "Form ID"],
      ["John Doe", "john@example.com", "+1234567890", "Acme Corp", "Interested in product", "123456789", "form_123"],
      ["Jane Smith", "jane@example.com", "+1234567891", "Tech Inc", "Needs follow up", "123456789", "form_123"],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads Template")
    XLSX.writeFile(workbook, "leads_import_template.xlsx")
  }

  const resetImport = () => {
    setSelectedFile(null)
    setPreviewData([])
    setImportResults(null)
    setImportProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto bg-transparent">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Import from Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Import Leads from Excel
          </DialogTitle>
          <DialogDescription>Upload an Excel file (.xlsx, .xls) to import multiple leads at once</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Upload Excel File</CardTitle>
              <CardDescription>
                Select your Excel file containing lead information. Download our template for the correct format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={downloadTemplate} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-upload"
                />
                <Label htmlFor="excel-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : "Click to upload Excel file or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-500">Supports .xlsx and .xls files</p>
                  </div>
                </Label>
              </div>

              {selectedFile && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    File uploaded successfully: {selectedFile.name} ({previewData.length} leads found)
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Preview Section */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Step 2: Preview Data</CardTitle>
                    <CardDescription>Review the leads that will be imported</CardDescription>
                  </div>
                  <Badge variant="outline">{previewData.length} leads</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Page ID</TableHead>
                        <TableHead>Form ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.slice(0, 10).map((lead, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{lead.fullName}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>{lead.phoneNumber || "N/A"}</TableCell>
                          <TableCell>{lead.company || "N/A"}</TableCell>
                          <TableCell className="font-mono text-xs">{lead.pageId}</TableCell>
                          <TableCell className="font-mono text-xs">{lead.formId}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {previewData.length > 10 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Showing first 10 leads. {previewData.length - 10} more will be imported.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Import Section */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 3: Import Leads</CardTitle>
                <CardDescription>Start the import process to add leads to your database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Importing leads...</span>
                      <span>{Math.round(importProgress)}%</span>
                    </div>
                    <Progress value={importProgress} className="w-full" />
                  </div>
                )}

                {importResults && (
                  <Alert
                    className={
                      importResults.errors > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"
                    }
                  >
                    <CheckCircle
                      className={`h-4 w-4 ${importResults.errors > 0 ? "text-yellow-600" : "text-green-600"}`}
                    />
                    <AlertDescription className={importResults.errors > 0 ? "text-yellow-800" : "text-green-800"}>
                      <strong>Import Complete!</strong>
                      <br />
                      Successfully imported: {importResults.success} leads
                      <br />
                      Errors: {importResults.errors} leads
                      {importResults.errorDetails.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer">View error details</summary>
                          <ul className="list-disc list-inside mt-1 text-sm">
                            {importResults.errorDetails.slice(0, 5).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importResults.errorDetails.length > 5 && (
                              <li>... and {importResults.errorDetails.length - 5} more errors</li>
                            )}
                          </ul>
                        </details>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleImport} disabled={isProcessing || previewData.length === 0} className="flex-1">
                    {isProcessing ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-pulse" />
                        Importing... ({Math.round(importProgress)}%)
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import {previewData.length} Leads
                      </>
                    )}
                  </Button>
                  <Button onClick={resetImport} variant="outline" disabled={isProcessing}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
