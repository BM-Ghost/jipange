"use client"

import type React from "react"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Loader2, Mail, ArrowLeft } from "lucide-react"
import { forgotPasswordAction } from "@/lib/auth-actions"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const result = await forgotPasswordAction(email)
      if (result.error) {
        setMessage({ type: "error", text: result.error })
      } else if (result.success) {
        setMessage({ type: "success", text: result.message })
      }
    })
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
          <p className="text-slate-400">Reset your password</p>
        </div>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white text-center">Forgot Password</CardTitle>
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
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-purple-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-medium">Reset your password</h3>
                <p className="text-slate-400 text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-slate-200 focus:border-purple-400"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  "Send Reset Link"
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

        {/* Help Section */}
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/30">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-3">What happens next?</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <span>We'll send a password reset link to your email</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <span>Click the link to create a new password</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <span>The link expires in 1 hour for security</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
