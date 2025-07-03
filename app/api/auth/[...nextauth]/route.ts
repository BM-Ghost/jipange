import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import type { Session } from "next-auth"

// Extend the Session type to include custom properties
declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    provider?: string
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo project",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        emailOrUsername: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const { emailOrUsername, password } = credentials as {
          emailOrUsername: string
          password: string
        }

        try {
          const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailOrUsername, password }),
          })

          if (!res.ok) return null
          const user = await res.json()
          return user ?? null
        } catch (error) {
          console.error("Credentials authorize error:", error)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.provider = token.provider as string
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider !== "credentials") {
        await saveUserToDatabase(user, account, profile)
      }
      return true
    },
  },

  pages: {
    signIn: "/auth/signin", // your custom login page
  },
}

async function saveUserToDatabase(user: any, account: any, profile: any) {
  try {
    await fetch(`${process.env.NEXTAUTH_URL}/api/users/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        image: user.image,
        provider: account.provider,
        providerId: account.providerAccountId,
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
      }),
    })
  } catch (error) {
    console.error("Error saving user:", error)
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
