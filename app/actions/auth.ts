"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function loginAction(prevState: any, formData: FormData) {
  try {
    const rawData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    }

    const validatedData = loginSchema.parse(rawData)
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      return { error: error.message }
    }

    if (!data.user) {
      return { error: "Login failed" }
    }

    // Check if email is confirmed
    if (!data.user.email_confirmed_at) {
      return {
        error: "Please check your email and click the confirmation link before signing in.",
        needsEmailConfirmation: true,
      }
    }

    // Ensure user profile exists
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

    if (!profile) {
      // Create profile if it doesn't exist
      const fullName =
        data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User"

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

    return { success: true, redirectTo: "/dashboard" }
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }

    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }

    console.error("Login error:", error)
    return { error: "An error occurred during login. Please try again." }
  }
}

export async function signupAction(prevState: any, formData: FormData) {
  try {
    const rawData = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    }

    const validatedData = signupSchema.parse(rawData)
    const supabase = await createClient()

    // Sign up user with email confirmation required
    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.fullName,
          name: validatedData.fullName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (!data.user) {
      return { error: "Signup failed" }
    }

    // Check if user needs email confirmation
    if (!data.session) {
      return {
        success: true,
        requiresEmailConfirmation: true,
        email: validatedData.email,
        message: `We've sent a confirmation email to ${validatedData.email}. Please check your inbox and click the confirmation link to activate your account.`,
      }
    }

    // If user is immediately confirmed (shouldn't happen with email confirmation enabled)
    return {
      success: true,
      redirectTo: "/dashboard",
      message: "Account created successfully! Redirecting...",
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }

    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }

    console.error("Signup error:", error)
    return { error: "An error occurred during signup. Please try again." }
  }
}

export async function resendConfirmationEmail(email: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    })

    if (error) {
      return { error: error.message }
    }

    return {
      success: true,
      message: "Confirmation email sent! Please check your inbox.",
    }
  } catch (error) {
    console.error("Resend confirmation error:", error)
    return { error: "Failed to resend confirmation email" }
  }
}

export async function logoutAction() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Logout error:", error)
    }
  } catch (error) {
    console.error("Logout action error:", error)
  }

  redirect("/login")
}
