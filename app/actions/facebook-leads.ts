"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/supabase/auth"
import { createOrUpdatePageConfig } from "@/lib/auto-sync"
import { z } from "zod"

const fetchLeadsSchema = z.object({
  pageAccessToken: z.string().min(1, "Page Access Token is required"),
  pageId: z.string().min(1, "Page ID is required"),
  leadFormId: z.string().min(1, "Lead Form ID is required"),
})

const setupPageSchema = z.object({
  pageAccessToken: z.string().min(1, "Page Access Token is required"),
  pageId: z.string().min(1, "Page ID is required"),
  pageName: z.string().optional(),
  autoSyncEnabled: z.boolean().default(true),
  syncInterval: z.number().min(15).max(1440).default(30),
})

const manualLeadSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().optional(),
  company: z.string().optional(),
  pageId: z.string().min(1, "Page ID is required"),
  formId: z.string().min(1, "Form ID is required"),
  notes: z.string().optional(),
  leadStatus: z.string().optional(),
  leadSource: z.string().optional(),
})

interface FacebookLeadData {
  id: string
  created_time: string
  field_data: Array<{
    name: string
    values: string[]
  }>
}

export async function fetchFacebookLeads(prevState: any, formData: FormData) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const rawData = {
      pageAccessToken: formData.get("pageAccessToken") as string,
      pageId: formData.get("pageId") as string,
      leadFormId: formData.get("leadFormId") as string,
    }

    const validatedData = fetchLeadsSchema.parse(rawData)

    // Fetch leads from Facebook Graph API
    const facebookApiUrl = `https://graph.facebook.com/v18.0/${validatedData.leadFormId}/leads?access_token=${validatedData.pageAccessToken}`

    const response = await fetch(facebookApiUrl)

    if (!response.ok) {
      const errorData = await response.json()
      return {
        error: `Facebook API Error: ${errorData.error?.message || "Failed to fetch leads"}`,
        leads: [],
      }
    }

    const data = await response.json()
    const leads: FacebookLeadData[] = data.data || []

    if (leads.length === 0) {
      return {
        success: true,
        message: "No new leads found",
        leads: [],
      }
    }

    // Process and store leads in database
    const processedLeads = []

    for (const lead of leads) {
      // Extract common fields from Facebook lead data
      const fieldData = lead.field_data || []
      const fullName =
        fieldData.find((f) => f.name === "full_name")?.values[0] ||
        fieldData.find((f) => f.name === "first_name")?.values[0] +
          " " +
          fieldData.find((f) => f.name === "last_name")?.values[0] ||
        null
      const email = fieldData.find((f) => f.name === "email")?.values[0] || null
      const phoneNumber = fieldData.find((f) => f.name === "phone_number")?.values[0] || null
      const company = fieldData.find((f) => f.name === "company_name")?.values[0] || null

      // Insert lead into database (with conflict handling)
      const { data: insertedLead, error } = await supabase
        .from("facebook_leads")
        .upsert(
          {
            user_id: user.id,
            lead_id: lead.id,
            page_id: validatedData.pageId,
            form_id: validatedData.leadFormId,
            full_name: fullName,
            email: email,
            phone_number: phoneNumber,
            company: company,
            lead_source: "facebook",
            lead_status: "new",
            submitted_at: lead.created_time,
            raw_data: lead,
          },
          {
            onConflict: "user_id,lead_id,page_id,form_id",
          },
        )
        .select()
        .single()

      if (!error && insertedLead) {
        processedLeads.push(insertedLead)
      }
    }

    return {
      success: true,
      message: `Successfully fetched ${processedLeads.length} leads`,
      leads: processedLeads,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message, leads: [] }
    }
    console.error("Fetch leads error:", error)
    return { error: "An error occurred while fetching leads", leads: [] }
  }
}

export async function setupFacebookPage(prevState: any, formData: FormData) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const rawData = {
      pageAccessToken: formData.get("pageAccessToken") as string,
      pageId: formData.get("pageId") as string,
      pageName: formData.get("pageName") as string,
      autoSyncEnabled: formData.get("autoSyncEnabled") === "true",
      syncInterval: Number.parseInt(formData.get("syncInterval") as string) || 30,
    }

    const validatedData = setupPageSchema.parse(rawData)

    // Test the Facebook API connection first
    const testApiUrl = `https://graph.facebook.com/v18.0/${validatedData.pageId}?fields=name,id&access_token=${validatedData.pageAccessToken}`

    const testResponse = await fetch(testApiUrl)
    if (!testResponse.ok) {
      const errorData = await testResponse.json()
      return {
        error: `Facebook API Error: ${errorData.error?.message || "Invalid credentials"}`,
      }
    }

    const pageData = await testResponse.json()

    // Create or update page configuration
    const pageConfig = await createOrUpdatePageConfig(
      validatedData.pageId,
      validatedData.pageAccessToken,
      validatedData.pageName || pageData.name,
      validatedData.autoSyncEnabled,
      validatedData.syncInterval,
    )

    // Fetch initial leads
    let initialLeadsFetched = 0
    try {
      // Get lead forms for this page
      const formsApiUrl = `https://graph.facebook.com/v18.0/${validatedData.pageId}/leadgen_forms?access_token=${validatedData.pageAccessToken}`

      const formsResponse = await fetch(formsApiUrl)
      if (formsResponse.ok) {
        const formsData = await formsResponse.json()
        const forms = formsData.data || []

        for (const form of forms) {
          // Fetch leads for each form
          const leadsApiUrl = `https://graph.facebook.com/v18.0/${form.id}/leads?access_token=${validatedData.pageAccessToken}`

          const leadsResponse = await fetch(leadsApiUrl)
          if (leadsResponse.ok) {
            const leadsData = await leadsResponse.json()
            const leads: FacebookLeadData[] = leadsData.data || []

            // Store form info
            await supabase.from("facebook_lead_forms").upsert(
              {
                user_id: user.id,
                page_config_id: pageConfig.id,
                form_id: form.id,
                form_name: form.name || "Unnamed Form",
                is_active: true,
              },
              {
                onConflict: "user_id,form_id",
              },
            )

            // Process and store leads
            for (const lead of leads) {
              const fieldData = lead.field_data || []
              const fullName =
                fieldData.find((f) => f.name === "full_name")?.values[0] ||
                `${fieldData.find((f) => f.name === "first_name")?.values[0] || ""} ${
                  fieldData.find((f) => f.name === "last_name")?.values[0] || ""
                }`.trim() ||
                null

              const email = fieldData.find((f) => f.name === "email")?.values[0] || null
              const phoneNumber = fieldData.find((f) => f.name === "phone_number")?.values[0] || null
              const company = fieldData.find((f) => f.name === "company_name")?.values[0] || null

              const { error } = await supabase.from("facebook_leads").upsert(
                {
                  user_id: user.id,
                  lead_id: lead.id,
                  page_id: validatedData.pageId,
                  form_id: form.id,
                  full_name: fullName,
                  email: email,
                  phone_number: phoneNumber,
                  company: company,
                  lead_source: "facebook",
                  lead_status: "new",
                  submitted_at: lead.created_time,
                  raw_data: lead,
                },
                {
                  onConflict: "user_id,lead_id,page_id,form_id",
                },
              )

              if (!error) {
                initialLeadsFetched++
              }
            }
          }
        }
      }
    } catch (leadsError) {
      console.error("Error fetching initial leads:", leadsError)
    }

    return {
      success: true,
      message: `Facebook page setup completed! ${
        validatedData.autoSyncEnabled ? "Auto-sync enabled" : "Auto-sync disabled"
      }. Fetched ${initialLeadsFetched} initial leads.`,
      pageConfig,
      initialLeadsFetched,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error("Setup Facebook page error:", error)
    return { error: "An error occurred during setup" }
  }
}

export async function addManualLead(prevState: any, formData: FormData) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const rawData = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      company: formData.get("company") as string,
      pageId: formData.get("pageId") as string,
      formId: formData.get("formId") as string,
      notes: formData.get("notes") as string,
      leadStatus: formData.get("leadStatus") as string,
      leadSource: formData.get("leadSource") as string,
    }

    const validatedData = manualLeadSchema.parse(rawData)

    // Generate a unique lead ID for manual entries
    const manualLeadId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    // Insert manual lead into database
    const { data: insertedLead, error } = await supabase
      .from("facebook_leads")
      .insert({
        user_id: user.id,
        lead_id: manualLeadId,
        page_id: validatedData.pageId,
        form_id: validatedData.formId,
        full_name: validatedData.fullName,
        email: validatedData.email,
        phone_number: validatedData.phoneNumber || null,
        company: validatedData.company || null,
        lead_source: validatedData.leadSource || "manual",
        lead_status: validatedData.leadStatus || "new",
        submitted_at: new Date().toISOString(),
        raw_data: {
          manual_entry: true,
          notes: validatedData.notes,
          created_by: user.id,
        },
      })
      .select()
      .single()

    if (error) {
      console.error("Error inserting manual lead:", error)
      return { error: "Failed to add lead. Please try again." }
    }

    return {
      success: true,
      message: "Lead added successfully!",
      lead: insertedLead,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error("Add manual lead error:", error)
    return { error: "An error occurred while adding the lead" }
  }
}

export async function getStoredLeads() {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { data: leads, error } = await supabase
      .from("facebook_leads")
      .select("*")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })

    if (error) {
      console.error("Error fetching stored leads:", error)
      return []
    }

    return leads || []
  } catch (error) {
    console.error("Error getting stored leads:", error)
    return []
  }
}

export async function getPageConfigs() {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { data: configs, error } = await supabase
      .from("facebook_page_configs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching page configs:", error)
      return []
    }

    return configs || []
  } catch (error) {
    console.error("Error getting page configs:", error)
    return []
  }
}

export async function getSyncJobs() {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { data: jobs, error } = await supabase
      .from("auto_sync_jobs")
      .select(`
        *,
        facebook_page_configs!inner(page_name, page_id)
      `)
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching sync jobs:", error)
      return []
    }

    return jobs || []
  } catch (error) {
    console.error("Error getting sync jobs:", error)
    return []
  }
}
