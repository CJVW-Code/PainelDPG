"use client"

import { motion } from "framer-motion"
import { Filter, X } from "lucide-react"
import { AREAS, STATUS_INFO, type AreaInteresse, type ProjectStatus } from "@/lib/types"

interface FiltersProps {
  selectedArea: AreaInteresse | "all"
  selectedStatus: ProjectStatus | "all"
  onAreaChange: (area: AreaInteresse | "all") => void
  onStatusChange: (status: ProjectStatus | "all") => void
}

export function Filters({ selectedArea, selectedStatus, onAreaChange, onStatusChange }: FiltersProps) {
  const areas = [{ id: "all" as const, name: "Todas as Áreas" }, ...Object.values(AREAS)]
  const statuses = [
    { id: "all" as const, label: "Todos os Status" },
    ...Object.entries(STATUS_INFO).map(([id, info]) => ({ id: id as ProjectStatus, label: info.label })),
  ]

  const hasFilters = selectedArea !== "all" || selectedStatus !== "all"

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span>Filtros:</span>
      </div>

      {/* Area Filter - Using semantic colors */}
      <select
        value={selectedArea}
        onChange={(e) => onAreaChange(e.target.value as AreaInteresse | "all")}
        className="px-3 py-2 text-sm bg-card text-card-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      >
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value as ProjectStatus | "all")}
        className="px-3 py-2 text-sm bg-card text-card-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      >
        {statuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.label}
          </option>
        ))}
      </select>

      {/* Clear Filters */}
      {hasFilters && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={() => {
            onAreaChange("all")
            onStatusChange("all")
          }}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Limpar
        </motion.button>
      )}
    </div>
  )
}
