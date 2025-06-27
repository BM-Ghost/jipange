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
    const { projectId, channels, preferences } = body

    // Get user
    const user = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user[0].id

    // Update user notification preferences
    await sql`
      UPDATE users 
      SET notification_preferences = ${JSON.stringify({
        ...preferences,
        channels,
        updated_at: new Date().toISOString(),
      })}
      WHERE id = ${userId}
    `

    // Create project-specific notification rules
    if (projectId) {
      const project = await sql`
        SELECT plan_data FROM project_plans WHERE id = ${projectId} AND user_id = ${userId}
      `

      if (project.length > 0) {
        const planData = JSON.parse(project[0].plan_data)

        // Schedule milestone notifications
        for (const milestone of planData.milestones || []) {
          const notificationDate = new Date(milestone.date)
          notificationDate.setDate(notificationDate.getDate() - 1) // 1 day before

          await sql`
            INSERT INTO scheduled_notifications (
              user_id,
              project_id,
              type,
              title,
              message,
              scheduled_for,
              channels,
              status
            ) VALUES (
              ${userId},
              ${projectId},
              'milestone_reminder',
              ${`Milestone Due Tomorrow: ${milestone.name}`},
              ${`Don't forget about the ${milestone.name} milestone due tomorrow. ${milestone.description}`},
              ${notificationDate.toISOString()},
              ${JSON.stringify(channels)},
              'scheduled'
            )
          `
        }

        // Schedule weekly progress reminders
        const startDate = new Date(planData.start_date)
        const endDate = new Date(planData.end_date)
        const currentDate = new Date(startDate)

        while (currentDate < endDate) {
          currentDate.setDate(currentDate.getDate() + 7) // Weekly

          if (currentDate < endDate) {
            await sql`
              INSERT INTO scheduled_notifications (
                user_id,
                project_id,
                type,
                title,
                message,
                scheduled_for,
                channels,
                status
              ) VALUES (
                ${userId},
                ${projectId},
                'weekly_progress',
                'Weekly Progress Check',
                'Time for your weekly progress review! Check your completed tasks and plan for the upcoming week.',
                ${currentDate.toISOString()},
                ${JSON.stringify(channels)},
                'scheduled'
              )
            `
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notifications have been set up successfully",
      preferences,
      channels,
    })
  } catch (error) {
    console.error("Notification setup error:", error)
    return NextResponse.json({ error: "Failed to setup notifications" }, { status: 500 })
  }
}
