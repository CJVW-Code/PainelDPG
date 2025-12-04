"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, ChevronLeft, ChevronRight, X, Maximize2, Users } from "lucide-react"
import Image from "next/image"
import type { Project } from "@/lib/types"
import { AREAS, STATUS_INFO } from "@/lib/types"

interface PresentationModeProps {
  projects: Project[]
  isActive: boolean
  onClose: () => void
}

export function PresentationMode({ projects, isActive, onClose }: PresentationModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)

  const displayProjects = projects

  const currentProject = displayProjects[currentIndex]

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % displayProjects.length)
    setProgress(0)
  }, [displayProjects.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + displayProjects.length) % displayProjects.length)
    setProgress(0)
  }, [displayProjects.length])

  // Auto-advance timer
  useEffect(() => {
    if (!isActive || !isPlaying) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext()
          return 0
        }
        return prev + 1
      })
    }, 100) // 10 seconds total (100 * 100ms)

    return () => clearInterval(interval)
  }, [isActive, isPlaying, goToNext])

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNext()
      if (e.key === "ArrowLeft") goToPrev()
      if (e.key === "Space") {
        e.preventDefault()
        setIsPlaying((prev) => !prev)
      }
      if (e.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isActive, goToNext, goToPrev, onClose])

  useEffect(() => {
    setCurrentIndex(0)
    setProgress(0)
  }, [projects])

  if (!isActive || !currentProject) return null

  const area = AREAS[currentProject.area]
  const status = STATUS_INFO[currentProject.status]

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={currentProject.image || "/placeholder.svg?height=1080&width=1920&query=office professional"}
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/98 via-slate-900/80 to-slate-900/60" />
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 h-1 bg-white/10">
        <motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">
            {currentIndex + 1} / {displayProjects.length}
          </span>
          <div className="flex items-center gap-2">
            {displayProjects.slice(0, 20).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentIndex(i)
                  setProgress(0)
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? "bg-primary" : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
            {displayProjects.length > 20 && (
              <span className="text-white/40 text-xs">+{displayProjects.length - 20}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentProject.id}
            className="w-full max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Area Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <span className="font-medium">{area.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${status.bgColor} ${status.color}`}>
                {status.label}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {currentProject.name}
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-xl text-white/80 mb-8 max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {currentProject.description}
            </motion.p>

            {/* Progress */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center justify-between text-white/60 mb-2">
                <span>Progresso</span>
                <span className="text-2xl font-bold text-white">{currentProject.progress}%</span>
              </div>
              <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    currentProject.progress === 100
                      ? "bg-primary"
                      : currentProject.status === "atrasado"
                        ? "bg-destructive"
                        : "bg-primary-light"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${currentProject.progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </motion.div>

            {/* Team */}
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary-light" />
                </div>
                <span className="text-white/60">Equipe:</span>
              </div>
              <div className="flex -space-x-3">
                {currentProject.team.map((member) => (
                  <div
                    key={member.id}
                    className="w-10 h-10 rounded-full bg-primary/40 border-2 border-slate-900 flex items-center justify-center text-white font-medium"
                    title={member.name}
                  >
                    {member.name.charAt(0)}
                  </div>
                ))}
              </div>
              <span className="text-white/50">{currentProject.team.map((m) => m.name).join(", ")}</span>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <button
          onClick={goToPrev}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Anterior
        </button>

        <p className="text-white/40 text-sm">Use as setas do teclado para navegar • Espaço para pausar</p>

        <button
          onClick={goToNext}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          Próximo
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

// Floating button to activate presentation mode
export function PresentationModeButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl shadow-lg hover:shadow-xl hover:bg-primary-hover transition-all z-30"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Maximize2 className="w-4 h-4" />
      <span className="font-medium">Modo Apresentação</span>
    </motion.button>
  )
}
