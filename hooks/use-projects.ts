import { useCallback, useEffect, useState } from "react"

import type { AreaInteresse, Project } from "@/lib/types"

interface UseProjectsResult {
  projects: Project[]
  isLoading: boolean
  error?: string
  refetch: () => void
}

export function useProjects(area: AreaInteresse | "all" = "all"): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [reloadIndex, setReloadIndex] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function loadProjects() {
      setIsLoading(true)
      setError(undefined)
      try {
        const query = area && area !== "all" ? `?area=${area}` : ""
        const response = await fetch(`/api/projects${query}`, { signal: controller.signal })

        if (response.status === 401) {
          window.location.href = "/login"
          return
        }

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error ?? "NÃ£o foi possÃ­vel carregar os projetos.")
        }

        const payload = (await response.json()) as { projects: Project[] }
        if (!controller.signal.aborted) {
          setProjects(payload.projects ?? [])
        }
      } catch (err) {
        if (controller.signal.aborted) return
        console.error("[useProjects]", err)
        setError(err instanceof Error ? err.message : "Erro inesperado.")
        setProjects([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProjects()
    return () => controller.abort()
  }, [area, reloadIndex])

  const refetch = useCallback(() => {
    setReloadIndex((value) => value + 1)
  }, [])

  return { projects, isLoading, error, refetch }
}
