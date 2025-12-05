"use client"

import { motion } from "framer-motion"
import { Eye, Lightbulb, Gauge, MessageCircle, type LucideIcon } from "lucide-react"
import type { AreaInfo } from "@/lib/types"

const iconMap: Record<string, LucideIcon> = {
  Eye,
  Lightbulb,
  Gauge,
  MessageCircle,
}

interface AreaCardProps {
  area: AreaInfo
  count: number
  index: number
  onClick: () => void
}

export function AreaCard({ area, count, index, onClick }: AreaCardProps) {
  const Icon = iconMap[area.icon]

  // Tamanho baseado na quantidade de projetos
  const size = count >= 6 ? "large" : count >= 5 ? "medium" : "small"

  const sizeClasses = {
    large: "col-span-2 row-span-2",
    medium: "col-span-2 row-span-1",
    small: "col-span-1 row-span-1",
  }

  return (
    <motion.button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        relative overflow-hidden rounded-2xl p-6
        bg-card border-2 ${area.borderColor}
        shadow-sm hover:shadow-lg
        transition-shadow duration-300
        text-left group cursor-pointer
      `}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.1,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Pulse animation background */}
      <motion.div
        className={`absolute inset-0 ${area.bgColor} opacity-0 group-hover:opacity-100`}
        initial={false}
        transition={{ duration: 0.3 }}
      />

      {/* Animated ring */}
      <motion.div
        className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${area.bgColor} opacity-50`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 h-full flex flex-col justify-between">
        <div>
          <div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${area.bgColor} ${area.color} mb-4`}
          >
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-card-foreground mb-1">{area.name}</h3>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className={`text-4xl font-bold ${area.color}`}>{count}</span>
            <span className="text-muted-foreground ml-2 text-sm">{count === 1 ? "projeto" : "projetos"}</span>
          </div>

          <motion.div
            className={`flex items-center gap-1 text-sm ${area.color} opacity-0 group-hover:opacity-100`}
            initial={false}
            transition={{ duration: 0.2 }}
          >
            <span>Ver projetos</span>
            <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}>
              →
            </motion.span>
          </motion.div>
        </div>
      </div>
    </motion.button>
  )
}
