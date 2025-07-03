import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Find and verify the reset token
    const resetToken = await sql`
      SELECT rt.*, u.user_id, u.email, u.name 
      FROM password_reset_tokens rt
      JOIN users u ON rt.user_id = u.user_id
      WHERE rt.token = ${token} AND rt.used = FALSE AND rt.expires_at > CURRENT_TIMESTAMP
    `

    if (resetToken.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    const tokenData = resetToken[0]

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12)

    // Update the user's password
    await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${tokenData.user_id}
    `

    // Mark the reset token as used
    await sql`
      UPDATE password_reset_tokens 
      SET used = TRUE 
      WHERE id = ${tokenData.id}
    `

    // Delete all other unused reset tokens for this user (security measure)
    await sql`
      DELETE FROM password_reset_tokens 
      WHERE user_id = ${tokenData.user_id} AND used = FALSE
    `

    console.log("✅ Password reset successfully for:", tokenData.email)

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now sign in with your new password.",
    })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ error: "Failed to reset password. Please try again." }, { status: 500 })
  }
}
