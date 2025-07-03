import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailOrUsername, password } = body

    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: "Email/username and password are required" }, { status: 400 })
    }

    // Find user by email or username
    const user = await sql`
      SELECT user_id, email, username, name, password_hash, email_verified 
      FROM users 
      WHERE email = ${emailOrUsername} OR username = ${emailOrUsername}
    `

    if (user.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
    }

    const userData = user[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
    }

    // Check if email is verified
    if (!userData.email_verified) {
      return NextResponse.json(
        {
          error: "Please verify your email address before signing in",
          needsVerification: true,
          email: userData.email,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        user_id: userData.user_id,
        email: userData.email,
        username: userData.username,
        name: userData.name,
      },
    })
  } catch (error) {
    console.error("Sign in error:", error)
    return NextResponse.json({ error: "Failed to sign in. Please try again." }, { status: 500 })
  }
}
