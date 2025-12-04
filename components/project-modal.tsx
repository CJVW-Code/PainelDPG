"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Calendar, Users, AlertCircle, CheckCircle2, Clock, Pause, AlertTriangle, HelpCircle } from "lucide-react"
import type { Project } from "@/lib/types"
import { AREAS, STATUS_INFO } from "@/lib/types"

interface ProjectModalProps {
  project: Project | null
  onClose: () => void
}

const statusIcons = {
  planejado: HelpCircle,
  em_andamento: Clock,
  pausado: Pause,
  concluido: CheckCircle2,
  atrasado: AlertTriangle,
  pendente: AlertCircle,
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  if (!project) return null

  const area = AREAS[project.area]
  const status = STATUS_INFO[project.status]
  const StatusIcon = statusIcons[project.status]

  return (
    <AnimatePresence>
      {project && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-foreground/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal - Using semantic colors throughout */}
          <motion.div
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[85vh] bg-card rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className={`p-6 ${area.bgColor} border-b border-border`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${status.bgColor} ${status.color} flex items-center gap-1.5`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                    <span className={`text-xs font-medium ${area.color}`}>{area.name}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-card-foreground">{project.name}</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-card/50 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Descrição</h3>
                <p className="text-card-foreground leading-relaxed">{project.description}</p>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Progresso</h3>
                  <span className="text-lg font-bold text-card-foreground">{project.progress}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      project.progress === 100
                        ? "bg-success"
                        : project.status === "atrasado"
                          ? "bg-destructive"
                          : "bg-primary-light"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Início</span>
                  </div>
                  <p className="text-card-foreground font-semibold">
                    {new Date(project.startDate).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Previsão de Término</span>
                  </div>
                  <p className="text-card-foreground font-semibold">
                    {new Date(project.endDate).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Team */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Equipe ({project.team.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {project.team.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-primary-muted flex items-center justify-center text-primary font-semibold">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted">
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    project.priority === "alta"
                      ? "text-destructive"
                      : project.priority === "media"
                        ? "text-warning"
                        : "text-muted-foreground"
                  }`}
                >
                  Prioridade: {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                </span>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
