"use client"

import { useRef, useState, useMemo } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import type { Project } from "@/lib/types"
import { AREAS, STATUS_INFO } from "@/lib/types"

interface TimelineViewProps {
  projects: Project[]
  onProjectClick: (project: Project) => void
}

export function TimelineView({ projects, onProjectClick }: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Sort projects by end date
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
  }, [projects])

  const MONTH_WIDTH = 96

  // Generate months for timeline; baseMonth is the same "start" used for the header
  const { months, baseMonth } = useMemo(() => {
    if (!sortedProjects.length) {
      return { months: [] as Date[], timelineStart: null as Date | null }
    }

    const startDates = sortedProjects.map((p) => new Date(p.startDate))
    const endDates = sortedProjects.map((p) => new Date(p.endDate))

    const minStartDate = new Date(Math.min(...startDates.map((d) => d.getTime())))
    const maxEndDate = new Date(Math.max(...endDates.map((d) => d.getTime())))

    // Visual padding of 2 months before/after; this same "start" will be the base for bar positions
    const start = new Date(minStartDate.getFullYear(), minStartDate.getMonth() - 2, 1)
    const end = new Date(maxEndDate.getFullYear(), maxEndDate.getMonth() + 2, 1)

    const monthsList: Date[] = []
    const current = new Date(start)

    while (current <= end) {
      monthsList.push(new Date(current))
      current.setMonth(current.getMonth() + 1)
    }

    return { months: monthsList, baseMonth: start }
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
    if (!baseMonth) {
      return { start: 0, duration: 0 }
    }

    const startDate = new Date(project.startDate)
    const endDate = new Date(project.endDate)

    const startMonthDiff =
      (startDate.getFullYear() - baseMonth.getFullYear()) * 12 +
      (startDate.getMonth() - baseMonth.getMonth())
    const durationMonths =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth()) +
      1

    return { start: startMonthDiff, duration: durationMonths }
  }

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

              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const isDelayed =
                project.progress < 100 && new Date(project.endDate).getTime() < today.getTime()

              const status = isDelayed ? STATUS_INFO.atrasado : STATUS_INFO[project.status]
              const { start, duration } = getProjectPosition(project)

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
                      <p className="text-xs text-muted-foreground">
                        {new Date(project.startDate).toLocaleDateString("pt-BR")} -{" "}
                        {new Date(project.endDate).toLocaleDateString("pt-BR")}
                      </p>
                      <p className={`text-xs ${area.color}`}>
                        {area.name}
                        {isDelayed && " · Atrasado"}
                      </p>
                    </button>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 flex items-center relative h-10">
                    {/* Grid lines */}
                    {months.map((_, i) => (
                      <div key={i} className="w-24 shrink-0 h-full border-l border-border/50" />
                    ))}

                    {/* Dates above bar */}
                    <div
                      className="absolute -top-4 h-4 flex items-center pointer-events-none px-1"
                      style={{
                        left: `${start * MONTH_WIDTH}px`,
                        width: `${duration * MONTH_WIDTH - 8}px`,
                      }}
                    >
                      <span className="text-[10px] text-muted-foreground truncate">
                        {new Date(project.startDate).toLocaleDateString("pt-BR")} -{" "}
                        {new Date(project.endDate).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    {/* Project Bar */}
                    <motion.button
                      onClick={() => onProjectClick(project)}
                      className={`absolute h-6 rounded-md ${area.bgColor} border-2 ${area.borderColor} hover:shadow-md transition-shadow cursor-pointer flex items-center px-2`}
                      style={{
                        left: `${start * MONTH_WIDTH}px`,
                        width: `${duration * MONTH_WIDTH - 8}px`,
                      }}
                      initial={{ scaleX: 0, originX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: index * 0.05 + 0.2, duration: 0.4 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <span className={`text-xs font-medium ${status.color} truncate`}>{project.progress}%</span>
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
