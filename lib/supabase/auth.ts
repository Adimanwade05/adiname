import { createClient } from "./server"
import { redirect } from "next/navigation"
import type { UserProfile, AuthUser } from "@/lib/types"

export async function getUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      // If profile doesn't exist, create it using the function
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User"

      try {
        const { error: createError } = await supabase.rpc("create_user_profile", {
          user_id: user.id,
          user_email: user.email || "",
          user_full_name: fullName,
        })

        if (createError) {
          console.error("Error creating profile with function:", createError)
          // Fallback: try direct insert
          const { data: fallbackProfile, error: fallbackError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email || "",
              full_name: fullName,
            })
            .select()
            .single()

          if (fallbackError || !fallbackProfile) {
            console.error("Error creating profile with fallback:", fallbackError)
            return {
              id: user.id,
              email: user.email || "",
              full_name: fullName,
              created_at: user.created_at,
            }
          }

          return {
            id: fallbackProfile.id,
            email: fallbackProfile.email,
            full_name: fallbackProfile.full_name || "User",
            avatar_url: fallbackProfile.avatar_url,
            created_at: fallbackProfile.created_at,
          }
        }

        return {
          id: user.id,
          email: user.email || "",
          full_name: fullName,
          created_at: user.created_at,
        }
      } catch (error) {
        console.error("Error in profile creation:", error)
        return {
          id: user.id,
          email: user.email || "",
          full_name: fullName,
          created_at: user.created_at,
        }
      }
    }

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name || "User",
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
    }
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

export async function updateUserProfile(updates: Partial<Pick<UserProfile, "full_name" | "avatar_url">>) {
  try {
    const supabase = await createClient()
    const user = await getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single()

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error updating profile:", error)
    throw error
  }
}

export function isSupabaseConfigured(): boolean {
  return true
}
