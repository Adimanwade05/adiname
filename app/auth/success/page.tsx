"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Database, ArrowRight, Sparkles } from "lucide-react"

export default function AuthSuccessPage() {
  const [countdown, setCountdown] = useState(5)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push("/dashboard")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleContinue = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-green-800">Welcome!</CardTitle>
            <CardDescription className="text-green-600">Your email has been verified successfully</CardDescription>
          </div>
          <Badge variant="default" className="bg-green-600 mx-auto">
            <Database className="w-3 h-3 mr-1" />
            Account Activated
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Email verified</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Profile created</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Account activated</span>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 mb-2">
              <strong>You're all set!</strong>
            </p>
            <p className="text-xs text-green-700">
              Your account is now active and ready to use. You'll be redirected to your dashboard automatically.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleContinue} className="w-full bg-green-600 hover:bg-green-700">
              Continue to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-gray-500">
              Auto-redirecting in {countdown} second{countdown !== 1 ? "s" : ""}...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
