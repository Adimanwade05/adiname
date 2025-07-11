import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export interface SupabaseUser {
  id: string
  email: string
  name: string
  created_at: string
}

export async function getSupabaseSession(): Promise<SupabaseUser | null> {
  const supabase = await createClient()

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return null
    }

    return {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.user_metadata?.name || session.user.email || "User",
      created_at: session.user.created_at,
    }
  } catch (error) {
    console.error("Session error:", error)
    return null
  }
}

export async function requireSupabaseAuth(): Promise<SupabaseUser> {
  const user = await getSupabaseSession()
  if (!user) {
    redirect("/login")
  }
  return user
}
