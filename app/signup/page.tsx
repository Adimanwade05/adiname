"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { signupAction, resendConfirmationEmail } from "@/app/actions/auth"
import { Database, UserPlus, CheckCircle, Mail, RefreshCw, AlertTriangle, Eye, EyeOff } from "lucide-react"

export default function SignupPage() {
  const [state, action, isPending] = useActionState(signupAction, null)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 6) strength += 25
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    return strength
  }

  const passwordStrength = getPasswordStrength(password)

  const handleResendConfirmation = async () => {
    if (!state?.email) return

    setIsResending(true)
    setResendMessage("")

    try {
      const result = await resendConfirmationEmail(state.email)
      if (result.success) {
        setResendMessage("✅ " + result.message)
      } else {
        setResendMessage("❌ " + result.error)
      }
    } catch (error) {
      setResendMessage("❌ Failed to resend email")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <Badge variant="default" className="bg-green-600">
              <Database className="w-3 h-3 mr-1" />
              Supabase
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">Join us today and get started</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Show email confirmation message if signup was successful */}
          {state?.success && state?.requiresEmailConfirmation ? (
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <Mail className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Check Your Email!</strong>
                  <br />
                  {state.message}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="text-center">
                  <h3 className="font-medium text-gray-900 mb-2">What's next?</h3>
                  <ol className="text-sm text-gray-600 space-y-1 text-left">
                    <li>
                      1. Check your email inbox for <strong>{state.email}</strong>
                    </li>
                    <li>2. Click the confirmation link in the email</li>
                    <li>3. You'll be redirected back to complete your registration</li>
                    <li>4. Your profile will be automatically created</li>
                  </ol>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">Didn't receive the email?</p>
                  <Button
                    onClick={handleResendConfirmation}
                    disabled={isResending}
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Resend Confirmation Email
                      </>
                    )}
                  </Button>

                  {resendMessage && <p className="text-sm mt-2 text-center">{resendMessage}</p>}
                </div>

                <div className="text-center pt-4 border-t">
                  <Link href="/login" className="text-blue-600 hover:underline text-sm">
                    ← Back to Login
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Show signup form */
            <>
              <form action={action} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    required
                    disabled={isPending}
                    className="transition-all duration-200"
                  />
                </div>
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
                      placeholder="Create a secure password"
                      required
                      disabled={isPending}
                      className="transition-all duration-200 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                  {password && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Password strength</span>
                        <span
                          className={
                            passwordStrength >= 75
                              ? "text-green-600"
                              : passwordStrength >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
                          }
                        >
                          {passwordStrength >= 75 ? "Strong" : passwordStrength >= 50 ? "Medium" : "Weak"}
                        </span>
                      </div>
                      <Progress value={passwordStrength} className="h-2" />
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
                </div>

                {state?.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                )}

                {state?.success && !state?.requiresEmailConfirmation && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{state.message}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isPending}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isPending ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link href="/login" className="text-green-600 hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </>
          )}

          <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-800 font-medium">Powered by Supabase</p>
            </div>
            <p className="text-xs text-green-700">
              {state?.requiresEmailConfirmation
                ? "Email verification ensures account security"
                : "Your data is stored securely in PostgreSQL"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
