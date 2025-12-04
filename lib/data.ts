"use server"

import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import type { AreaInteresse, Project, ProjectStatus, ProjectVisibility } from "@/lib/types"

const PROJECT_WITH_TEAM = {
  include: {
    team: {
      include: {
        teamMember: true,
      },
    },
  },
} satisfies Prisma.ProjectDefaultArgs

type ProjectWithTeam = Prisma.ProjectGetPayload<typeof PROJECT_WITH_TEAM>

function mapProject(project: ProjectWithTeam): Project {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    area: project.area as AreaInteresse,
    status: project.status as ProjectStatus,
    progress: project.progress,
    startDate: project.startDate.toISOString(),
    endDate: project.endDate.toISOString(),
    priority: project.priority as Project["priority"],
    featured: project.featured ?? undefined,
    image: project.image ?? undefined,
    visibility: (project.visibility ?? "PUBLIC").toLowerCase() as ProjectVisibility,
    team: project.team.map(({ teamMember }) => ({
      id: teamMember.id,
      name: teamMember.name,
      role: teamMember.role,
      avatar: teamMember.avatar ?? undefined,
    })),
  }
}

export async function getProjects(): Promise<Project[]> {
  const projects = await prisma.project.findMany(PROJECT_WITH_TEAM)
  return projects.map(mapProject)
}

export async function getProjectById(id: string): Promise<Project | null> {
  const project = await prisma.project.findUnique({
    ...PROJECT_WITH_TEAM,
    where: { id },
  })
  return project ? mapProject(project) : null
}

export async function getProjectsByArea(area: AreaInteresse): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    ...PROJECT_WITH_TEAM,
    where: { area },
  })
  return projects.map(mapProject)
}

export type CreateProjectInput = {
  name: string
  description: string
  area: AreaInteresse
  status: ProjectStatus
  priority: Project["priority"]
  startDate: string
  endDate: string
  visibility: ProjectVisibility
  featured?: boolean
  image?: string
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const project = await prisma.project.create({
    ...PROJECT_WITH_TEAM,
    data: {
      name: input.name,
      description: input.description,
      area: input.area,
      status: input.status,
      priority: input.priority,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      progress: 0,
      featured: input.featured ?? false,
      image: input.image ?? null,
      visibility: input.visibility === "restricted" ? "RESTRICTED" : "PUBLIC",
    },
  })

  return mapProject(project)
}

export async function getProjectsCountByArea() {
  const grouped = await prisma.project.groupBy({
    by: ["area"],
    _count: { _all: true },
  })

  return grouped.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.area] = entry._count._all
    return acc
  }, {})
}

export async function getProjectsCountByStatus() {
  const grouped = await prisma.project.groupBy({
    by: ["status"],
    _count: { _all: true },
  })

  return grouped.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.status] = entry._count._all
    return acc
  }, {})
}
