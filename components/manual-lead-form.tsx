"use client"

import { useActionState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { addManualLead } from "@/app/actions/facebook-leads"
import { User, Mail, Phone, Building, FileText, Plus, CheckCircle, AlertCircle } from "lucide-react"
import { useState } from "react"

interface ManualLeadFormProps {
  onLeadAdded: (lead: any) => void
}

export function ManualLeadForm({ onLeadAdded }: ManualLeadFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastProcessedLeadId, setLastProcessedLeadId] = useState<string | null>(null)
  const [state, action, isPending] = useActionState(addManualLead, {})
  const formRef = useRef<HTMLFormElement>(null)

  // Handle successful lead addition - prevent duplicate processing
  useEffect(() => {
    if (state.success && state.lead && state.lead.id !== lastProcessedLeadId) {
      setLastProcessedLeadId(state.lead.id)
      onLeadAdded(state.lead)

      // Close dialog and reset form after successful submission
      setTimeout(() => {
        setIsOpen(false)
        setIsSubmitting(false)
        if (formRef.current) {
          formRef.current.reset()
        }
      }, 1000) // Give user time to see success message
    }
  }, [state.success, state.lead, lastProcessedLeadId, onLeadAdded])

  // Reset submitting state when there's an error
  useEffect(() => {
    if (state.error) {
      setIsSubmitting(false)
    }
  }, [state.error])

  // Handle dialog open/close
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!isSubmitting) {
        // Prevent closing while submitting
        setIsOpen(open)
        if (!open) {
          // Reset all states when dialog closes
          setIsSubmitting(false)
          setLastProcessedLeadId(null)
          if (formRef.current) {
            formRef.current.reset()
          }
        }
      }
    },
    [isSubmitting],
  )

  // Handle form submission
  const handleSubmit = useCallback(
    (formData: FormData) => {
      if (!isSubmitting) {
        setIsSubmitting(true)
        action(formData)
      }
    },
    [isSubmitting, action],
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Manual Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            Add New Lead Manually
          </DialogTitle>
          <DialogDescription>Fill in the lead information below. Fields marked with * are required.</DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Enter customer's full name"
                  required
                  disabled={isPending || isSubmitting}
                  className="transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter customer's email"
                  required
                  disabled={isPending || isSubmitting}
                  className="transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="Enter customer's phone number"
                  disabled={isPending || isSubmitting}
                  className="transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  Company
                </Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="Enter company name"
                  disabled={isPending || isSubmitting}
                  className="transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Lead Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leadStatus">Lead Status</Label>
                <Select name="leadStatus" defaultValue="new" disabled={isPending || isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadSource">Lead Source</Label>
                <Select name="leadSource" defaultValue="manual" disabled={isPending || isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Facebook Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Facebook Configuration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pageId">Facebook Page ID *</Label>
                <Input
                  id="pageId"
                  name="pageId"
                  placeholder="Enter Facebook Page ID"
                  required
                  disabled={isPending || isSubmitting}
                  className="transition-all duration-200"
                />
                <p className="text-xs text-gray-500">The ID of your Facebook business page</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formId">Lead Form ID *</Label>
                <Input
                  id="formId"
                  name="formId"
                  placeholder="Enter Lead Form ID"
                  required
                  disabled={isPending || isSubmitting}
                  className="transition-all duration-200"
                />
                <p className="text-xs text-gray-500">The ID of your Facebook lead generation form</p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Additional Information</h3>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Notes & Comments
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Add any additional notes about this lead..."
                disabled={isPending || isSubmitting}
                rows={4}
                className="transition-all duration-200"
              />
            </div>
          </div>

          {/* Error/Success Messages */}
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
                {state.message} The dialog will close automatically.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" disabled={isPending || isSubmitting} className="flex-1">
              {isPending || isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Adding Lead...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lead
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending || isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
