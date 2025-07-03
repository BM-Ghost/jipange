import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = body

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
    }

    // Find the most recent unused verification token for this email
    const verificationRecord = await sql`
      SELECT vt.*, u.email, u.name 
      FROM email_verification_tokens vt
      JOIN users u ON vt.user_id = u.user_id
      WHERE u.email = ${email} 
        AND vt.used = FALSE 
        AND vt.expires_at > CURRENT_TIMESTAMP
        AND vt.otp = ${otp}
      ORDER BY vt.created_at DESC
      LIMIT 1
    `

    if (verificationRecord.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid verification code or code has expired. Please request a new one.",
        },
        { status: 400 },
      )
    }

    const record = verificationRecord[0]

    // Mark user as verified
    await sql`
      UPDATE users 
      SET email_verified = TRUE, email_verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${record.user_id}
    `

    // Mark token as used
    await sql`
      UPDATE email_verification_tokens 
      SET used = TRUE 
      WHERE id = ${record.id}
    `

    console.log("✅ Email verified successfully via OTP for:", record.email)

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now sign in.",
    })
  } catch (error) {
    console.error("OTP verification error:", error)
    return NextResponse.json({ error: "Failed to verify code. Please try again." }, { status: 500 })
  }
}
