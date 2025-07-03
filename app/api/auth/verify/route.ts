import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, otp } = body

    // Find verification token
    const verificationRecord = await sql`
      SELECT vt.*, u.email, u.name 
      FROM email_verification_tokens vt
      JOIN users u ON vt.user_id = u.user_id
      WHERE vt.token = ${token} AND vt.used = FALSE AND vt.expires_at > CURRENT_TIMESTAMP
    `

    if (verificationRecord.length === 0) {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 })
    }

    const record = verificationRecord[0]

    // If OTP is provided, verify it
    if (otp && record.otp !== otp) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
    }

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

    console.log("✅ Email verified successfully for:", record.email)

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now sign in.",
    })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ error: "Failed to verify email. Please try again." }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/auth/verify", request.url))
  }

  try {
    // Auto-verify from email link
    const verificationRecord = await sql`
      SELECT vt.*, u.email, u.name 
      FROM email_verification_tokens vt
      JOIN users u ON vt.user_id = u.user_id
      WHERE vt.token = ${token} AND vt.used = FALSE AND vt.expires_at > CURRENT_TIMESTAMP
    `

    if (verificationRecord.length === 0) {
      return NextResponse.redirect(new URL(`/auth/verify?error=Invalid or expired verification token`, request.url))
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

    console.log("✅ Email verified successfully for:", record.email)

    return NextResponse.redirect(new URL("/auth/signin?verified=true", request.url))
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.redirect(new URL(`/auth/verify?error=Failed to verify email`, request.url))
  }
}
