"use server"

import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import type {
  AreaInteresse,
  Project,
  ProjectStatus,
  ProjectVisibility,
  ProjectTask,
  ProjectTaskStatus,
  ProjectComment,
  CommentAttachment,
  ProjectTimelineEntry,
  ProjectFile,
  ProjectFileCategory,
} from "@/lib/types"

const PROJECT_WITH_RELATIONS = {
  include: {
    team: {
      include: {
        teamMember: true,
      },
    },
    files: true,
    tasks: {
      include: {
        responsible: true,
      },
      orderBy: [
        {
          order: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    },
    comments: {
      include: {
        author: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    },
    timeline: {
      orderBy: {
        startDate: "asc",
      },
    },
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
  category?: ProjectFileCategory
  position?: "top" | "center" | "bottom"
}

function normalizeFileCategory(category?: string | null): ProjectFileCategory {
  const value = (category ?? "ANEXO").toLowerCase()
  if (value === "background") return "background"
  if (value === "destaque") return "destaque"
  if (value === "comprovacao") return "comprovacao"
  return "anexo"
}

function toDbFileCategory(category?: ProjectFileCategory | null) {
  const normalized = normalizeFileCategory(category ?? undefined)
  switch (normalized) {
    case "background":
      return "BACKGROUND"
    case "destaque":
      return "DESTAQUE"
    case "comprovacao":
      return "COMPROVACAO"
    default:
      return "ANEXO"
  }
}

function normalizeFilePosition(position?: string | null): "top" | "center" | "bottom" {
  const value = (position ?? "center").toLowerCase()
  if (value === "top") return "top"
  if (value === "bottom") return "bottom"
  return "center"
}

function toDbFilePosition(position?: "top" | "center" | "bottom" | null) {
  return normalizeFilePosition(position ?? undefined)
}

function mapFile(file: {
  id: string
  name: string
  url: string
  mimeType: string
  category: string | null
  position?: string | null
}): ProjectFile {
  return {
    id: file.id,
    name: file.name,
    url: file.url,
    mimeType: file.mimeType,
    category: normalizeFileCategory(file.category),
    position: normalizeFilePosition(file.position ?? null),
  }
}

function mapTask(task: Prisma.ProjectTaskGetPayload<{ include: { responsible: true } }>): ProjectTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    status: task.status.toLowerCase() as ProjectTaskStatus,
    startDate: task.startDate ? task.startDate.toISOString() : undefined,
    dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
    completedAt: task.completedAt ? task.completedAt.toISOString() : undefined,
    responsible: task.responsible
      ? {
          id: task.responsible.id,
          name: task.responsible.name,
          email: task.responsible.email,
        }
      : undefined,
    order: task.order,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }
}

function mapComment(comment: Prisma.ProjectCommentGetPayload<{ include: { author: true } }>): ProjectComment {
  return {
    id: comment.id,
    content: comment.content,
    attachments: Array.isArray(comment.attachments) ? (comment.attachments as CommentAttachment[]) : undefined,
    author: {
      id: comment.author.id,
      name: comment.author.name,
      email: comment.author.email,
    },
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  }
}

function mapTimelineEntry(entry: Prisma.ProjectTimelineEntryGetPayload<{}>): ProjectTimelineEntry {
  return {
    id: entry.id,
    label: entry.label,
    description: entry.description ?? undefined,
    type: entry.type.toLowerCase() as ProjectTimelineEntry["type"],
    startDate: entry.startDate.toISOString(),
    endDate: entry.endDate.toISOString(),
    taskId: entry.taskId ?? undefined,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }
}

function mapProject(project: ProjectWithRelations): Project {
  const files = project.files?.map((file) => mapFile(file)) ?? []
  const tasks = project.tasks?.map((task) =>
    mapTask(
      task as Prisma.ProjectTaskGetPayload<{
        include: { responsible: true }
      }>,
    ),
  ) ?? []
  const comments =
    project.comments?.map((comment) =>
      mapComment(
        comment as Prisma.ProjectCommentGetPayload<{
          include: { author: true }
        }>,
      ),
    ) ?? []
  const timeline = project.timeline?.map((entry) => mapTimelineEntry(entry)) ?? []
  const completedTasks = tasks.filter((task) => task.status === "concluida").length
  const computedProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : project.progress

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    area: project.area as AreaInteresse,
    status: project.status as ProjectStatus,
    progress: computedProgress,
    startDate: project.startDate.toISOString(),
    endDate: project.endDate.toISOString(),
    priority: project.priority as Project["priority"],
    featured: project.featured ?? undefined,
    image: project.image ?? undefined,
    imagePosition: (project as any).imagePosition ?? undefined,
    visibility: (project.visibility ?? "PUBLIC").toLowerCase() as ProjectVisibility,
    createdById: project.createdById ?? undefined,
    team: project.team.map(({ teamMember }) => ({
      id: teamMember.id,
      name: teamMember.name,
      role: teamMember.role,
      avatar: teamMember.avatar ?? undefined,
    })),
    files,
    tasks,
    comments,
    timeline,
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
  imagePosition?: "top" | "center" | "bottom"
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
      imagePosition: input.imagePosition ?? null,
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
              category: toDbFileCategory(file.category),
              position: toDbFilePosition(file.position),
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
  imagePosition?: "top" | "center" | "bottom"
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
      imagePosition: input.imagePosition ?? null,
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
          category: toDbFileCategory(file.category),
          position: toDbFilePosition(file.position),
        },
      })
    }

    const filesToUpdate = input.files.filter((file) => file.id)
    for (const file of filesToUpdate) {
      await prisma.projectFile.update({
        where: { id: file.id },
        data: {
          name: file.name,
          mimeType: file.mimeType,
          url: file.url,
          category: toDbFileCategory(file.category),
          position: toDbFilePosition(file.position),
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

export async function deleteProject(id: string): Promise<void> {
  await prisma.project.delete({
    where: { id },
  })
}

type CreateTaskInput = {
  title: string
  description?: string
  startDate?: string
  dueDate?: string
  status?: ProjectTaskStatus
  responsibleEmail?: string
}

type UpdateTaskInput = Partial<CreateTaskInput> & {
  status?: ProjectTaskStatus
}

async function findUserIdByEmail(email?: string | null) {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null
  const user = await prisma.user.findUnique({ where: { email: normalized } })
  return user?.id ?? null
}

export async function createProjectTask(projectId: string, input: CreateTaskInput): Promise<ProjectTask> {
  const order = await prisma.projectTask.count({ where: { projectId } })
  const responsibleId = await findUserIdByEmail(input.responsibleEmail)
  const status = (input.status ?? "nao_iniciada").toUpperCase()

  const task = await prisma.projectTask.create({
    data: {
      projectId,
      title: input.title,
      description: input.description ?? null,
      status,
      responsibleId,
      startDate: input.startDate ? new Date(input.startDate) : null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      completedAt: status === "CONCLUIDA" ? new Date() : null,
      order,
    },
    include: { responsible: true },
  })

  return mapTask(task)
}

export async function updateProjectTask(taskId: string, input: UpdateTaskInput): Promise<ProjectTask> {
  const status = input.status ? input.status.toUpperCase() : undefined
  let responsibleValue: string | null | undefined = undefined
  if (input.responsibleEmail !== undefined) {
    responsibleValue = await findUserIdByEmail(input.responsibleEmail)
  }

  const data: Prisma.ProjectTaskUpdateInput = {}

  if (input.description !== undefined) {
    data.description = input.description ?? null
  }
  if (input.title !== undefined) {
    data.title = input.title
  }
  if (input.startDate !== undefined) {
    data.startDate = input.startDate ? new Date(input.startDate) : null
  }
  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate ? new Date(input.dueDate) : null
  }
  if (status) {
    data.status = status
    data.completedAt = status === "CONCLUIDA" ? new Date() : null
  }

  if (responsibleValue !== undefined) {
    data.responsibleId = responsibleValue
  }

  const task = await prisma.projectTask.update({
    where: { id: taskId },
    data,
    include: { responsible: true },
  })

  return mapTask(task)
}

export async function deleteProjectTask(taskId: string): Promise<void> {
  await prisma.projectTask.delete({ where: { id: taskId } })
}

export async function getProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const tasks = await prisma.projectTask.findMany({
    where: { projectId },
    include: { responsible: true },
    orderBy: [
      { order: "asc" },
      { createdAt: "asc" },
    ],
  })
  return tasks.map((task) => mapTask(task))
}

type CommentInput = {
  content: string
  attachments?: CommentAttachment[]
}

export async function createProjectComment(projectId: string, authorId: string, input: CommentInput): Promise<ProjectComment> {
  const comment = await prisma.projectComment.create({
    data: {
      projectId,
      authorId,
      content: input.content,
      attachments: input.attachments ?? [],
    },
    include: { author: true },
  })

  return mapComment(comment)
}

export async function updateProjectComment(commentId: string, input: CommentInput): Promise<ProjectComment> {
  const comment = await prisma.projectComment.update({
    where: { id: commentId },
    data: {
      content: input.content,
      attachments: input.attachments === undefined ? undefined : input.attachments,
    },
    include: { author: true },
  })

  return mapComment(comment)
}

export async function deleteProjectComment(commentId: string): Promise<void> {
  await prisma.projectComment.delete({ where: { id: commentId } })
}

export async function getProjectComments(projectId: string): Promise<ProjectComment[]> {
  const comments = await prisma.projectComment.findMany({
    where: { projectId },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  })
  return comments.map((comment) => mapComment(comment))
}

type TimelineEntryInput = {
  label: string
  description?: string
  startDate: string
  endDate: string
  type: ProjectTimelineEntry["type"]
  taskId?: string
}

export async function createTimelineEntry(projectId: string, input: TimelineEntryInput): Promise<ProjectTimelineEntry> {
  const entry = await prisma.projectTimelineEntry.create({
    data: {
      projectId,
      label: input.label,
      description: input.description ?? null,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      type: input.type.toUpperCase(),
      taskId: input.taskId ?? null,
    },
  })

  return mapTimelineEntry(entry)
}

export async function updateTimelineEntry(entryId: string, input: Partial<TimelineEntryInput>): Promise<ProjectTimelineEntry> {
  const entry = await prisma.projectTimelineEntry.update({
    where: { id: entryId },
    data: {
      label: input.label,
      description: input.description === undefined ? undefined : input.description ?? null,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      type: input.type ? input.type.toUpperCase() : undefined,
      taskId: input.taskId === undefined ? undefined : input.taskId ?? null,
    },
  })

  return mapTimelineEntry(entry)
}

export async function deleteTimelineEntry(entryId: string): Promise<void> {
  await prisma.projectTimelineEntry.delete({ where: { id: entryId } })
}

export async function getTimelineEntries(projectId: string): Promise<ProjectTimelineEntry[]> {
  const entries = await prisma.projectTimelineEntry.findMany({
    where: { projectId },
    orderBy: { startDate: "asc" },
  })
  return entries.map((entry) => mapTimelineEntry(entry))
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
