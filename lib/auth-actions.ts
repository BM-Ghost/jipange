"use server"

import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import {sendVerificationEmail, sendPasswordResetEmail } from "./email"

const sql = neon(process.env.DATABASE_URL!)

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export async function signUpAction(formData: FormData) {
  const name = formData.get("name") as string
  const username = formData.get("username") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Validation
  if (!name || !username || !email || !password || !confirmPassword) {
    return { error: "All fields are required" }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long" }
  }

  if (username.length < 3) {
    return { error: "Username must be at least 3 characters long" }
  }

  try {
    // Check if user already exists
    const existingUser = await sql`
      SELECT id, email, username, email_verified FROM users 
      WHERE email = ${email} OR username = ${username}
    `

    if (existingUser.length > 0) {
      const user = existingUser[0]

      // If user exists and is verified, they can't sign up again
      if (user.email_verified) {
        if (user.email === email) {
          return { error: "An account with this email already exists and is verified. Please sign in instead." }
        }
        if (user.username === username) {
          return { error: "This username is already taken. Please choose a different username." }
        }
      }

      // If user exists but is NOT verified, allow them to "re-register"
      if (!user.email_verified) {
        // Delete the unverified user and their tokens
        await sql`DELETE FROM email_verification_tokens WHERE user_id = ${user.id}`
        await sql`DELETE FROM users WHERE id = ${user.id}`

        console.log("🔄 Removed unverified user account for re-registration:", email)
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await sql`
      INSERT INTO users (name, username, email, password_hash, created_at, updated_at)
      VALUES (${name}, ${username}, ${email}, ${passwordHash}, NOW(), NOW())
      RETURNING id, email, name
    `

    const userId = newUser[0].id

    // Generate verification token and OTP
    const token = generateToken()
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Save verification token
    await sql`
      INSERT INTO email_verification_tokens (user_id, token, otp, expires_at)
      VALUES (${userId}, ${token}, ${otp}, ${expiresAt})
    `

    // Send verification email
    try {
      await sendVerificationEmail(email, name, token, otp)
      console.log("📧 Verification email sent successfully to:", email)
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError)
      // Don't fail the signup if email fails - user can resend later
      return {
        success: true,
        message:
          "Account created successfully! However, there was an issue sending the verification email. Please try resending it.",
        email,
        emailFailed: true,
      }
    }

    return {
      success: true,
      message: "Account created successfully! Please check your email to verify your account.",
      email,
    }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "Failed to create account. Please try again." }
  }
}

export async function signInAction(formData: FormData) {
  const emailOrUsername = formData.get("emailOrUsername") as string
  const password = formData.get("password") as string

  if (!emailOrUsername || !password) {
    return { error: "Email/username and password are required" }
  }

  try {
    // Find user by email or username
    const user = await sql`
      SELECT id, email, username, name, password_hash, email_verified 
      FROM users 
      WHERE email = ${emailOrUsername} OR username = ${emailOrUsername}
    `

    if (user.length === 0) {
      return { error: "Invalid credentials" }
    }

    const userData = user[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash)
    if (!isValidPassword) {
      return { error: "Invalid credentials" }
    }

    // Check if email is verified
    if (!userData.email_verified) {
      return {
        error: "Please verify your email address before signing in",
        needsVerification: true,
        email: userData.email,
      }
    }

    return {
      success: true,
      user: {
        id: userData.user_id,
        email: userData.email,
        username: userData.username,
        name: userData.name,
      },
    }
  } catch (error) {
    console.error("Sign in error:", error)
    return { error: "Failed to sign in. Please try again." }
  }
}

export async function verifyEmailAction(token: string, otp?: string) {
  try {
    // Find verification token
    const verificationRecord = await sql`
      SELECT vt.*, u.email, u.name 
      FROM email_verification_tokens vt
      JOIN users u ON vt.user_id = u.id
      WHERE vt.token = ${token} AND vt.used = FALSE AND vt.expires_at > NOW()
    `

    if (verificationRecord.length === 0) {
      return { error: "Invalid or expired verification token" }
    }

    const record = verificationRecord[0]

    // If OTP is provided, verify it
    if (otp && record.otp !== otp) {
      return { error: "Invalid verification code" }
    }

    // Mark user as verified
    await sql`
      UPDATE users 
      SET email_verified = TRUE, email_verified_at = NOW(), updated_at = NOW()
      WHERE id = ${record.user_id}
    `

    // Mark token as used
    await sql`
      UPDATE email_verification_tokens 
      SET used = TRUE 
      WHERE id = ${record.id}
    `

    console.log("✅ Email verified successfully for:", record.email)

    return {
      success: true,
      message: "Email verified successfully! You can now sign in.",
    }
  } catch (error) {
    console.error("Email verification error:", error)
    return { error: "Failed to verify email. Please try again." }
  }
}

export async function resendVerificationAction(email: string) {
  try {
    // Find user
    const user = await sql`
      SELECT id, name, email, email_verified 
      FROM users 
      WHERE email = ${email}
    `

    if (user.length === 0) {
      return { error: "User not found" }
    }

    const userData = user[0]

    if (userData.email_verified) {
      return { error: "Email is already verified" }
    }

    // Delete old verification tokens
    await sql`
      DELETE FROM email_verification_tokens 
      WHERE user_id = ${userData.user_id}
    `

    // Generate new verification token and OTP
    const token = generateToken()
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Save new verification token
    await sql`
      INSERT INTO email_verification_tokens (user_id, token, otp, expires_at)
      VALUES (${userData.user_id}, ${token}, ${otp}, ${expiresAt})
    `

    // Send verification email
    try {
      await sendVerificationEmail(userData.email, userData.name, token, otp)
      console.log("📧 Verification email resent successfully to:", userData.email)
    } catch (emailError) {
      console.error("❌ Failed to resend verification email:", emailError)
      return { error: "Failed to send verification email. Please try again later." }
    }

    return {
      success: true,
      message: "Verification email sent! Please check your inbox.",
    }
  } catch (error) {
    console.error("Resend verification error:", error)
    return { error: "Failed to resend verification email. Please try again." }
  }
}

export async function forgotPasswordAction(email: string) {
  try {
    // Find user
    const user = await sql`
      SELECT user_id, name, email 
      FROM users 
      WHERE email = ${email}
    `

    if (user.length === 0) {
      // Don't reveal if email exists or not
      return {
        success: true,
        message: "If an account with this email exists, you will receive a password reset link.",
      }
    }

    const userData = user[0]

    // Delete old reset tokens
    await sql`
      DELETE FROM password_reset_tokens 
      WHERE user_id = ${userData.user_id}
    `

    // Generate reset token
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save reset token
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${userData.user_id}, ${token}, ${expiresAt})
    `

    // Send reset email
    try {
      await sendPasswordResetEmail(userData.email, userData.name, token)
      console.log("📧 Password reset email sent successfully to:", userData.email)
    } catch (emailError) {
      console.error("❌ Failed to send password reset email:", emailError)
      // Still return success to not reveal if email exists
    }

    return {
      success: true,
      message: "If an account with this email exists, you will receive a password reset link.",
    }
  } catch (error) {
    console.error("Forgot password error:", error)
    return { error: "Failed to process request. Please try again." }
  }
}
