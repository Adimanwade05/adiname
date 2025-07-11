"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function supabaseLoginAction(prevState: any, formData: FormData) {
  const supabase = await createClient()

  try {
    const rawData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    }

    const validatedData = loginSchema.parse(rawData)

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error("Login error:", error)
    return { error: "An error occurred during login" }
  }

  redirect("/welcome")
}

export async function supabaseSignupAction(prevState: any, formData: FormData) {
  const supabase = await createClient()

  try {
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    }

    const validatedData = signupSchema.parse(rawData)

    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (!data.user) {
      return { error: "Signup failed" }
    }

    // Check if email confirmation is required
    if (!data.session) {
      return {
        success: true,
        message: "Please check your email to confirm your account before signing in.",
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error("Signup error:", error)
    return { error: "An error occurred during signup" }
  }

  redirect("/welcome")
}

export async function supabaseLogoutAction() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Logout error:", error)
  }

  redirect("/login")
}
