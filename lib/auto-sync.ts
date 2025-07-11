import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/supabase/auth"

export interface PageConfig {
  id: number
  user_id: string
  page_id: string
  page_name: string | null
  access_token: string
  auto_sync_enabled: boolean
  sync_interval_minutes: number
  last_sync_at: string | null
  next_sync_at: string | null
  sync_status: string
  last_error: string | null
}

export interface SyncJob {
  id: number
  user_id: string
  page_config_id: number
  job_status: string
  leads_fetched: number
  error_message: string | null
  started_at: string
  completed_at: string | null
}

export async function getPageConfigs(): Promise<PageConfig[]> {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("facebook_page_configs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching page configs:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error getting page configs:", error)
    return []
  }
}

export async function createOrUpdatePageConfig(
  pageId: string,
  accessToken: string,
  pageName?: string,
  autoSyncEnabled = true,
  syncInterval = 30,
) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("facebook_page_configs")
      .upsert(
        {
          user_id: user.id,
          page_id: pageId,
          page_name: pageName,
          access_token: accessToken,
          auto_sync_enabled: autoSyncEnabled,
          sync_interval_minutes: syncInterval,
          next_sync_at: new Date(Date.now() + syncInterval * 60 * 1000).toISOString(),
          sync_status: "pending",
        },
        {
          onConflict: "user_id,page_id",
        },
      )
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save page config: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error creating/updating page config:", error)
    throw error
  }
}

export async function getConfigsReadyForSync(): Promise<PageConfig[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("facebook_page_configs")
      .select("*")
      .eq("auto_sync_enabled", true)
      .lte("next_sync_at", new Date().toISOString())
      .neq("sync_status", "syncing")

    if (error) {
      console.error("Error fetching configs ready for sync:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error getting configs ready for sync:", error)
    return []
  }
}

export async function updateSyncStatus(configId: number, status: string, error?: string) {
  try {
    const supabase = await createClient()

    const updateData: any = {
      sync_status: status,
      last_sync_at: new Date().toISOString(),
    }

    if (error) {
      updateData.last_error = error
    } else {
      updateData.last_error = null
    }

    const { error: updateError } = await supabase.from("facebook_page_configs").update(updateData).eq("id", configId)

    if (updateError) {
      console.error("Error updating sync status:", updateError)
    }

    // Schedule next sync if successful
    if (status === "success") {
      await supabase.rpc("schedule_next_sync", { config_id: configId })
    }
  } catch (error) {
    console.error("Error updating sync status:", error)
  }
}

export async function createSyncJob(configId: number, userId: string): Promise<number> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("auto_sync_jobs")
      .insert({
        user_id: userId,
        page_config_id: configId,
        job_status: "running",
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create sync job: ${error.message}`)
    }

    return data.id
  } catch (error) {
    console.error("Error creating sync job:", error)
    throw error
  }
}

export async function updateSyncJob(jobId: number, status: string, leadsFetched = 0, errorMessage?: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("auto_sync_jobs")
      .update({
        job_status: status,
        leads_fetched: leadsFetched,
        error_message: errorMessage || null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    if (error) {
      console.error("Error updating sync job:", error)
    }
  } catch (error) {
    console.error("Error updating sync job:", error)
  }
}
