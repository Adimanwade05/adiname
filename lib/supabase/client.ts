import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jxaxqwtqsbnbvhfgtnlb.supabase.co"
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4YXhxd3Rxc2JuYnZoZmd0bmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNTk5NTksImV4cCI6MjA2NzYzNTk1OX0.1ZGNDkWAuocBxHwzz1DJRpO11QbITsJm1F97WZmegSM"

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })
}

// Mock Supabase client for development/preview environments
function createMockSupabaseClient() {
  return {
    auth: {
      signInWithPassword: async () => ({ data: null, error: { message: "Preview mode - authentication disabled" } }),
      signUp: async () => ({ data: null, error: { message: "Preview mode - authentication disabled" } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: { message: "Preview mode - database disabled" } }),
      update: () => ({ data: null, error: { message: "Preview mode - database disabled" } }),
      upsert: () => ({ data: null, error: { message: "Preview mode - database disabled" } }),
      delete: () => ({ data: null, error: { message: "Preview mode - database disabled" } }),
    }),
  }
}
