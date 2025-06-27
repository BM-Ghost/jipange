"use client"

import type React from "react"
import { AuthProvider } from "@/components/auth/auth-provider"
import { QueryProvider } from "@/components/providers/query-provider"

interface RootProviderProps {
  children: React.ReactNode
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <AuthProvider>
      <QueryProvider>{children}</QueryProvider>
    </AuthProvider>
  )
}
