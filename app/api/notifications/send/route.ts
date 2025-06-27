import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { neon } from "@neondatabase/serverless"
import nodemailer from "nodemailer"

const sql = neon(process.env.DATABASE_URL!)

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, message, taskId, projectId, scheduleTime, channels } = body

    // Get user preferences
    const user = await sql`
      SELECT id, email, name, notification_preferences 
      FROM users 
      WHERE email = ${session.user.email}
    `

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user[0].id
    const userEmail = user[0].email
    const userName = user[0].name
    const preferences = user[0].notification_preferences || {}

    // Create notification record
    const notification = await sql`
      INSERT INTO notifications (
        user_id, 
        type, 
        title, 
        message, 
        task_id, 
        project_id,
        scheduled_for,
        channels,
        status,
        created_at
      ) VALUES (
        ${userId},
        ${type},
        ${title},
        ${message},
        ${taskId || null},
        ${projectId || null},
        ${scheduleTime || null},
        ${JSON.stringify(channels)},
        'pending',
        NOW()
      ) RETURNING id
    `

    const notificationId = notification[0].id

    // Send notifications based on channels
    const results = []

    if (channels.includes("email") && preferences.email !== false) {
      const emailResult = await sendEmailNotification(userEmail, userName, title, message, type)
      results.push({ channel: "email", success: emailResult.success, error: emailResult.error })
    }

    if (channels.includes("push") && preferences.push !== false) {
      const pushResult = await sendPushNotification(userId, title, message, type)
      results.push({ channel: "push", success: pushResult.success, error: pushResult.error })
    }

    if (channels.includes("sms") && preferences.sms !== false && user[0].phone) {
      const smsResult = await sendSMSNotification(user[0].phone, title, message)
      results.push({ channel: "sms", success: smsResult.success, error: smsResult.error })
    }

    // Update notification status
    const allSuccessful = results.every((r) => r.success)
    await sql`
      UPDATE notifications 
      SET 
        status = ${allSuccessful ? "sent" : "partial"},
        sent_at = NOW(),
        delivery_results = ${JSON.stringify(results)}
      WHERE id = ${notificationId}
    `

    return NextResponse.json({
      success: true,
      notificationId,
      results,
      message: `Notification sent via ${results.filter((r) => r.success).length} of ${results.length} channels`,
    })
  } catch (error) {
    console.error("Notification error:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}

async function sendEmailNotification(email: string, name: string, title: string, message: string, type: string) {
  try {
    const emailTemplate = getEmailTemplate(type, title, message, name)

    await transporter.sendMail({
      from: `"Jipange AI" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `🎯 ${title}`,
      html: emailTemplate,
    })

    return { success: true }
  } catch (error) {
    console.error("Email notification error:", error)
    return { success: false, error: typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error) }
  }
}

async function sendPushNotification(userId: string, title: string, message: string, type: string) {
  try {
    // Get user's push subscription
    const subscriptions = await sql`
      SELECT subscription_data FROM push_subscriptions WHERE user_id = ${userId} AND active = true
    `

    if (subscriptions.length === 0) {
      return { success: false, error: "No push subscriptions found" }
    }

    // Send push notifications (implement with web-push library)
    // This is a placeholder - implement actual push notification logic

    return { success: true }
  } catch (error) {
    return { success: false, error: typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error) }
  }
}

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Sends an SMS notification to a specified phone number.
 *
 * @param phone - The recipient's phone number.
 * @param title - The title of the message.
 * @param message - The message content to be sent.
 * @returns A promise that resolves to an object indicating the success status of the operation.
 */

/*******  c1731978-8037-4183-927d-1da328c5a0e7  *******/
async function sendSMSNotification(phone: string, title: string, message: string) {
  try {
    // Implement SMS sending (Twilio, etc.)
    // This is a placeholder

    return { success: true }
  } catch (error) {
    return { success: false, error: typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error) }
  }
}

function getEmailTemplate(type: string, title: string, message: string, name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .message { background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { background-color: #1e293b; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .button { display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Jipange AI</h1>
        </div>
        <div class="content">
            <h2>Hi ${name}!</h2>
            <h3>${title}</h3>
            <div class="message">
                ${message.replace(/\n/g, "<br>")}
            </div>
            <a href="${process.env.NEXTAUTH_URL}" class="button">Open Jipange</a>
        </div>
        <div class="footer">
            <p>This notification was sent by Jipange AI - Your Productivity Assistant</p>
            <p><a href="${process.env.NEXTAUTH_URL}/settings/notifications" style="color: #8b5cf6;">Manage Notifications</a></p>
        </div>
    </div>
</body>
</html>
`
}
