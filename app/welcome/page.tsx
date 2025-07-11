import { requireSupabaseAuth } from "@/lib/supabase/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabaseLogoutAction } from "@/app/actions/supabase-auth"
import { User, Calendar, Mail, Database } from "lucide-react"

export default async function WelcomePage() {
  const user = await requireSupabaseAuth()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Welcome back, {user.name}! 🎉
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">Great to see you again</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-800">Account Information</h3>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Supabase
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Email:</span>
                <Badge variant="secondary">{user.email}</Badge>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">User ID:</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {user.id.substring(0, 8)}...
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Member since:</span>
                <span className="text-sm text-gray-700">{formatDate(user.created_at)}</span>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-center">✅ You are successfully authenticated with Supabase!</p>
            </div>

            <div className="pt-4 space-y-3">
              <form action={supabaseLogoutAction}>
                <Button type="submit" variant="outline" className="w-full bg-transparent">
                  Sign Out
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
