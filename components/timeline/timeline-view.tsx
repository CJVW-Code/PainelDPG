"use client"

import { useRef, useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import type { Project } from "@/lib/types"
import { AREAS, STATUS_INFO } from "@/lib/types"

interface TimelineViewProps {
  projects: Project[]
  onProjectClick: (project: Project) => void
  focusProjectId?: string
}

export function TimelineView({ projects, onProjectClick, focusProjectId }: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Sort projects by end date
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
  }, [projects])

  // Generate months for timeline
  const MONTH_WIDTH = 96

  const months = useMemo(() => {
    const allDates = sortedProjects.flatMap((p) => [new Date(p.startDate), new Date(p.endDate)])
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))

    const monthsList: Date[] = []
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1)

    while (current <= maxDate) {
      monthsList.push(new Date(current))
      current.setMonth(current.getMonth() + 1)
    }

    return monthsList
  }, [sortedProjects])

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const getProjectPosition = (project: Project) => {
    const startDate = new Date(project.startDate)
    const endDate = new Date(project.endDate)
    const firstMonth = months[0]

    const startMonthDiff =
      (startDate.getFullYear() - firstMonth.getFullYear()) * 12 + (startDate.getMonth() - firstMonth.getMonth())
    const duration =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1

    return { start: startMonthDiff, duration }
  }

  useEffect(() => {
    handleScroll()
  }, [months])

  useEffect(() => {
    if (!focusProjectId || !scrollRef.current || !months.length) return
    const focusProject = sortedProjects.find((project) => project.id === focusProjectId)
    if (!focusProject) return
    const startDate = new Date(focusProject.startDate)
    const firstMonth = months[0]
    const startMonthDiff =
      (startDate.getFullYear() - firstMonth.getFullYear()) * 12 + (startDate.getMonth() - firstMonth.getMonth())
    const target = Math.max(startMonthDiff * MONTH_WIDTH - MONTH_WIDTH * 2, 0)
    scrollRef.current.scrollTo({ left: target, behavior: "smooth" })
  }, [focusProjectId, sortedProjects, months])

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Timeline Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-card-foreground">Linha do Tempo</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Timeline Content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-muted"
      >
        <div className="min-w-max p-4">
          {/* Months Header */}
          <div className="flex border-b border-border pb-2 mb-4">
            <div className="w-48 shrink-0" /> {/* Spacer for project names */}
            {months.map((month, i) => (
              <div key={i} className="w-24 shrink-0 text-center text-sm font-medium text-muted-foreground">
                {month.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}
              </div>
            ))}
          </div>

          {/* Projects */}
          <div className="space-y-3">
            {sortedProjects.map((project, index) => {
              const area = AREAS[project.area]
              const status = STATUS_INFO[project.status]
              const { start, duration } = getProjectPosition(project)

              const isFocused = focusProjectId === project.id

              return (
                <motion.div
                  key={project.id}
                  className="flex items-center"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Project Name */}
                  <div className="w-48 shrink-0 pr-4">
                    <button
                      onClick={() => onProjectClick(project)}
                      className="text-left hover:text-primary transition-colors"
                    >
                      <p className="text-sm font-medium text-card-foreground truncate">{project.name}</p>
                      <p className={`text-xs ${area.color}`}>{area.name}</p>
                    </button>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 flex items-center relative h-8">
                    {/* Grid lines */}
                    {months.map((_, i) => (
                      <div key={i} className="w-24 shrink-0 h-full border-l border-border/50" />
                    ))}

                    {/* Project Bar */}
                    <motion.button
                      onClick={() => onProjectClick(project)}
                      className={`absolute h-6 rounded-md ${area.bgColor} border-2 ${area.borderColor} hover:shadow-md transition-shadow cursor-pointer flex items-center px-2 overflow-hidden relative ${
                        isFocused ? "ring-2 ring-primary" : ""
                      }`}
                      style={{
                        left: `${start * MONTH_WIDTH}px`,
                        width: `${duration * MONTH_WIDTH - 8}px`,
                      }}
                      initial={{ scaleX: 0, originX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: index * 0.05 + 0.2, duration: 0.4 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <span
                        className="absolute inset-y-0 left-0 bg-primary/20"
                        style={{
                          width: `${Math.min(Math.max(project.progress, 0), 100)}%`,
                        }}
                      />
                      <span className={`relative text-xs font-medium ${status.color} truncate`}>
                        {project.progress}%
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-4 border-t border-border bg-muted">
        <span className="text-xs text-muted-foreground">Áreas:</span>
        {Object.values(AREAS).map((area) => (
          <div key={area.id} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${area.bgColor} border ${area.borderColor}`} />
            <span className="text-xs text-muted-foreground">{area.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
