import { useEffect, useState } from "react"

import type { AreaInteresse, ProjectStatus } from "@/lib/types"

interface ProjectMetrics {
  countsByArea: Partial<Record<AreaInteresse, number>> & Record<string, number>
  countsByStatus: Partial<Record<ProjectStatus, number>> & Record<string, number>
  totalProjects: number
  activeAreas: number
  isLoading: boolean
  error?: string
}

const INITIAL_METRICS: ProjectMetrics = {
  countsByArea: {},
  countsByStatus: {},
  totalProjects: 0,
  activeAreas: 0,
  isLoading: true,
}

export function useProjectMetrics(): ProjectMetrics {
  const [metrics, setMetrics] = useState<ProjectMetrics>(INITIAL_METRICS)

  useEffect(() => {
    const controller = new AbortController()
    async function loadMetrics() {
      setMetrics((prev) => ({ ...prev, isLoading: true, error: undefined }))
      try {
        const response = await fetch("/api/projects/metrics", { signal: controller.signal })
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error ?? "Falha ao carregar mÃ©tricas.")
        }

        const payload = await response.json()
        if (!controller.signal.aborted) {
          setMetrics({
            countsByArea: payload.countsByArea ?? {},
            countsByStatus: payload.countsByStatus ?? {},
            totalProjects: payload.totalProjects ?? 0,
            activeAreas: payload.activeAreas ?? 0,
            isLoading: false,
          })
        }
      } catch (err) {
        if (controller.signal.aborted) return
        console.error("[useProjectMetrics]", err)
        setMetrics((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Erro inesperado.",
        }))
      }
    }

    loadMetrics()
    return () => controller.abort()
  }, [])

  return metrics
}
