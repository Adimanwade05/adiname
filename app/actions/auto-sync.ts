"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/supabase/auth"
import {
  getConfigsReadyForSync,
  updateSyncStatus,
  createSyncJob,
  updateSyncJob,
  type PageConfig,
} from "@/lib/auto-sync"

interface FacebookLeadData {
  id: string
  created_time: string
  field_data: Array<{
    name: string
    values: string[]
  }>
}

export async function runAutoSync() {
  try {
    console.log("Starting auto-sync process...")
    const configs = await getConfigsReadyForSync()

    if (configs.length === 0) {
      console.log("No configs ready for sync")
      return { success: true, message: "No configs ready for sync", syncedConfigs: 0 }
    }

    let syncedConfigs = 0
    let totalLeadsFetched = 0

    for (const config of configs) {
      try {
        console.log(`Syncing config ${config.id} for page ${config.page_id}`)

        // Update status to syncing
        await updateSyncStatus(config.id, "syncing")

        // Create sync job
        const jobId = await createSyncJob(config.id, config.user_id)

        // Fetch leads from Facebook
        const leadsFetched = await syncLeadsForConfig(config)

        // Update sync job as completed
        await updateSyncJob(jobId, "completed", leadsFetched)

        // Update config status as success
        await updateSyncStatus(config.id, "success")

        syncedConfigs++
        totalLeadsFetched += leadsFetched

        console.log(`Successfully synced ${leadsFetched} leads for config ${config.id}`)
      } catch (error) {
        console.error(`Error syncing config ${config.id}:`, error)

        // Update sync status as error
        await updateSyncStatus(config.id, "error", error instanceof Error ? error.message : "Unknown error")

        // Update sync job as failed
        const jobId = await createSyncJob(config.id, config.user_id)
        await updateSyncJob(jobId, "failed", 0, error instanceof Error ? error.message : "Unknown error")
      }
    }

    return {
      success: true,
      message: `Auto-sync completed. Synced ${syncedConfigs} configs, fetched ${totalLeadsFetched} total leads.`,
      syncedConfigs,
      totalLeadsFetched,
    }
  } catch (error) {
    console.error("Auto-sync process failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Auto-sync failed",
      syncedConfigs: 0,
      totalLeadsFetched: 0,
    }
  }
}

async function syncLeadsForConfig(config: PageConfig): Promise<number> {
  const supabase = await createClient()

  // Get all lead forms for this page config
  const { data: leadForms } = await supabase
    .from("facebook_lead_forms")
    .select("*")
    .eq("page_config_id", config.id)
    .eq("is_active", true)

  let totalLeadsFetched = 0

  // If no specific forms configured, try to fetch from the page directly
  const formsToSync = leadForms && leadForms.length > 0 ? leadForms : [{ form_id: "default", form_name: "Default" }]

  for (const form of formsToSync) {
    try {
      // Fetch leads from Facebook Graph API
      const facebookApiUrl = `https://graph.facebook.com/v18.0/${config.page_id}/leadgen_forms?access_token=${config.access_token}`

      const formsResponse = await fetch(facebookApiUrl)
      if (!formsResponse.ok) {
        console.error(`Failed to fetch forms for page ${config.page_id}`)
        continue
      }

      const formsData = await formsResponse.json()
      const forms = formsData.data || []

      for (const fbForm of forms) {
        // Fetch leads for each form
        const leadsApiUrl = `https://graph.facebook.com/v18.0/${fbForm.id}/leads?access_token=${config.access_token}`

        const leadsResponse = await fetch(leadsApiUrl)
        if (!leadsResponse.ok) {
          console.error(`Failed to fetch leads for form ${fbForm.id}`)
          continue
        }

        const leadsData = await leadsResponse.json()
        const leads: FacebookLeadData[] = leadsData.data || []

        // Process and store leads
        for (const lead of leads) {
          try {
            // Extract common fields from Facebook lead data
            const fieldData = lead.field_data || []
            const fullName =
              fieldData.find((f) => f.name === "full_name")?.values[0] ||
              `${fieldData.find((f) => f.name === "first_name")?.values[0] || ""} ${
                fieldData.find((f) => f.name === "last_name")?.values[0] || ""
              }`.trim() ||
              null

            const email = fieldData.find((f) => f.name === "email")?.values[0] || null
            const phoneNumber = fieldData.find((f) => f.name === "phone_number")?.values[0] || null

            // Insert lead into database (with conflict handling)
            const { error } = await supabase.from("facebook_leads").upsert(
              {
                user_id: config.user_id,
                lead_id: lead.id,
                page_id: config.page_id,
                form_id: fbForm.id,
                full_name: fullName,
                email: email,
                phone_number: phoneNumber,
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
              totalLeadsFetched++
            }
          } catch (leadError) {
            console.error(`Error processing lead ${lead.id}:`, leadError)
          }
        }

        // Store/update form info
        await supabase.from("facebook_lead_forms").upsert(
          {
            user_id: config.user_id,
            page_config_id: config.id,
            form_id: fbForm.id,
            form_name: fbForm.name || "Unnamed Form",
            is_active: true,
          },
          {
            onConflict: "user_id,form_id",
          },
        )
      }
    } catch (formError) {
      console.error(`Error syncing form ${form.form_id}:`, formError)
    }
  }

  return totalLeadsFetched
}

export async function toggleAutoSync(pageConfigId: number, enabled: boolean) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { error } = await supabase
      .from("facebook_page_configs")
      .update({
        auto_sync_enabled: enabled,
        next_sync_at: enabled ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null,
      })
      .eq("id", pageConfigId)
      .eq("user_id", user.id)

    if (error) {
      return { error: `Failed to toggle auto-sync: ${error.message}` }
    }

    return { success: true, message: `Auto-sync ${enabled ? "enabled" : "disabled"} successfully` }
  } catch (error) {
    console.error("Error toggling auto-sync:", error)
    return { error: "Failed to toggle auto-sync" }
  }
}

export async function updateSyncInterval(pageConfigId: number, intervalMinutes: number) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { error } = await supabase
      .from("facebook_page_configs")
      .update({
        sync_interval_minutes: intervalMinutes,
        next_sync_at: new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString(),
      })
      .eq("id", pageConfigId)
      .eq("user_id", user.id)

    if (error) {
      return { error: `Failed to update sync interval: ${error.message}` }
    }

    return { success: true, message: "Sync interval updated successfully" }
  } catch (error) {
    console.error("Error updating sync interval:", error)
    return { error: "Failed to update sync interval" }
  }
}
