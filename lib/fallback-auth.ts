// Fallback in-memory authentication for development/preview
interface InMemoryUser {
  id: number
  name: string
  email: string
  password: string
  created_at: string
  updated_at: string
}

interface InMemorySession {
  sessionId: string
  userId: number
  expiresAt: Date
}

// In-memory storage
const users: InMemoryUser[] = [
  {
    id: 1,
    name: "Demo User",
    email: "demo@example.com",
    password: "password123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const sessions: InMemorySession[] = []

export async function fallbackCreateUser(name: string, email: string, password: string) {
  // Check if user exists
  if (users.find((u) => u.email === email)) {
    throw new Error("User already exists")
  }

  const newUser: InMemoryUser = {
    id: users.length + 1,
    name,
    email,
    password,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  users.push(newUser)

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    created_at: newUser.created_at,
    updated_at: newUser.updated_at,
  }
}

export async function fallbackGetUserByEmail(email: string) {
  return users.find((u) => u.email === email) || null
}

export async function fallbackVerifyPassword(password: string, userPassword: string) {
  return password === userPassword
}

export async function fallbackCreateSession(userId: number) {
  const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  sessions.push({ sessionId, userId, expiresAt })
  return sessionId
}

export async function fallbackGetSessionUser(sessionId: string) {
  const session = sessions.find((s) => s.sessionId === sessionId && s.expiresAt > new Date())
  if (!session) return null

  const user = users.find((u) => u.id === session.userId)
  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}

export async function fallbackDeleteSession(sessionId: string) {
  const index = sessions.findIndex((s) => s.sessionId === sessionId)
  if (index > -1) {
    sessions.splice(index, 1)
  }
}
