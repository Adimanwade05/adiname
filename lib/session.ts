import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionUser, deleteSession, type UserWithoutPassword } from "./auth"
import { fallbackGetSessionUser, fallbackDeleteSession } from "./fallback-auth"

const isDatabaseAvailable = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost")

export async function setSessionCookie(sessionId: string) {
  const cookieStore = await cookies()

  cookieStore.set("session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function getSession(): Promise<UserWithoutPassword | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("session")

  if (!sessionCookie) {
    return null
  }

  try {
    let user
    if (isDatabaseAvailable) {
      user = await getSessionUser(sessionCookie.value)
    } else {
      user = await fallbackGetSessionUser(sessionCookie.value)
    }
    return user
  } catch (error) {
    console.error("Session error:", error)
    return null
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("session")

  if (sessionCookie) {
    if (isDatabaseAvailable) {
      await deleteSession(sessionCookie.value)
    } else {
      await fallbackDeleteSession(sessionCookie.value)
    }
  }

  cookieStore.delete("session")
}

export async function requireAuth(): Promise<UserWithoutPassword> {
  const user = await getSession()
  if (!user) {
    redirect("/login")
  }
  return user
}
