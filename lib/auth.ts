import bcrypt from "bcryptjs"
import { sql, type User, type UserWithoutPassword } from "./db"
import { randomBytes } from "crypto"

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createUser(name: string, email: string, password: string): Promise<UserWithoutPassword> {
  try {
    const passwordHash = await hashPassword(password)

    const result = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id, name, email, created_at, updated_at
    `

    return result[0] as UserWithoutPassword
  } catch (error) {
    console.error("Database error creating user:", error)
    throw new Error("Failed to create user")
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT id, name, email, password_hash, created_at, updated_at
      FROM users
      WHERE email = ${email}
    `

    return (result[0] as User) || null
  } catch (error) {
    console.error("Database error getting user by email:", error)
    return null
  }
}

export async function getUserById(id: number): Promise<UserWithoutPassword | null> {
  try {
    const result = await sql`
      SELECT id, name, email, created_at, updated_at
      FROM users
      WHERE id = ${id}
    `

    return (result[0] as UserWithoutPassword) || null
  } catch (error) {
    console.error("Database error getting user by ID:", error)
    return null
  }
}

export function generateSessionId(): string {
  return randomBytes(32).toString("hex")
}

export async function createSession(userId: number): Promise<string> {
  try {
    const sessionId = generateSessionId()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await sql`
      INSERT INTO sessions (session_id, user_id, expires_at)
      VALUES (${sessionId}, ${userId}, ${expiresAt})
    `

    return sessionId
  } catch (error) {
    console.error("Database error creating session:", error)
    throw new Error("Failed to create session")
  }
}

export async function getSessionUser(sessionId: string): Promise<UserWithoutPassword | null> {
  try {
    const result = await sql`
      SELECT u.id, u.name, u.email, u.created_at, u.updated_at
      FROM users u
      JOIN sessions s ON u.id = s.user_id
      WHERE s.session_id = ${sessionId} AND s.expires_at > NOW()
    `

    return (result[0] as UserWithoutPassword) || null
  } catch (error) {
    console.error("Database error getting session user:", error)
    return null
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await sql`
      DELETE FROM sessions
      WHERE session_id = ${sessionId}
    `
  } catch (error) {
    console.error("Database error deleting session:", error)
  }
}

export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await sql`
      DELETE FROM sessions
      WHERE expires_at < NOW()
    `
  } catch (error) {
    console.error("Database error cleaning up sessions:", error)
  }
}
