import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/supabase/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const formData = await request.formData()
    const fullName = formData.get("fullName") as string
    const email = formData.get("email") as string
    const phoneNumber = formData.get("phoneNumber") as string
    const pageId = formData.get("pageId") as string
    const formId = formData.get("formId") as string
    const notes = formData.get("notes") as string
    const company = formData.get("company") as string

    // Validate required fields
    if (!fullName || !email || !pageId || !formId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate a unique lead ID for manual entries
    const manualLeadId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    // Insert manual lead into database
    const { data: insertedLead, error } = await supabase
      .from("facebook_leads")
      .insert({
        user_id: user.id,
        lead_id: manualLeadId,
        page_id: pageId,
        form_id: formId,
        full_name: fullName,
        email: email,
        phone_number: phoneNumber || null,
        company: company || null,
        lead_source: "manual",
        lead_status: "new",
        submitted_at: new Date().toISOString(),
        raw_data: {
          manual_entry: true,
          notes: notes,
          created_by: user.id,
          import_method: "api",
        },
      })
      .select()
      .single()

    if (error) {
      console.error("Error inserting manual lead:", error)
      return NextResponse.json({ error: "Failed to add lead" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Lead added successfully!",
      lead: insertedLead,
    })
  } catch (error) {
    console.error("Import lead API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
