import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { planId, confirmed } = body

    // Get user
    const user = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user[0].id

    // Update project plan status
    await sql`
      UPDATE project_plans 
      SET 
        status = ${confirmed ? "confirmed" : "draft"},
        confirmed_at = ${confirmed ? "NOW()" : null},
        updated_at = NOW()
      WHERE id = ${planId} AND user_id = ${userId}
    `

    if (confirmed) {
      // Update all related tasks to active status
      await sql`
        UPDATE tasks 
        SET 
          status = 'active',
          updated_at = NOW()
        WHERE project_plan_id = ${planId} AND user_id = ${userId}
      `
    }

    return NextResponse.json({
      success: true,
      message: confirmed ? "Project plan confirmed and activated" : "Project plan saved as draft",
      status: confirmed ? "confirmed" : "draft",
    })
  } catch (error) {
    console.error("Project confirmation error:", error)
    return NextResponse.json({ error: "Failed to confirm project" }, { status: 500 })
  }
}
