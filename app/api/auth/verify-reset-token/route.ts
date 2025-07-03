import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ valid: false, error: "Token is required" }, { status: 400 })
    }

    // Check if token exists and is not expired
    const resetToken = await sql`
      SELECT rt.*, u.email, u.name 
      FROM password_reset_tokens rt
      JOIN users u ON rt.user_id = u.user_id
      WHERE rt.token = ${token} AND rt.used = FALSE AND rt.expires_at > CURRENT_TIMESTAMP
    `

    if (resetToken.length === 0) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid or expired reset token",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      valid: true,
      email: resetToken[0].email,
    })
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json(
      {
        valid: false,
        error: "Failed to verify token",
      },
      { status: 500 },
    )
  }
}
