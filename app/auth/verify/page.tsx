"use client"

import type React from "react"

import { useState, useEffect, useTransition } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Loader2, Mail, CheckCircle, RefreshCw } from "lucide-react"
import { verifyEmailAction, resendVerificationAction } from "@/lib/auth-actions"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [otp, setOtp] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const token = searchParams.get("token")
  const email = searchParams.get("email")

  useEffect(() => {
    // Auto-verify if token is in URL (from email link)
    if (token && !otp) {
      startTransition(async () => {
        const result = await verifyEmailAction(token)
        if (result.error) {
          setMessage({ type: "error", text: result.error })
        } else if (result.success) {
          setMessage({ type: "success", text: result.message })
          setTimeout(() => {
            router.push("/auth/signin")
          }, 3000)
        }
      })
    }
  }, [token, otp, router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !otp) return

    setMessage(null)
    startTransition(async () => {
      const result = await verifyEmailAction(token, otp)
      if (result.error) {
        setMessage({ type: "error", text: result.error })
      } else if (result.success) {
        setMessage({ type: "success", text: result.message })
        setTimeout(() => {
          router.push("/auth/signin")
        }, 3000)
      }
    })
  }

  const handleResendEmail = async () => {
    if (!email || countdown > 0) return

    setIsResending(true)
    setMessage(null)

    try {
      const result = await resendVerificationAction(email)
      if (result.error) {
        setMessage({ type: "error", text: result.error })
      } else if (result.success) {
        setMessage({ type: "success", text: result.message })
        setCountdown(60) // 60 second cooldown
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to resend email. Please try again." })
    } finally {
      setIsResending(false)
    }
  }

  const handleOtpOnlySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !otp) return

    setMessage(null)
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp: otp.replace(/\s/g, "") }),
        })

        const result = await response.json()

        if (!response.ok) {
          setMessage({ type: "error", text: result.error })
        } else {
          setMessage({ type: "success", text: result.message })
          setTimeout(() => {
            router.push("/auth/signin")
          }, 3000)
        }
      } catch (error) {
        setMessage({ type: "error", text: "Failed to verify code. Please try again." })
      }
    })
  }

  const formatOtp = (value: string) => {
    // Remove non-digits and limit to 6 characters
    const digits = value.replace(/\D/g, "").slice(0, 6)
    // Add spaces every 3 digits for better readability
    return digits.replace(/(\d{3})(\d{1,3})/, "$1 $2")
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatOtp(e.target.value)
    setOtp(formatted)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Jipange</h1>
          </div>
          <p className="text-slate-400">Verify your email address</p>
        </div>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white text-center flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" />
              Email Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <Alert
                className={`${
                  message.type === "error"
                    ? "bg-red-500/10 border-red-500/30 text-red-300"
                    : "bg-green-500/10 border-green-500/30 text-green-300"
                }`}
              >
                <AlertDescription className="flex items-center gap-2">
                  {message.type === "success" && <CheckCircle className="w-4 h-4" />}
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            {/* Show different content based on whether we have a token or not */}
            {!token ? (
              // No token - show email info and OTP input
              <div className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-white font-medium">Check your email</h3>
                    <p className="text-slate-400 text-sm">
                      We've sent a verification link to{" "}
                      {email && <span className="text-purple-400 font-medium">{email}</span>}
                    </p>
                    <p className="text-slate-400 text-xs">
                      Click the link in the email or enter the 6-digit code below
                    </p>
                  </div>
                </div>

                {/* OTP Input Form for direct code entry */}
                <form onSubmit={handleOtpOnlySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-slate-300 text-center block">
                      Verification Code
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000 000"
                      value={otp}
                      onChange={handleOtpChange}
                      maxLength={7} // 6 digits + 1 space
                      className="bg-slate-700/50 border-slate-600 text-slate-200 focus:border-purple-400 text-center text-lg font-mono tracking-widest"
                      autoComplete="one-time-code"
                    />
                    <p className="text-xs text-slate-400 text-center">Enter the 6-digit code from your email</p>
                  </div>

                  <Button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={isResending || countdown > 0 || !email}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending New Code...
                      </>
                    ) : countdown > 0 ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Resend in {countdown}s
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Get New Verification Code
                      </>
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              // Has token - show OTP input if not auto-verified
              message?.type !== "success" && (
                <div className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                      <Mail className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-white font-medium">Enter verification code</h3>
                      <p className="text-slate-400 text-sm">Enter the 6-digit code sent to your email</p>
                    </div>
                  </div>

                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-slate-300 text-center block">
                        Verification Code
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="000 000"
                        value={otp}
                        onChange={handleOtpChange}
                        maxLength={7} // 6 digits + 1 space
                        className="bg-slate-700/50 border-slate-600 text-slate-200 focus:border-purple-400 text-center text-lg font-mono tracking-widest"
                        autoComplete="one-time-code"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isPending || otp.replace(/\s/g, "").length !== 6}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify Email"
                      )}
                    </Button>
                  </form>
                </div>
              )
            )}

            {/* Resend Email Section */}
            {email && (
              <div className="text-center space-y-2">
                <p className="text-slate-400 text-sm">Didn't receive the email?</p>
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending || countdown > 0}
                  variant="outline"
                  className="text-purple-400 border-purple-400/30 hover:bg-purple-400/10"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend in {countdown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Email
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="text-center text-sm text-slate-400">
              <Link href="/auth/signin" className="text-purple-400 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/30">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-3">Having trouble?</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <span>Check your spam or junk folder</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <span>Make sure the email address is correct</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <span>The verification link expires in 10 minutes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
