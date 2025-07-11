import { requireAuth } from "@/lib/supabase/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { User, Calendar, Mail, Database, Facebook, Users, Settings, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const user = await requireAuth()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader title="Dashboard" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Welcome Card */}
        <div className="md:col-span-2 lg:col-span-3">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-white">
                  <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.full_name} />
                  <AvatarFallback className="bg-white text-green-600 text-lg font-bold">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl font-bold">Hi {user.full_name}! 👋</CardTitle>
                  <CardDescription className="text-green-100">Welcome back to your dashboard</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-green-100">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Member Since</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{formatDate(user.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facebook Leads</CardTitle>
            <Facebook className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mb-4">Total leads collected</p>
            <Button asChild size="sm" className="w-full">
              <Link href="/dashboard/facebook-leads">
                Manage Leads
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mb-4">Total contacts</p>
            <Button asChild size="sm" variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/contacts">
                View Contacts
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settings</CardTitle>
            <Settings className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mb-4">Active configurations</p>
            <Button asChild size="sm" variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/settings">
                Configure
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            <CardTitle>Profile Information</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Database className="w-3 h-3 mr-1" />
              Supabase
            </Badge>
          </div>
          <CardDescription>Your account information stored securely</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Full Name</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                  <span className="text-gray-900">{user.full_name}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Email Address</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                  <span className="text-gray-900">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">User ID</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                  <span className="text-gray-900 font-mono text-xs">{user.id}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Account Created</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                  <span className="text-gray-900">{formatDate(user.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
