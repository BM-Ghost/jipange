import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import nodemailer from "nodemailer"


const sql = neon(process.env.DATABASE_URL!)

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Generate unique user ID
function generateUserId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10)
  return `user_${timestamp}_${random}`
}

// Simple email simulation for preview environment
async function sendVerificationEmail(email: string, name: string, token: string, otp: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2>👋 Hello ${name},</h2>
      <p>Thank you for signing up for <strong>Jipange</strong>!</p>
      <p>Please verify your email address by clicking the button below:</p>
      <p style="text-align: center; margin: 20px 0;">
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          🔗 Verify Email
        </a>
      </p>
      <p>Or you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${verificationUrl}</p>
      <hr />
      <p><strong>Your One-Time Passcode (OTP):</strong></p>
      <p style="font-size: 24px; font-weight: bold; color: #4CAF50;">${otp}</p>
      <p>This OTP is valid for a limited time. Do not share it with anyone.</p>
      <br />
      <p>Cheers,<br />The Jipange Team 💚</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Verify your email address - Jipange 💌',
      html: htmlContent,
    });

    console.log('✅ Verification email sent:', info.response);
  } catch (err) {
    console.error('❌ Failed to send verification email:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, username, email, password, confirmPassword } = body

    // Validation
    if (!name || !username || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    if (username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters long" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT user_id, email, username, email_verified FROM users 
      WHERE email = ${email} OR username = ${username}
    `

    if (existingUser.length > 0) {
      const user = existingUser[0]

      // If user exists and is verified, they can't sign up again
      if (user.email_verified) {
        if (user.email === email) {
          return NextResponse.json(
            { error: "An account with this email already exists and is verified. Please sign in instead." },
            { status: 400 },
          )
        }
        if (user.username === username) {
          return NextResponse.json(
            { error: "This username is already taken. Please choose a different username." },
            { status: 400 },
          )
        }
      }

      // If user exists but is NOT verified, allow them to "re-register"
      if (!user.email_verified) {
        // Delete the unverified user and their tokens
        await sql`DELETE FROM email_verification_tokens WHERE user_id = ${user.user_id}`
        await sql`DELETE FROM users WHERE user_id = ${user.user_id}`

        console.log("🔄 Removed unverified user account for re-registration:", email)
      }
    }

    // Generate unique user ID
    const userId = generateUserId()

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await sql`
      INSERT INTO users (user_id, name, username, email, password_hash, created_at, updated_at)
      VALUES (${userId}, ${name}, ${username}, ${email}, ${passwordHash}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING user_id, email, name
    `

    const userIdCreated = newUser[0].user_id

    // Generate verification token and OTP
    const token = generateToken()
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Save verification token
    await sql`
      INSERT INTO email_verification_tokens (user_id, token, otp, expires_at)
      VALUES (${userIdCreated}, ${token}, ${otp}, ${expiresAt})
    `

    // Send verification email (simulated in preview)
    try {
      await sendVerificationEmail(email, name, token, otp)
      console.log("📧 Verification email simulated for:", email)
    } catch (emailError) {
      console.error("❌ Email simulation failed:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully! Please check your email to verify your account.",
      email,
      // Include verification details for debugging in development
      ...(process.env.NODE_ENV !== "production" && {
        debug: {
          userId: userIdCreated,
          token,
          otp,
          verificationUrl: `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`,
        },
      }),
    })
  } catch (error) {
    console.error("Sign up error:", error)
    return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 })
  }
}
