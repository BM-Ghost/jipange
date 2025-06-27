import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { google } from "googleapis"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's Google access token
    const userTokens = await sql`
      SELECT up.access_token, up.refresh_token
      FROM users u
      JOIN user_providers up ON u.id = up.user_id
      WHERE u.email = ${session.user.email} AND up.provider = 'google'
    `

    if (userTokens.length === 0) {
      return NextResponse.json({ error: "Google account not connected" }, { status: 400 })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + "/api/auth/callback/google",
    )

    oauth2Client.setCredentials({
      access_token: userTokens[0].access_token,
      refresh_token: userTokens[0].refresh_token,
    })

    const calendar = google.calendar({ version: "v3", auth: oauth2Client })

    // Get calendar events
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    })

    return NextResponse.json({
      events: response.data.items || [],
      success: true,
    })
  } catch (error) {
    console.error("Google Calendar API error:", error)
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectPlanId, tasks, confirmExport } = body

    if (!confirmExport) {
      return NextResponse.json({ error: "Export not confirmed" }, { status: 400 })
    }

    // Get user's Google access token
    const userTokens = await sql`
      SELECT up.access_token, up.refresh_token, u.id as user_id
      FROM users u
      JOIN user_providers up ON u.id = up.user_id
      WHERE u.email = ${session.user.email} AND up.provider = 'google'
    `

    if (userTokens.length === 0) {
      return NextResponse.json({ error: "Google account not connected" }, { status: 400 })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + "/api/auth/callback/google",
    )

    oauth2Client.setCredentials({
      access_token: userTokens[0].access_token,
      refresh_token: userTokens[0].refresh_token,
    })

    const calendar = google.calendar({ version: "v3", auth: oauth2Client })

    // Get project plan details
    const projectPlan = await sql`
      SELECT * FROM project_plans WHERE id = ${projectPlanId} AND user_id = ${userTokens[0].user_id}
    `

    if (projectPlan.length === 0) {
      return NextResponse.json({ error: "Project plan not found" }, { status: 404 })
    }

    const plan = JSON.parse(projectPlan[0].plan_data)
    const createdEvents = []

    // Create calendar events for milestones
    for (const milestone of plan.milestones) {
      const event = {
        summary: `🎯 ${milestone.name} - ${plan.project_name}`,
        description: `${milestone.description}\n\nProject: ${plan.project_name}\nCreated by Jipange AI`,
        start: {
          date: milestone.date,
        },
        end: {
          date: milestone.date,
        },
        colorId: "9", // Blue color for milestones
      }

      try {
        const response = await calendar.events.insert({
          calendarId: "primary",
          requestBody: event,
        })
        createdEvents.push(response.data)
      } catch (error) {
        console.error("Error creating milestone event:", error)
      }
    }

    // Create calendar events for high-priority tasks
    for (const phase of plan.phases) {
      for (const task of phase.tasks) {
        if (task.priority === "high" || task.priority === "urgent") {
          // Calculate task date based on phase timing
          const phaseStartDate = new Date(plan.start_date)
          const taskDate = new Date(phaseStartDate)
          taskDate.setDate(
            taskDate.getDate() + ((phase.duration_weeks * 7) / phase.tasks.length) * phase.tasks.indexOf(task),
          )

          const event = {
            summary: `${task.priority === "urgent" ? "🚨" : "⚡"} ${task.title}`,
            description: `${task.description}\n\nPhase: ${phase.name}\nProject: ${plan.project_name}\nEstimated Duration: ${task.estimated_duration} hours\n\nCreated by Jipange AI`,
            start: {
              dateTime: taskDate.toISOString(),
            },
            end: {
              dateTime: new Date(taskDate.getTime() + task.estimated_duration * 60 * 60 * 1000).toISOString(),
            },
            colorId: task.priority === "urgent" ? "11" : "8", // Red for urgent, green for high
          }

          try {
            const response = await calendar.events.insert({
              calendarId: "primary",
              requestBody: event,
            })
            createdEvents.push(response.data)
          } catch (error) {
            console.error("Error creating task event:", error)
          }
        }
      }
    }

    // Update project plan status
    await sql`
      UPDATE project_plans 
      SET 
        status = 'active',
        calendar_synced = true,
        updated_at = NOW()
      WHERE id = ${projectPlanId}
    `

    return NextResponse.json({
      success: true,
      eventsCreated: createdEvents.length,
      events: createdEvents,
      message: `Successfully exported ${createdEvents.length} events to Google Calendar!`,
    })
  } catch (error) {
    console.error("Calendar export error:", error)
    return NextResponse.json({ error: "Failed to export to calendar" }, { status: 500 })
  }
}
