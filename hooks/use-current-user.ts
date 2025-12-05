"use client"

import { useCallback, useEffect, useState } from "react"

import type { Role, User } from "@/lib/types"

type CurrentUser = User & { roles: Role[] }

interface UseCurrentUserResult {
  user: CurrentUser | null
  isLoading: boolean
  refetch: () => void
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/me")
      if (!response.ok) {
        throw new Error("Falha ao carregar usuário atual")
      }
      const payload = (await response.json()) as { user: CurrentUser | null }
      setUser(payload.user)
    } catch (error) {
      console.error("[useCurrentUser]", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return { user, isLoading, refetch: fetchUser }
}
