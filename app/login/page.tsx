"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { loginAction, resendConfirmationEmail } from "@/app/actions/auth"
import { Database, LogIn, AlertTriangle, CheckCircle, Mail, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  // Handle successful login
  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      router.push(state.redirectTo)
    }
  }, [state?.success, state?.redirectTo, router])

  const handleResendConfirmation = async () => {
    const emailInput = document.getElementById("email") as HTMLInputElement
    const email = emailInput?.value

    if (email) {
      const result = await resendConfirmationEmail(email)
      alert(result.success ? result.message : result.error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <Badge variant="default" className="bg-green-600">
              <Database className="w-3 h-3 mr-1" />
              Supabase
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
                disabled={isPending}
                className="transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  disabled={isPending}
                  className="transition-all duration-200 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {state?.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {state?.needsEmailConfirmation && (
              <Alert className="border-blue-200 bg-blue-50">
                <Mail className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Email Confirmation Required</strong>
                  <br />
                  Please check your email and click the confirmation link first.
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-blue-600 underline ml-1"
                    onClick={handleResendConfirmation}
                  >
                    Resend confirmation email
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {state?.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Login successful! Redirecting to dashboard...
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              <LogIn className="w-4 h-4 mr-2" />
              {isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">
              Create one
            </Link>
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-800 font-medium">Powered by Supabase</p>
            </div>
            <p className="text-xs text-green-700">Secure authentication with PostgreSQL database</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
