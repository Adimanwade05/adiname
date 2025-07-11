import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/auth/success"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure user profile exists after email confirmation
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

      if (!profile) {
        // Create profile if it doesn't exist
        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "User"

        const { error: profileError } = await supabase.rpc("create_user_profile", {
          user_id: data.user.id,
          user_email: data.user.email || "",
          user_full_name: fullName,
        })

        if (profileError) {
          console.error("Error creating profile:", profileError)
          // Fallback to direct insert
          await supabase.from("profiles").insert({
            id: data.user.id,
            email: data.user.email || "",
            full_name: fullName,
          })
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
