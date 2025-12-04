"use client"

import { motion } from "framer-motion"
import { Users, Clock } from "lucide-react"
import Image from "next/image"
import type { Project } from "@/lib/types"
import { AREAS, STATUS_INFO } from "@/lib/types"

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const area = AREAS[project.area]
  const status = STATUS_INFO[project.status]

  const isFeatured = project.featured

  return (
    <motion.button
      layout
      onClick={onClick}
      className={`
        ${isFeatured ? "col-span-2 row-span-2" : "col-span-1 row-span-1"}
        relative overflow-hidden rounded-2xl
        shadow-md hover:shadow-xl
        transition-shadow duration-300
        text-left group cursor-pointer
        flex flex-col
        min-h-[180px]
      `}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={project.image || "/placeholder.svg?height=400&width=600&query=office work professional"}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/70 to-slate-900/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-4">
        {/* Status Badge - top left */}
        <div className="mb-auto">
          <span
            className={`
              inline-flex items-center gap-1.5 
              text-xs font-medium px-3 py-1.5 rounded-full
              backdrop-blur-sm
              ${status.bgColor} ${status.color}
              border border-white/10
            `}
          >
            <Clock className="w-3 h-3" />
            {status.label}
          </span>
        </div>

        {/* Title & Description - middle/bottom */}
        <div className="mt-auto space-y-1">
          <h3
            className={`
              font-bold text-white leading-tight
              ${isFeatured ? "text-xl md:text-2xl" : "text-sm md:text-base"}
              line-clamp-2 drop-shadow-md
            `}
          >
            {project.name}
          </h3>
          <p
            className={`
              text-white/70 leading-snug
              ${isFeatured ? "text-sm line-clamp-2" : "text-xs line-clamp-1"}
            `}
          >
            {project.description}
          </p>
        </div>

        {/* Footer - Team & Progress */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          {/* Team */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/30 backdrop-blur-sm">
              <Users className="w-3.5 h-3.5 text-primary-light" />
            </div>
            <span className="text-xs text-white/80 truncate font-medium">{project.team[0]?.name || area.name}</span>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-16 md:w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  project.progress === 100
                    ? "bg-primary"
                    : project.status === "atrasado"
                      ? "bg-destructive"
                      : "bg-primary-light"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            {isFeatured && <span className="text-xs text-white/60 font-medium">{project.progress}%</span>}
          </div>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
      </div>
    </motion.button>
  )
}
