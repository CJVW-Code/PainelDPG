import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getProjectsCountByArea, getProjectsCountByStatus } from "@/lib/data"

export async function GET() {
  try {
    const [countsByArea, countsByStatus, total] = await Promise.all([
      getProjectsCountByArea(),
      getProjectsCountByStatus(),
      prisma.project.count(),
    ])

    return NextResponse.json({
      countsByArea,
      countsByStatus,
      totalProjects: total,
      activeAreas: Object.keys(countsByArea).length,
    })
  } catch (error) {
    console.error("[PROJECTS_METRICS_API]", error)
    return NextResponse.json({ error: "Falha ao carregar mÃ©tricas" }, { status: 500 })
  }
}
