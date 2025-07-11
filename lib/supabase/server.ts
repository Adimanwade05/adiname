import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jxaxqwtqsbnbvhfgtnlb.supabase.co"
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4YXhxd3Rxc2JuYnZoZmd0bmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNTk5NTksImV4cCI6MjA2NzYzNTk1OX0.1ZGNDkWAuocBxHwzz1DJRpO11QbITsJm1F97WZmegSM"

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch (error) {
          console.warn("Cookie setting error:", error)
        }
      },
    },
  })
}
