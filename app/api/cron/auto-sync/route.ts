import { runAutoSync } from "@/app/actions/auto-sync"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Auto-sync cron job triggered")
    const result = await runAutoSync()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Auto-sync cron job failed:", error)
    return NextResponse.json(
      { error: "Auto-sync failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST() {
  // Allow manual triggering via POST
  return GET()
}
