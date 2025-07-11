import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Key, Hash, FileText, CheckCircle, AlertTriangle } from "lucide-react"

export function FacebookSetupGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            Step 1: Get Your Page Access Token
          </CardTitle>
          <CardDescription>You need a Facebook Page Access Token with leads_retrieval permission</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">How to get Page Access Token:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>
                Go to{" "}
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  className="underline"
                  rel="noreferrer"
                >
                  Facebook Graph API Explorer
                </a>
              </li>
              <li>Select your Facebook App</li>
              <li>Click "Get Token" → "Get Page Access Token"</li>
              <li>Select your Facebook Page</li>
              <li>
                Add these permissions: <Badge variant="secondary">leads_retrieval</Badge>{" "}
                <Badge variant="secondary">pages_read_engagement</Badge>
              </li>
              <li>Copy the generated token</li>
            </ol>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Page Access Tokens expire! For production, use a long-lived token or implement
              token refresh.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-green-600" />
            Step 2: Find Your Page ID
          </CardTitle>
          <CardDescription>Your Facebook Page's unique identifier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">How to find Page ID:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-green-800">
              <li>Go to your Facebook Page</li>
              <li>Click "About" in the left sidebar</li>
              <li>Scroll down to find "Page ID" or "Facebook Page ID"</li>
              <li>
                Or use Graph API Explorer: <code className="bg-white px-2 py-1 rounded">me/accounts</code>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Step 3: Get Your Lead Form ID
          </CardTitle>
          <CardDescription>The ID of your specific lead generation form</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-900 mb-2">How to find Lead Form ID:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-purple-800">
              <li>Go to Facebook Ads Manager</li>
              <li>Navigate to "All Tools" → "Lead Ads Forms"</li>
              <li>Find your form and note the ID in the URL or form details</li>
              <li>
                Or use Graph API: <code className="bg-white px-2 py-1 rounded">{`{PAGE_ID}/leadgen_forms`}</code>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Step 4: After Fetching Leads
          </CardTitle>
          <CardDescription>What happens next and what you can do</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <h4 className="font-medium text-emerald-900 mb-2">✅ Leads are automatically:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-emerald-800">
                <li>Stored in your database</li>
                <li>Deduplicated (no duplicates)</li>
                <li>Parsed for name, email, phone</li>
                <li>Timestamped with submission date</li>
                <li>Tagged as "Facebook API" source</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">🎯 Next actions you can take:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                <li>View leads in "View All Leads" tab</li>
                <li>Export leads to CSV</li>
                <li>Add manual leads</li>
                <li>Update lead status</li>
                <li>Add notes and activities</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900">🔧 Troubleshooting Common Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong className="text-orange-900">Error: "Invalid access token"</strong>
              <p className="text-orange-800">→ Token expired or doesn't have leads_retrieval permission</p>
            </div>
            <div>
              <strong className="text-orange-900">Error: "No leads found"</strong>
              <p className="text-orange-800">→ Form might not have any submissions yet, or wrong Form ID</p>
            </div>
            <div>
              <strong className="text-orange-900">Error: "Page not found"</strong>
              <p className="text-orange-800">→ Check if Page ID is correct and token has access to that page</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
