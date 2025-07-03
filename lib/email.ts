import nodemailer from "nodemailer"


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

export async function sendVerificationEmail(email: string, name: string, token: string, otp: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Jipange</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px; font-weight: bold;">J</span>
            </div>
            <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">Welcome to Jipange!</h1>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
              Hi ${name},
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
              Thank you for signing up! Please verify your email address to complete your registration and unlock all the amazing features of your AI productivity assistant.
            </p>
          </div>

          <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
            <p style="color: #374151; font-size: 14px; margin: 0 0 15px; font-weight: 600;">Your verification code:</p>
            <div style="font-size: 32px; font-weight: bold; color: #a855f7; letter-spacing: 8px; margin: 10px 0;">${otp}</div>
            <p style="color: #6b7280; font-size: 12px; margin: 15px 0 0;">This code expires in 10 minutes</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: transform 0.2s;">
              Verify Email Address
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
              If you didn't create an account with Jipange, you can safely ignore this email.
            </p>
            <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0;">
              This link will expire in 10 minutes for security reasons.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: rgba(255,255,255,0.8); font-size: 12px;">
            © 2024 Jipange. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Reset your password - Jipange 🔐",
      html: htmlContent,
    });
    
    return { success: true }
  } catch (error) {
    console.error("❌ Error sending verification email:", error)
    throw new Error("Failed to send verification email")
  }
}

/**
 * Sends a password reset email with a reset link.
 *
 * @param email - The user's email address.
 * @param name - The user's name.
 * @param token - The password reset token.
 * @returns Returns success status.
 */
export async function sendPasswordResetEmail(email: string, name: string, token: string) { 
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Jipange</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px; font-weight: bold;">J</span>
            </div>
            <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">Reset Your Password</h1>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
              Hi ${name},
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
            <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0;">
              This link will expire in 1 hour for security reasons.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Reset your password - Jipange 🔐",
      html: htmlContent,
    });

    return { success: true }
  } catch (error) {
    console.error("❌ Error sending password reset email:", error)
    throw new Error("Failed to send password reset email")
  }
}
