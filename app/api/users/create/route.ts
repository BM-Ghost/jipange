import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, image, provider, providerId, accessToken, refreshToken } = body

    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      // Update existing user
      await sql`
        UPDATE users 
        SET 
          name = ${name},
          image = ${image},
          updated_at = NOW()
        WHERE email = ${email}
      `

      // Update or insert provider info
      await sql`
        INSERT INTO user_providers (user_id, provider, provider_id, access_token, refresh_token)
        VALUES (${existingUser[0].id}, ${provider}, ${providerId}, ${accessToken}, ${refreshToken})
        ON CONFLICT (user_id, provider) 
        DO UPDATE SET 
          access_token = ${accessToken},
          refresh_token = ${refreshToken},
          updated_at = NOW()
      `
    } else {
      // Create new user
      const newUser = await sql`
        INSERT INTO users (email, name, image, created_at, updated_at)
        VALUES (${email}, ${name}, ${image}, NOW(), NOW())
        RETURNING id
      `

      // Add provider info
      await sql`
        INSERT INTO user_providers (user_id, provider, provider_id, access_token, refresh_token)
        VALUES (${newUser[0].id}, ${provider}, ${providerId}, ${accessToken}, ${refreshToken})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("User creation error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
