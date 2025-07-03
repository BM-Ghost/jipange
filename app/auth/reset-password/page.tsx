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
import { Bot, Loader2, Eye, EyeOff, Lock, CheckCircle, XCircle, ArrowLeft } from "lucide-react"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  const token = searchParams.get("token")

  const passwordRequirements = [
    { text: "At least 8 characters", met: formData.password.length >= 8 },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(formData.password) },
    { text: "Contains lowercase letter", met: /[a-z]/.test(formData.password) },
    { text: "Contains number", met: /\d/.test(formData.password) },
  ]

  useEffect(() => {
    // Verify token on page load
    if (token) {
      fetch("/api/auth/verify-reset-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          setTokenValid(data.valid)
          if (!data.valid) {
            setMessage({ type: "error", text: data.error || "Invalid or expired reset token" })
          }
        })
        .catch(() => {
          setTokenValid(false)
          setMessage({ type: "error", text: "Failed to verify reset token" })
        })
    } else {
      setTokenValid(false)
      setMessage({ type: "error", text: "No reset token provided" })
    }
  }, [token])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !tokenValid) return

    setMessage(null)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" })
      return
    }

    if (formData.password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters long" })
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password: formData.password,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          setMessage({ type: "error", text: result.error })
        } else {
          setMessage({ type: "success", text: result.message })
          setTimeout(() => {
            router.push("/auth/signin?reset=success")
          }, 3000)
        }
      } catch (error) {
        setMessage({ type: "error", text: "Failed to reset password. Please try again." })
      }
    })
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-400" />
              <p className="text-slate-300">Verifying reset token...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
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
            <p className="text-slate-400">Password Reset</p>
          </div>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white text-center">Invalid Reset Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <Alert className="bg-red-500/10 border-red-500/30 text-red-300">
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-medium">Reset link expired or invalid</h3>
                  <p className="text-slate-400 text-sm">
                    This password reset link has expired or is invalid. Please request a new one.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Link href="/auth/forgot-password">Request New Reset Link</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full text-purple-400 border-purple-400/30 hover:bg-purple-400/10 bg-transparent"
                >
                  <Link href="/auth/signin">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
          <p className="text-slate-400">Create a new password</p>
        </div>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white text-center">Reset Password</CardTitle>
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

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-medium">Create new password</h3>
                <p className="text-slate-400 text-sm">Enter a strong password that you haven't used before</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a new password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="bg-slate-700/50 border-slate-600 text-slate-200 focus:border-purple-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <div className="space-y-1 mt-2">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        {req.met ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400" />
                        )}
                        <span className={req.met ? "text-green-400" : "text-red-400"}>{req.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="bg-slate-700/50 border-slate-600 text-slate-200 focus:border-purple-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className="flex items-center gap-2 text-xs">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-red-400" />
                        <span className="text-red-400">Passwords don't match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isPending || formData.password !== formData.confirmPassword || formData.password.length < 8}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-slate-400">
              <Link
                href="/auth/signin"
                className="text-purple-400 hover:underline flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/30">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-3">Security Tips</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <span>Use a unique password you haven't used elsewhere</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <span>Include uppercase, lowercase, numbers, and symbols</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <span>Consider using a password manager</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
