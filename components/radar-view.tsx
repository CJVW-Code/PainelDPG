"use client"

import { motion } from "framer-motion"
import { AreaCard } from "./area-card"
import { AREAS, type AreaInteresse } from "@/lib/types"
import { useProjectMetrics } from "@/hooks/use-project-metrics"

interface RadarViewProps {
  onAreaClick: (area: AreaInteresse | "all") => void
}

export function RadarView({ onAreaClick }: RadarViewProps) {
  const { countsByArea, countsByStatus, totalProjects, activeAreas, isLoading, error } = useProjectMetrics()
  const areas = Object.values(AREAS)
  const summaryStats = [
    { label: "Total de Projetos", value: totalProjects },
    { label: "Em Andamento", value: countsByStatus.em_andamento ?? 0 },
    { label: "Concluídos", value: countsByStatus.concluido ?? 0 },
    { label: "Áreas Ativas", value: activeAreas || areas.length },
  ]

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 lg:p-12">
      {/* Header */}
      <motion.div
        className="max-w-6xl mx-auto mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Painel de Projetos</h1>
            <p className="text-muted-foreground">Defensoria Pública Geral — Gestão Estratégica</p>
          </div>

          <motion.button
            onClick={() => onAreaClick("all")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm hover:bg-primary-hover hover:shadow-md transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Ver Todos os Projetos</span>
            <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-md text-sm">
              {isLoading ? "…" : totalProjects}
            </span>
          </motion.button>
        </div>

        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </motion.div>

      {/* Radar Grid */}
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[180px]"
          initial="hidden"
          animate="visible"
        >
          {areas.map((area, index) => (
            <AreaCard
              key={area.id}
              area={area}
              count={countsByArea[area.id] || 0}
              index={index}
              onClick={() => onAreaClick(area.id)}
            />
          ))}
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {summaryStats.map((stat, i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-card-foreground">{isLoading ? "…" : stat.value}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
