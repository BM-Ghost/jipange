"use server"

import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: Request) {
  try {
    const { emailOrUsername, password } = await req.json()

    if (!emailOrUsername || !password) {
      return new Response(JSON.stringify({ error: "Email/username and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Find user by email or username
    const user = await sql`
      SELECT id, email, username, name, password_hash, email_verified 
      FROM users 
      WHERE email = ${emailOrUsername} OR username = ${emailOrUsername}
    `

    if (user.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const userData = user[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash)
    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check if email is verified
    if (!userData.email_verified) {
      return new Response(JSON.stringify({ error: "Please verify your email address" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Return user data without sensitive information
    const { password_hash, ...userWithoutPassword } = userData
    return new Response(JSON.stringify(userWithoutPassword), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error("Login error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
