"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { ArrowLeft, LayoutGrid, Clock } from "lucide-react"
import { ProjectCard } from "./project-card"
import { Filters } from "./filters"
import { CreateProjectDialog } from "./create-project-dialog"
import type { Project, AreaInteresse, ProjectStatus } from "@/lib/types"
import { AREAS } from "@/lib/types"

interface BentoGridProps {
  projects: Project[]
  initialArea?: AreaInteresse | "all"
  onBack: () => void
  onProjectClick: (project: Project) => void
  onViewChange: (view: "grid" | "timeline") => void
  currentView: "grid" | "timeline"
  onProjectCreated?: () => void
}

export function BentoGrid({
  projects,
  initialArea = "all",
  onBack,
  onProjectClick,
  onViewChange,
  currentView,
  onProjectCreated,
}: BentoGridProps) {
  const [selectedArea, setSelectedArea] = useState<AreaInteresse | "all">(initialArea)
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "all">("all")

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesArea = selectedArea === "all" || p.area === selectedArea
      const matchesStatus = selectedStatus === "all" || p.status === selectedStatus
      return matchesArea && matchesStatus
    })
  }, [projects, selectedArea, selectedStatus])

  const areaTitle = selectedArea === "all" ? "Todos os Projetos" : AREAS[selectedArea].name

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 lg:p-12">
      {/* Header */}
      <motion.div
        className="max-w-7xl mx-auto mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onBack}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </motion.button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{areaTitle}</h1>
              <p className="text-muted-foreground text-sm">
                {filteredProjects.length} {filteredProjects.length === 1 ? "projeto" : "projetos"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
              <button
                onClick={() => onViewChange("grid")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === "grid"
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Grid
              </button>
              <button
                onClick={() => onViewChange("timeline")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === "timeline"
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Clock className="w-4 h-4" />
                Timeline
              </button>
            </div>

            <CreateProjectDialog
              defaultArea={selectedArea}
              onCreated={() => {
                onProjectCreated?.()
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6">
          <Filters
            selectedArea={selectedArea}
            selectedStatus={selectedStatus}
            onAreaChange={setSelectedArea}
            onStatusChange={setSelectedStatus}
          />
        </div>
      </motion.div>

      {/* Bento Grid */}
      <div className="max-w-7xl mx-auto">
        <LayoutGroup>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[160px]"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} onClick={() => onProjectClick(project)} />
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>

        {/* Empty State - Using semantic colors */}
        {filteredProjects.length === 0 && (
          <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-muted-foreground text-lg">Nenhum projeto encontrado com os filtros selecionados.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
