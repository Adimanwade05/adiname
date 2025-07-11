import { neon } from "@neondatabase/serverless"

// Use a fallback for development/preview environments
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  // Fallback for development - you can replace this with your actual database URL
  console.warn("DATABASE_URL not found, using fallback connection")
  return "postgresql://user:password@localhost:5432/authdb"
}

export const sql = neon(getDatabaseUrl())

export interface User {
  id: number
  name: string
  email: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: number
  session_id: string
  user_id: number
  expires_at: string
  created_at: string
}

export interface UserWithoutPassword {
  id: number
  name: string
  email: string
  created_at: string
  updated_at: string
}
