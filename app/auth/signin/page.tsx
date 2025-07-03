"use client"

import type React from "react"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Loader2, Eye, EyeOff, Github, Chrome, Apple, Lock, User } from "lucide-react"
import { signInAction } from "@/lib/auth-actions"

export default function SignInPage() {
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
    needsVerification?: boolean
    email?: string
  } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    const formDataObj = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value)
    })

    startTransition(async () => {
      const result = await signInAction(formDataObj)

      if (result.error) {
        setMessage({
          type: "error",
          text: result.error,
          needsVerification: result.needsVerification,
          email: result.email,
        })
      } else if (result.success) {
        setMessage({ type: "success", text: "Sign in successful! Redirecting..." })

        // ✅ Trigger actual session sign-in to NextAuth

        await signIn("credentials", {
          redirect: false,
          emailOrUsername: formData.emailOrUsername,
          password: formData.password,
          callbackUrl: "/",
        })


        setTimeout(() => {
          router.push("/")
        }, 1000)
      }

    })
  }

  const handleOAuthSignIn = async (provider: string) => {
    try {
      setIsOAuthLoading(true)
      setMessage(null)

      const result = await signIn(provider, {
        callbackUrl: "/",
        redirect: false,
      })

      if (result?.error) {
        setMessage({ type: "error", text: `Failed to sign in with ${provider}. Please try again.` })
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred. Please try again." })
    } finally {
      setIsOAuthLoading(false)
    }
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
          <p className="text-slate-400">Sign in to access your AI productivity assistant</p>
        </div>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white text-center">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <Alert
                className={`${message.type === "error"
                  ? "bg-red-500/10 border-red-500/30 text-red-300"
                  : "bg-green-500/10 border-green-500/30 text-green-300"
                  }`}
              >
                <AlertDescription>
                  {message.text}
                  {message.needsVerification && message.email && (
                    <div className="mt-2">
                      <Link
                        href={`/auth/verify?email=${encodeURIComponent(message.email)}`}
                        className="text-purple-400 hover:underline font-medium"
                      >
                        Resend verification email
                      </Link>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* OAuth Providers */}
            <div className="space-y-3">
              <Button
                onClick={() => handleOAuthSignIn("google")}
                disabled={isOAuthLoading || isPending}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
              >
                {isOAuthLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Chrome className="w-4 h-4 mr-2" />
                )}
                Continue with Google
              </Button>

              <Button
                onClick={() => handleOAuthSignIn("github")}
                disabled={isOAuthLoading || isPending}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white border border-gray-700"
              >
                {isOAuthLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Github className="w-4 h-4 mr-2" />
                )}
                Continue with GitHub
              </Button>

              <Button disabled className="w-full bg-slate-600 text-slate-400 cursor-not-allowed">
                <Apple className="w-4 h-4 mr-2" />
                iCloud (Coming Soon)
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-slate-400">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrUsername" className="text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Email or Username
                </Label>
                <Input
                  id="emailOrUsername"
                  name="emailOrUsername"
                  type="text"
                  placeholder="Enter your email or username"
                  value={formData.emailOrUsername}
                  onChange={handleInputChange}
                  required
                  className="bg-slate-700/50 border-slate-600 text-slate-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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
              </div>

              <div className="flex items-center justify-between">
                <Link href="/auth/forgot-password" className="text-sm text-purple-400 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isPending || isOAuthLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-slate-400">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-purple-400 hover:underline font-medium">
                Sign up
              </Link>
            </div>

            <div className="text-center text-xs text-slate-400">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-purple-400 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-purple-400 hover:underline">
                Privacy Policy
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/30">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-3">What you'll get with Jipange:</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>AI-powered project planning and task management</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Google Calendar and GitHub integration</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Smart notifications and productivity insights</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Kanban, List, and Gantt project views</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
