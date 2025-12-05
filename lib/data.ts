"use server"

import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import type { AreaInteresse, Project, ProjectStatus, ProjectVisibility } from "@/lib/types"

const PROJECT_WITH_RELATIONS = {
  include: {
    team: {
      include: {
        teamMember: true,
      },
    },
    files: true,
  },
} satisfies Prisma.ProjectDefaultArgs

type ProjectWithRelations = Prisma.ProjectGetPayload<typeof PROJECT_WITH_RELATIONS>

type ProjectQueryOptions = {
  visibility?: ProjectVisibility
}

function buildVisibilityWhere(options?: ProjectQueryOptions) {
  if (!options?.visibility) return {}
  return {
    visibility: options.visibility === "public" ? "PUBLIC" : "RESTRICTED",
  }
}

type ProjectFileInput = {
  id?: string
  name: string
  url: string
  mimeType: string
}

function mapProject(project: ProjectWithRelations): Project {
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
    createdById: project.createdById ?? undefined,
    team: project.team.map(({ teamMember }) => ({
      id: teamMember.id,
      name: teamMember.name,
      role: teamMember.role,
      avatar: teamMember.avatar ?? undefined,
    })),
    files: project.files?.map((file) => ({
      id: file.id,
      name: file.name,
      url: file.url,
      mimeType: file.mimeType,
    })),
  }
}

export async function getProjects(options?: ProjectQueryOptions): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    ...PROJECT_WITH_RELATIONS,
    where: {
      ...buildVisibilityWhere(options),
    },
  })
  return projects.map(mapProject)
}

export async function getProjectById(id: string, options?: ProjectQueryOptions): Promise<Project | null> {
  const project = await prisma.project.findUnique({
    ...PROJECT_WITH_RELATIONS,
    where: {
      id,
      ...buildVisibilityWhere(options),
    },
  })
  return project ? mapProject(project) : null
}

export async function getProjectsByArea(area: AreaInteresse, options?: ProjectQueryOptions): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    ...PROJECT_WITH_RELATIONS,
    where: {
      area,
      ...buildVisibilityWhere(options),
    },
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
  createdById: string
  files?: ProjectFileInput[]
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const project = await prisma.project.create({
    ...PROJECT_WITH_RELATIONS,
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
      createdById: input.createdById,
      accessRules: {
        create: {
          userId: input.createdById,
          canView: true,
          canEdit: true,
          canManage: true,
        },
      },
      files: input.files?.length
        ? {
            create: input.files.map((file) => ({
              name: file.name,
              url: file.url,
              mimeType: file.mimeType,
            })),
          }
        : undefined,
    },
  })

  return mapProject(project)
}

export type UpdateProjectInput = {
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
  files?: ProjectFileInput[]
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  await prisma.project.update({
    ...PROJECT_WITH_RELATIONS,
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      area: input.area,
      status: input.status,
      priority: input.priority,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      visibility: input.visibility === "restricted" ? "RESTRICTED" : "PUBLIC",
      featured: input.featured ?? false,
      image: input.image ?? null,
    },
  })

  if (input.files) {
    const keepIds = input.files.filter((file) => file.id).map((file) => file.id as string)

    await prisma.projectFile.deleteMany({
      where: {
        projectId: id,
        ...(keepIds.length
          ? {
              NOT: {
                id: {
                  in: keepIds,
                },
              },
            }
          : {}),
      },
    })

    const newFiles = input.files.filter((file) => !file.id)
    for (const file of newFiles) {
      await prisma.projectFile.create({
        data: {
          projectId: id,
          name: file.name,
          url: file.url,
          mimeType: file.mimeType,
        },
      })
    }
  }

  const project = await prisma.project.findUnique({
    ...PROJECT_WITH_RELATIONS,
    where: { id },
  })

  if (!project) {
    throw new Error("Projeto não encontrado após atualização.")
  }

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
